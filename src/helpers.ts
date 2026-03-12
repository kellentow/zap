import { crypto_manager, crypto_session } from "./crypto";
import { Account, Message, zapGlobals } from "./main.d";
import { msg_container } from "./elements";
import { initialRender } from "./loops";
import Showdown from "showdown";

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

; (async () => {
    // making the logo in ram is bad juju but we ball
    let canvas = new OffscreenCanvas(128, 128);
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffea00";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    let points = [
        { x: 0.703125, y: 0.6015625 },
        { x: 0.3984375, y: 0.1015625 },
        { x: 0.5, y: 0.5 },
        { x: 0.296875, y: 0.5 },
        { x: 0.6015625, y: 1 },
        { x: 0.5, y: 0.6015625 },
        { x: 0.703125, y: 0.6015625 },
    ]
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        if (i == 0) {
            ctx.moveTo(p.x * 128, p.y * 128);
        } else {
            ctx.lineTo(p.x * 128, p.y * 128);
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

let encryption_enabled = true; // config
let encryption_ready = false;
let session_crypto: crypto_manager = null
if (encryption_enabled) {
    let manager = crypto_manager.init()
    session_crypto = manager
    encryption_ready = true;
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
    existingIcons.forEach(function (icon) {
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
        load_db_keys(global.db, "messages").then(async (keys) => {
            console.debug("Loaded message keys from DB:", keys);
            let recent: Message[] = [];
            keys.forEach(async (key) => {
                if (key.startsWith(global.room + "--")) {
                    let msg = await load_db_key(global.db, "messages", key, null);
                    if (msg) {
                        recent.push(msg);
                    }
                    recent.sort((a, b) => { return a.timestamp - b.timestamp })
                    for (let i = 50; i < recent.length; i++) {
                        recent[i] = {
                            id: recent[i].id,
                            timestamp: recent[i].timestamp,
                            content: "",
                            loaded: false,
                            account: recent[i].account
                        }
                    }
                    global.messages[global.room] = recent;
                    global.lastRenderedIndex = 0;
                    global.reTick = true;
                    global.firstRenderedIndex = 0;
                    global.lastRenderedIndex = 0; // Reset last rendered index when changing room
                    initialRender(global);
                }
            });
        });
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


function lbsend(a: any, b: any, c: any, d: any, encrypt: boolean = undefined, encryption_sessions: crypto_session[] = []) {
    if (typeof encrypt == "undefined") {
        encrypt = true
    }
    if (encrypt && encryption_ready) {
        let messages: any[][] = []

        let allPromises = encryption_sessions.map((session) => {
            let enc_a = session.encrypt(JSON.stringify(a))
            let enc_b = session.encrypt(JSON.stringify(b))
            let enc_c = session.encrypt(JSON.stringify(c))
            let enc_d = session.encrypt(JSON.stringify(d))
            return Promise.all([enc_a, enc_b, enc_c, enc_d])
                .then(([a, b, c, d]) => {
                    let str_a = arrayBufferToBase64(a.buffer as ArrayBuffer)
                    let str_b = arrayBufferToBase64(b.buffer as ArrayBuffer)
                    let str_c = arrayBufferToBase64(c.buffer as ArrayBuffer)
                    let str_d = arrayBufferToBase64(d.buffer as ArrayBuffer)
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

function load_db_keys<T>(db: IDBDatabase, table: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("Database not initialized"));
            return;
        }
        const tx = db.transaction(table, "readonly");
        const store = tx.objectStore(table);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
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

async function urlToHtmlElement(url: string, mime?: string): Promise<HTMLElement> {
    let response = await fetch(url);
    let element = document.createElement('div');
    element.classList.add('attachment');
    if (!response.ok) {
        element.innerHTML = `Failed to load ${url}: ${response.status} ${response.statusText}`;
        return element;
    }
    if (!mime) {
        mime = response.headers.get("Content-Type");
    }
    if (!mime) {
        element.innerHTML = `Failed to determine content type of ${url}`;
    } else if (mime.includes("text/html")) {
        let iframe = document.createElement('iframe');
        iframe.sandbox.remove("allow-same-origin");
        iframe.sandbox.remove("allow-scripts");
        iframe.srcdoc = await response.text();
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        element.appendChild(iframe);
    } else if (mime.startsWith("image/")) {
        let img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        element.appendChild(img);
    } else if (mime.startsWith("text/")) {
        let pre = document.createElement('pre');
        pre.textContent = await response.text();
        element.appendChild(pre);
    } else if (mime === "application/pdf") {
        let embed = document.createElement('embed');
        embed.src = url;
        embed.type = "application/pdf";
        embed.style.width = "100%";
        embed.style.height = "100%";
        element.appendChild(embed);
    } else if (mime.startsWith("video/")) {
        let video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.style.width = "100%";
        video.style.height = "auto";
        element.appendChild(video);
    } else if (mime.startsWith("audio/")) {
        let audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        element.appendChild(audio);
    } else {
        let downloader = document.createElement('a');
        downloader.textContent = `Download file`;
        downloader.href = url;
        downloader.download = '';

        element.innerHTML = `Unsupported content type: ${mime}`;
        element.appendChild(downloader);
    }
    return element;
}

let senders: {
    message: Function, ping: Function, join: Function
    crypto: Function, crypto_request: Function, crypto_response: Function,
    request_history: Function, send_history: Function,
    base: Function, bind: Function
} = {
    message: async function (global: zapGlobals, text: string, attachments?: Blob[], recipients?: string[]) { // Send a message
        if (typeof text !== "string") {
            text = JSON.stringify(text);
        }
        //if (text.length > 2 ** 12) { //4kb max
        //    console.warn("Message too long, not sending.");
        //    return;
        //}
        let b64_attachments: string[] = []
        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) {
                let att: Blob = attachments[i];
                let b64 = arrayBufferToBase64(await att.arrayBuffer())
                b64_attachments.push(`data:${att.type};base64,${b64}`);
            }
        }
        let time = Date.now();
        let message_id = `${global.room}--${crypto.randomUUID()}-${crypto.randomUUID()}`
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.getSession(r)).filter(s => s) : []
        lbsend(0, JSON.stringify(global.account), [time, text, message_id, b64_attachments], global.room, encryption_enabled, recipients_sessions);
    },
    ping: function (global: zapGlobals, status: string, recipients?: string[]) { // Send a ping
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.getSession(r)).filter(s => s) : []
        lbsend(1, JSON.stringify(global.account), { now: Date.now(), status: status }, global.room, encryption_enabled, recipients_sessions);
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
            let pub_key = session_crypto.selfKeys.publicKey.buffer as ArrayBuffer
            senders.crypto(global, { type: "KEYresponse", id: global.account.id, public: arrayBufferToBase64(pub_key) });
        } else {
            setTimeout(senders.crypto_response, 100, [global])
        }
    },
    request_history: function (global: zapGlobals, recipients?: string[]) {
        let ids = global.messages[global.room].map(((v, i, a) => { return v.id }))
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.getSession(r)).filter(s => s) : []
        lbsend(3, global.account, ids, global.room, encryption_enabled, recipients_sessions)
    },
    send_history: function (global: zapGlobals, ids: string[], recipients?: string[]) {

        let msgs = global.messages[global.room].map(((v, i, a) => { return ids.indexOf(v.id) != -1 ? v : null }))
        let recipients_sessions: crypto_session[] = (encryption_enabled && recipients) ? recipients.map(r => session_crypto.getSession(r)).filter(s => s) : []
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

let formatter = new Showdown.Converter();


let emotes: { [key: string]: { src: string, width: number, height: number } } = {};
fetch("asset://emotes.json").then((txt) => { return txt.json() }).then((json) => {
    Object.keys(json).forEach((key) => {
        let emote_meta: { src: string, width: number, height: number } = json[key];
        fetch(emote_meta.src).then(async (resp) => {
            let AB = await resp.arrayBuffer()
            let b64 = arrayBufferToBase64(AB)
            emotes[key] = {
                src: "data:" + resp.type + ";base64," + b64,
                width: emote_meta.width,
                height: emote_meta.height
            }
        })
    });
})

let recievers: {
    message: Function, ping: Function,
    crypto: Function, join: Function,
    history_request: Function, recieve_history: Function,
    all: Function, bind: Function
} = {
    message: async function (global: zapGlobals, account: Account, content: [timestamp: number, message: string, id: string, attachments?: string[]], room: string) {
        var timestamp = content[0], message = content[1], id = content[2], attachments = content[3];
        console.debug("Received message in room ".concat(room, ":"), { timestamp, account, message });
        if (document.hidden) {
            set_favicon(FAVICON_UNREAD);
            if (global.blocked.indexOf(account.id) == -1) {
                sendNotification("Zap Messenger:  " + account.name + " sent you a message!", message);
            }
        }
        message = message.replaceAll("<", "&lt;")
        message = message.replaceAll(">", "&rt;")
        let words = message.split(" ")
        words.forEach((word, i) => {
            if (emotes[word]) {
                let emote = emotes[word];
                words[i] = `<img src="${emote.src}" style="width:${emote.width}em;height:${emote.height}em;">`
            }
        });
        message = words.join(" ")
        let msg_content = formatter.makeHtml(message);
        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) {
                let att = attachments[i];
                let element = await urlToHtmlElement(att);
                //URL.revokeObjectURL(url);
                msg_content += `<br/>`;
                msg_content += element.outerHTML;
            }
        }
        save_db_key(global.db, "accounts", account)
        let new_message: Message = {
            timestamp: timestamp,
            account: account.id,
            content: msg_content,
            id
        }
        global.messages[room].push(new_message);
        save_db_key(global.db, "messages", new_message).catch((e) => {
            console.error("Error saving message to DB:", e);
        }).then(() => {
            global.reTick = true;
        });
    },
    ping: function (global: zapGlobals, account: Account, content: { now: number, status: string }, room: string) {
        if (!Object.prototype.hasOwnProperty.call(global.online, room)) {
            global.online[room] = [];
        }
        global.online[room].unshift({ account, last: content.now, status: content.status });
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
                let session = session_crypto.addSession(account.id, content.public);
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
                    let sessions = Object.values(session_crypto.sessions)
                    for (let i=0;i<sessions.length;i++) {
                        let session = sessions[i]
                        type =              JSON.parse(await session.decrypt(new Uint8Array(base64ToArrayBuffer(message[0]))))
                        stringed_account =  JSON.parse(await session.decrypt(new Uint8Array(base64ToArrayBuffer(message[1]))))
                        content =           JSON.parse(await session.decrypt(new Uint8Array(base64ToArrayBuffer(message[2]))))
                        room =              JSON.parse(await session.decrypt(new Uint8Array(base64ToArrayBuffer(message[3]))))

                        return await recievers.all(global, type, stringed_account, content, room);
                    }
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

export { save, load, save_db_key, load_db, load_db_key, senders, recievers, sendNotification, change_room_binder, formatDate, set_favicon, FAVICON_READ, FAVICON_UNREAD, canvas_to_b64, arrayBufferToBase64, base64ToArrayBuffer }
