import { Account, Message, zapGlobals } from "./main.d";
import { msg_container } from "./elements";
import { crypto_manager, crypto_session } from "./crypto";

let session_crypto: crypto_manager = null
crypto_manager.init().then((manager) => {
    session_crypto = manager
});

let encrytion_enabled = true;

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

function lbsend(a: any, b: any, c: any, d: any, encrypt: boolean = undefined, encryption_sessions: crypto_session[] = []) {
    if (typeof encrypt == "undefined") {
        encrypt = encrytion_enabled
    }
    if (encrypt) {
        let messages: any[][] = []
        encryption_sessions.forEach((session) => {
            let enc_a = session.encrypt(JSON.stringify(a));
            let enc_b = session.encrypt(JSON.stringify(b));
            let enc_c = session.encrypt(JSON.stringify(c));
            let enc_d = session.encrypt(JSON.stringify(d));
            Promise.all([enc_a, enc_b, enc_c, enc_d]).then(([a, b, c, d]) => {
                messages.push([a, b, c, d, session.id])
            })
        })
        lbsend(messages, null, null, null, false)
    } else {
        window.send(a, b, c, d);
        window.get(a, b, c, d);
    }
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

let senders: {
    message: Function, ping: Function, join: Function
    crypto: Function, crypto_request: Function, crypto_response: Function,
    base: Function, bind: Function
} = {
    message: function (global: zapGlobals, text: string, recipients?: string[]) { // Send a message
        if (typeof text !== "string") {
            text = JSON.stringify(text);
        }
        if (text.length > 2 ** 12) { //4kb max
            console.warn("Message too long, not sending.");
            return;
        }
        let time = Date.now();
        let message_id = `${global.room}/"${crypto.randomUUID()}-${crypto.randomUUID()}`
        let recipients_sessions: crypto_session[] = (encrytion_enabled && recipients) ? recipients.map(r => session_crypto.get_session(r)).filter(s => s) : []
        lbsend(0, JSON.stringify(global.account), [time, text, message_id], global.room, undefined, recipients_sessions);
    },
    ping: function (global: zapGlobals, recipients?: string[]) { // Send a ping
        let recipients_sessions: crypto_session[] = (encrytion_enabled && recipients) ? recipients.map(r => session_crypto.get_session(r)).filter(s => s) : []
        lbsend(1, JSON.stringify(global.account), Date.now(), global.room, true, recipients_sessions);
    },
    join: function (global: zapGlobals) { // Send a join notif
        lbsend(2, JSON.stringify(global.account), Date.now(), global.room, false)
        senders.crypto_request(global)
    },
    crypto: function (global: zapGlobals, message: any) { // crypto base
        if (typeof message !== "string") {
            message = JSON.stringify(message);
        }
        lbsend(255, JSON.stringify(global.account), message, global.room, false);
    },
    crypto_request: function (global: zapGlobals) { // Request a public key
        senders.crypto(global, { type: "KEYrequest", id: global.account.id });
    },
    crypto_response: function (global: zapGlobals) { // Send your public key
        window.crypto.subtle.exportKey("spki", session_crypto.self_keys.publicKey).then((exported) => {
            senders.crypto(global, { type: "KEYresponse", id: global.account.id, public: btoa(String.fromCharCode(...new Uint8Array(exported))) }); // add stringified public key here
        });
    },
    base: function (global: zapGlobals, a: any, b: any, c: any, d: any) { window.send(a, b, c, d) },
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

let recievers: {
    message: Function, ping: Function,
    crypto: Function, join: Function,
    all: Function, bind: Function
} = {
    message: function (global: zapGlobals, account: Account, content: [timestamp: number, message: string, id: string], room: string) {
        var timestamp = content[0], message = content[1], id = content[2];
        console.debug("Received message in room ".concat(room, ":"), { timestamp, account, message });
        sendNotification("Zap Messenger:  " + account.name + " sent you a message!", message);
        let new_message: Message = {
            timestamp: timestamp,
            account,
            content: message,
            id
        }
        global.messages[room].push(new_message);
        save_db_key(global.db, "messages", id, new_message);
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
    join: function (global: zapGlobals, account: Account, content: number, room: string) { //ping but only once and unencrypted
        recievers.ping(global, account, content, room)
    },
    crypto: function (global: zapGlobals, account: Account, content: any, room: string) {
        if (typeof content === "string") {
            try {
                content = JSON.parse(content);
            } catch (e) {
                console.error("Invalid JSON crypto:", e.message, content);
                return;
            }
        }

        if (!content.type) {
            console.warn("No type in crypto message:", content);
            return;
        }

        if (content.version > crypto_manager.version) {
            console.warn("Other user is on a newer version of the cryptography manager:", content.version, ">", crypto_manager.version);
            console.warn("Some features may not work as expected and may cause glitches.");
        }

        if (content.type == "KEYrequest") {
            console.log("Received key request from", account.id);
            senders.crypto_response(global, account);
        } else if (content.type == "KEYresponse") {
            console.log("Received key response from", account.id, content);
            if (content.public && content.public != "E2EE DENIED") {
                let session = session_crypto.add_session(account.id, content.public);
            } else {
                console.warn("User ".concat(account.id, " denied sending their public key."));
            }
        } else {
            console.warn("Unknown crypto message type:", content);
        }
    },
    all: async function (global: zapGlobals, type: number | any[], stringed_account?: string, content?: any, room?: string) {
        console.log("type:", type, "account:", stringed_account, "content:", content, "room:", room)
        if (!stringed_account) { // Encrypted message, find our block
            for (let i = 0; i < (type as any[]).length; i++) {
                let message = (type as any[])[i]
                if (message[4] == global.account.id) {
                    type = JSON.parse(await session_crypto.decrypt(message[0]))
                    stringed_account = JSON.parse(await session_crypto.decrypt(message[1]))
                    content = JSON.parse(await session_crypto.decrypt(message[2]))
                    room = JSON.parse(await session_crypto.decrypt(message[3]))
                    console.log("Decrypted message:", { type, stringed_account, content, room })
                    break;
                }
            }
            if (!stringed_account) {
                console.warn("No block for us in encrypted message, ignoring.");
                return;
            }
        }

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
        if (type == 0) { recievers.message(global, account, content, room) } else
            if (type == 1) { recievers.ping(global, account, content, room) } else
                if (type == 2) { recievers.join(global, account, content, room) } else
                    if (type == 255) { recievers.crypto(global, account, content, room) } else { console.warn(`${type} is a unknown message type`) }
    },
    bind: function (global: zapGlobals) {
        let new_funcs: any = {}
        new_funcs.message = (...args: any[]) => { recievers.message(global, ...args) }
        new_funcs.ping = (...args: any[]) => { recievers.ping(global, ...args) }
        new_funcs.join = (...args: any[]) => { recievers.join(global, ...args) }
        new_funcs.crypto = (...args: any[]) => { recievers.crypto(global, ...args) }
        new_funcs.all = (...args: any[]) => { recievers.all(global, ...args) }
        return new_funcs
    }
}

export { save, load, save_db_key, load_db, load_db_key, senders, recievers, sendNotification, change_room_binder }