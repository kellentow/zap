import { Account, Message, zapGlobals } from "./main.d";
import { msg_container } from "./elements"

function sendNotification(title: string, message: string) {
    // Only send if page is hidden and notifications are allowed
    if (document.hidden && Notification.permission === "granted") {
        new Notification(title, { body: message });
    }
}

function change_room_binder(global: zapGlobals, room: string, element: HTMLElement) {
    return function () {
        global.lastRenderedIndex = 0; // Reset last rendered index when changing room
        msg_container.innerHTML = "";
        global.room = room;
        console.log("Changed room to:", room);
        // Optionally, clear the messages for the new room
        global.messages[room] = global.messages[room] || [];
        global.servers.forEach(function (server) {
            let server_div = document.getElementById("server_" + server.id);
            if (server_div) {
                server_div.classList.remove("selected");
            }
        });
        if (element) {
            element.classList.add("selected");
        }
        global.reTick = true;
    };
}

if (typeof window.send !== 'function') {
    console.warn("send() not defined. Using mock send.");
    window.send = function (a: any, b: any, c: any, d: any) {
        console.debug("Mock send triggered with:", [a, b, c, d]);
    };
}

function lbsend(a: any, b: any, c: any, d: any) {
    window.send(a, b, c, d);
    window.get(a, b, c, d);
}

function save(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
}
function load(key: string, Default: any) {
    let value = localStorage.getItem(key);
    if (value) {
        try {
            return JSON.parse(value);
        }
        catch (e) {
            console.error("Error parsing JSON for key ".concat(key, ":"), e);
            return Default;
        }
    }
    return Default;
}
function save_db_key(db: IDBDatabase, table: string, key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(table, "readwrite");
        const store = tx.objectStore(table);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function load_db_key<T>(db: IDBDatabase, table: string, key: string, Default: T): Promise<T> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(table, "readonly");
        const store = tx.objectStore(table);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ?? Default);
        request.onerror = () => reject(request.error);
    });
}

function load_db<T>(db: IDBDatabase, table: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(table, "readonly");
        const store = tx.objectStore(table);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

let senders: { message: Function, ping: Function, any: Function, bind: Function } = {
    message: function (global: zapGlobals, text: string) {
        let time = Date.now();
        lbsend(0, JSON.stringify(global.account), [time, text, `${global.room}/"${crypto.randomUUID()}-${crypto.randomUUID()}`], global.room);
    },
    ping: function (global: zapGlobals) {
        lbsend(1, JSON.stringify(global.account), Date.now(), global.room);
    },
    any: window.send,
    bind: function (global: zapGlobals) {
        let new_sender: any = {}
        Object.entries(senders).forEach(([k, v]) => {
            new_sender[k] = function (...args: any[]) {
                v(global, ...args)
            }
        })
        return new_sender
    }
}

let recievers: { message: Function, ping: Function, all:Function, bind:Function} = {
    message: function (global: zapGlobals, account: Account, content: [timestamp: number, message: string, id:string], room: string) {
        var timestamp = content[0], message = content[1], id = content[2];
        console.debug("Received message in room ".concat(room, ":"), { timestamp, account, message });
        sendNotification("Zap Messenger:  " + account.name + " sent you a message!", message);
        let new_message:Message = {
            timestamp: timestamp,
            account,
            content: message,
            id
        }
        global.messages[room].push(new_message);
        save_db_key(global.db,"messages",id,new_message);
    },
    ping: function (global: zapGlobals, account: Account, content: number, room: string) {
        if (!Object.prototype.hasOwnProperty.call(global.online, room)) {
            global.online[room] = [];
        }
        let old_l = global.online[room].filter(function (v) { v.account.id == account.id; });
        if (old_l.length == 0) {
            old_l = [{ account, last: 20000, list: [], avg: Date.now() }];
        }
        let old = old_l[0];
        var list = old.list, last = old.last;
        last = Date.now() - content;
        list.push(last);
        if (list.length > 10) {
            list.shift();
        }
        let avg_1 = 0;
        list.forEach(function (delta) {
            avg_1 += delta;
        });
        avg_1 /= list.length;
        global.online[room].unshift({ account, last: content, list: list, avg: avg_1 });
    },
    all: function (global: zapGlobals, type: number, stringed_account: string, content: any, room: string) {
        if (!global) {
            return;
        } // Make sure site is loaded fully first
        if (!global.messages[room]) {
            global.messages[room] = [];
        }
        let account: Account;
        try {
            account = JSON.parse(stringed_account);
        } catch (e) {
            console.error("Invalid JSON acc:", e.message, stringed_account);
            return;
        }
        if (type == 0) { recievers.message(global,account, content, room) } else
        if (type == 1) { recievers.ping(global,account, content, room) } else
        { console.warn(`${type} is a unknown message type`) }
    },
    bind: function (global:zapGlobals) {
        let new_funcs:any = {}
        new_funcs.message = (...args:any[]) => {recievers.message(global,...args)}
        new_funcs.ping = (...args:any[]) => {recievers.ping(global,...args)}
        new_funcs.all = (...args:any[]) => {recievers.all(global,...args)}
        return new_funcs
    }
}

export { save, load, save_db_key, load_db, load_db_key, senders, recievers, sendNotification, change_room_binder }