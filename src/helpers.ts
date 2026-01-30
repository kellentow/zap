import { crypto_manager, crypto_session } from "./crypto";
import { Account, Message, zapGlobals } from "./main.d";
import { msg_container } from "./elements";
import { initialRender } from "./loops";

let FAVICON_UNREAD = "";
let FAVICON_READ = "";

async function canvas_to_b64(canvas: OffscreenCanvas): Promise<string> {
        let blob = await canvas.convertToBlob({ type: 'image/png' });
        let reader = new FileReader();
        let base64data: string = "";
        await new Promise((resolve) => {
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                base64data = reader.result as string;
                resolve(null);
            };
        });
        return base64data
    }

;(async ()=>{
    // making the logo in ram is bad juju but we ball
    let canvas = new OffscreenCanvas(128,128); 
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffea00";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    let points = [
        { x:0.703125 , y:0.6015625 },
        { x:0.3984375, y:0.1015625 },
        { x:0.5      , y:0.5       },
        { x:0.296875 , y:0.5       },
        { x:0.6015625, y:1         },
        { x:0.5      , y:0.6015625 },
        { x:0.703125 , y:0.6015625 },
    ]
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        if (i == 0) {
            ctx.moveTo(p.x*128, p.y*128);
        } else {
            ctx.lineTo(p.x*128, p.y*128);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    FAVICON_READ = await canvas_to_b64(canvas)
    set_favicon(FAVICON_READ);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#FF0000";
    ctx.beginPath();

    ctx.ellipse(16, 16, 16, 16, 0, 0, 2 * Math.PI);

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    FAVICON_UNREAD = await canvas_to_b64(canvas)
})();

let encryption_enabled = false; // config
let encryption_ready = false;
let session_crypto: crypto_manager = null
if (encryption_enabled) {
    crypto_manager.init().then((manager) => {
        session_crypto = manager
        encryption_ready = true;
    });
} else {
    if (document.visibilityState == "visible") {
        if (!confirm(
            "Encryption cannot be used at this time.\n" +
            "Hit OK to continue without encryption.\n" +
            "Hit Cancel to leave the page."
        )) {
            window.location.href = "about:blank";
        }
    }
}

function set_favicon(iconUrl: string) {
    // Create a new link element
    var link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = iconUrl;
    
    // Remove existing favicons
    var head = document.getElementsByTagName('head')[0];
    var existingIcons = head.querySelectorAll('link[rel~="icon"]');
    existingIcons.forEach(function(icon) {
        head.removeChild(icon);
    });
    
    // Append the new link element to the head
    head.appendChild(link);
}

function sendNotification(title: string, message: string) {
    // Only send if page is hidden and notifications are allowed
    if (document.hidden && Notification.permission === "granted") {
        new Notification(title, { body: message });
    }
}

let formatDate = function formatDate(date: Date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthName = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${monthName} ${day} ${hours}:${minutes}:${seconds}`;
}

function change_room_binder(global: zapGlobals, room: string, element: HTMLElement) {
    return function () {
        msg_container.innerHTML = "";
        global.room = room;
        console.debug("Changed room to:", room);
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
        load_db(global.db, "messages").then((messages) => {
            messages.forEach((element:Message) => {
                console.debug(element.id,element.id.startsWith(global.room + "--"));
            });
            let room_messages: Message[] = (messages.filter((a: Message) => { return a.id && a.id.startsWith(global.room + "--") }) as Message[])
            global.messages[global.room]=[...room_messages];
            global.messages[global.room].sort((a, b) => { return a.timestamp - b.timestamp })
            global.lastRenderedIndex = 0;
            global.reTick = true;
            global.firstRenderedIndex = 0;
            global.lastRenderedIndex = 0; // Reset last rendered index when changing room
            initialRender(global);
        })
        global.reTick = true;
        let send_join = function () {
            if (!encryption_ready) {
                return setTimeout(send_join, 10) // wait to send keys since don't have any yet
            }
            senders.join(global)
            senders.crypto_request(global)
        }
        send_join()
    };
}

if (typeof window.send !== 'function') {
    console.warn("send() not defined. Environment should provide `window.send`.");
}

function lbsend(a: any, b: any, c: any, d: any, encrypt: boolean = undefined, encryption_sessions: crypto_session[] = []) {
    if (typeof encrypt == "undefined") {
        encrypt = true
    }
    if (encrypt && encryption_ready) {
        let messages: any[][] = []

        let allPromises = encryption_sessions.map((session) => {
            let enc_a = session.encrypt(JSON.stringify(a)).catch(err => {
                console.error("enc_a failed", err, JSON.stringify(a), a);
                throw err;
            });;
            let enc_b = session.encrypt(JSON.stringify(b)).catch(err => {
                console.error("enc_b failed", err, JSON.stringify(b), b);
                throw err;
            });;
            let enc_c = session.encrypt(JSON.stringify(c)).catch(err => {
                console.error("enc_c failed", err, JSON.stringify(c), c);
                throw err;
            });;
            let enc_d = session.encrypt(JSON.stringify(d)).catch(err => {
                console.error("enc_d failed", err, JSON.stringify(d), d);
                throw err;
            });;
            return Promise.all([enc_a, enc_b, enc_c, enc_d])
                .then(([a, b, c, d]) => {
                    let str_a = arrayBufferToBase64(a)
                    let str_b = arrayBufferToBase64(b)
                    let str_c = arrayBufferToBase64(c)
                    let str_d = arrayBufferToBase64(d)
                    messages.push([str_a, str_b, str_c, str_d, session.id])
                });
        });

        Promise.all(allPromises).then(() => {
            let str_msgs = JSON.stringify(messages)
            lbsend(str_msgs, null, null, null, false)
        });
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
function save_db_key(db: IDBDatabase, table: string, value: any, key?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialized"));
            return;
        }
        const tx = db.transaction(table, "readwrite");
        const store = tx.objectStore(table);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function load_db_key<T>(db: IDBDatabase, table: string, key: string, Default: T): Promise<T> {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialized"));
            return;
        }
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

function base64ToArrayBuffer(base64: string) {
    let binary = atob(base64);
    let len = binary.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

let senders: {
    message: Function, ping: Function, join: Function
    crypto: Function, crypto_request: Function, crypto_response: Function,
    request_history: Function, send_history: Function,
    base: Function, bind: Function
} = {
    message: function (global: zapGlobals, text: string, recipients?: string[]) { // Send a message
        if (typeof text !== "string") {
            text = JSON.stringify(text);
        }
        //if (text.length > 2 ** 12) { //4kb max
        //    console.warn("Message too long, not sending.");
        //    return;
        //}
        let time = Date.now();
        let message_id = `${global.room}--${crypto.randomUUID()}-${crypto.randomUUID()}`
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.get_session(r)).filter(s => s) : []
        lbsend(0, JSON.stringify(global.account), [time, text, message_id], global.room, encryption_enabled, recipients_sessions);
    },
    ping: function (global: zapGlobals, status:string, recipients?: string[]) { // Send a ping
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.get_session(r)).filter(s => s) : []
        lbsend(1, JSON.stringify(global.account), {now: Date.now(), status: status}, global.room, encryption_enabled, recipients_sessions);
    },
    join: function (global: zapGlobals) { // Send a join notif
        lbsend(2, JSON.stringify(global.account), Date.now(), global.room, false)
        senders.crypto_request(global)
        senders.request_history(global)
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
        if (encryption_ready && typeof global.account != "undefined") {
            window.crypto.subtle.exportKey("spki", session_crypto.self_keys.publicKey).then((exported) => {
                senders.crypto(global, { type: "KEYresponse", id: global.account.id, public: arrayBufferToBase64(exported) });
            });
        } else {
            setTimeout(senders.crypto_response, 100, [global])
        }
    },
    request_history: function (global: zapGlobals, recipients?: string[]) {
        let ids = global.messages[global.room].map(((v, i, a) => { return v.id }))
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.get_session(r)).filter(s => s) : []
        lbsend(3, global.account, ids, global.room, encryption_enabled, recipients_sessions)
    },
    send_history: function (global: zapGlobals, ids: string[], recipients?: string[]) {

        let msgs = global.messages[global.room].map(((v, i, a) => { return ids.indexOf(v.id) != -1 ? v : null }))
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.get_session(r)).filter(s => s) : []
        lbsend(4, global.account, msgs, global.room, encryption_enabled, recipients_sessions)
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
    history_request: Function, recieve_history: Function,
    all: Function, bind: Function
} = {
    message: function (global: zapGlobals, account: Account, content: [timestamp: number, message: string, id: string], room: string) {
        var timestamp = content[0], message = content[1], id = content[2];
        console.debug("Received message in room ".concat(room, ":"), { timestamp, account, message });
        if (document.hidden) {
            set_favicon(FAVICON_UNREAD);
            sendNotification("Zap Messenger:  " + account.name + " sent you a message!", message);
        }
        let new_message: Message = {
            timestamp: timestamp,
            account,
            content: message,
            id
        }
        global.messages[room].push(new_message);
        save_db_key(global.db, "messages", new_message).catch((e) => {
            console.error("Error saving message to DB:", e);
        }).then(() => {
            global.reTick = true;
        });
    },
    ping: function (global: zapGlobals, account: Account, content: {now:number, status:string}, room: string) {
        if (!Object.prototype.hasOwnProperty.call(global.online, room)) {
            global.online[room] = [];
        }
        global.online[room].unshift({ account, last: content.now, status: content.status});
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
            senders.crypto_response(global, account);
        } else if (content.type == "KEYresponse") {
            if (content.public && content.public != "E2EE DENIED") {
                let session = session_crypto.add_session(account.id, content.public);
            } else {
                console.warn("User ".concat(account.id, " denied sending their public key."));
            }
        } else {
            console.warn("Unknown crypto message type:", content);
        }
    },
    history_request: function (global: zapGlobals, account: Account, content: string[], room: string) {
        let recievers = global.online[global.room].map(((v, i, a) => { return v.account.id }))
        senders.send_history(global, content, recievers)
    },
    recieve_history: function (global: zapGlobals, account: Account, content: Message[], room: string) {
        let ids: string[] = global.messages[global.room].map(((v, i, a) => { return v.id }))
        for (let i = 0; i < content.length; i++) {
            let msg = content[i]
            if (ids.indexOf(msg.id) == -1) {
                global.messages[room].push(msg)
            }
        }
    },
    all: async function (global: zapGlobals, type: number | string, stringed_account?: string, content?: any, room?: string) {
        if (stringed_account == null) { // Encrypted message, find our block
            let enc_msg: string[][] = (JSON.parse((type as string)) as string[][])

            for (let i = 0; i < (enc_msg.length); i++) {
                let message = enc_msg[i]
                if (message[4] == global.account.id) {
                    type = JSON.parse(await (session_crypto.decrypt(base64ToArrayBuffer(message[0]))))
                    stringed_account = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[1])))
                    content = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[2])))
                    room = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[3])))

                    return await recievers.all(global, type, stringed_account, content, room);
                }
            };
            console.debug("No block for us in encrypted message, ignoring.");
            return;
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
                    if (type == 3) { recievers.history_request(global, account, content, room) } else
                        if (type == 4) { recievers.recieve_history(global, account, content, room) } else
                            if (type == 255) { recievers.crypto(global, account, content, room) } else { console.warn(`${type} is a unknown message type`) }
        global.reTick = true
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

export { save, load, save_db_key, load_db, load_db_key, senders, recievers, sendNotification, change_room_binder, formatDate, set_favicon, FAVICON_READ, FAVICON_UNREAD,canvas_to_b64}
