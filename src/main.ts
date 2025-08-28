import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { save, load, senders, recievers, load_db } from './helpers'
import { settings_menu, server_adder, msg_send, settings_button } from './elements'
import { Message, zapGlobals } from './main.d'
import { bind } from './loops'

declare global {
    interface Window {
        send: Function;
        get: Function;
        zap_global: zapGlobals;
    }
}

window.zap_global = {
    messages: {},
    room: "1",
    servers: load("servers", [{ id: "1", nickname: "General", img: "" }]), // {id, nickname, img}  
    account: load("account", {}), // Default 
    reTick: true,
    lastRenderedIndex: 0,
    dark: !load("dark", window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches), // Invert toggle for later inversion
    online: {},
    editor: undefined,
    db: undefined
};
let request = window.indexedDB.open("ZapMessengerRW", 1);
request.onsuccess = function (e) {
    window.zap_global.db = request.result
}
request.onupgradeneeded = (event) => {
    const db = request.result;
    let needed: [string, IDBObjectStoreParameters?][] = [];

    switch (event.oldVersion) {
        case 0:
            needed.push(["messages", { keyPath: "id", autoIncrement: true }]);
    }

    needed.forEach(([name, options]) => {
        if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, options);
        }
    });
};

let {onPing, onTick} = bind(window.zap_global)

if (!window.zap_global.account.name) {
    promptForAccount();
}

if (Notification.permission === "default") {
    Notification.requestPermission();
}

function promptForAccount() {
    let name = null;
    while (!name || name.trim().length === 0) {
        name = prompt("Enter your name to continue:");
        if (name === null) {
            alert("You must enter a name to use the chat.");
        }
    }
    window.zap_global.account = {
        name: name.trim(),
        id: crypto.randomUUID()
    };
    save("account", window.zap_global.account);
}

msg_send.onclick = function () {
    if (window.zap_global.editor) {
        let content = window.zap_global.editor.getHTML();
        window.zap_global.editor.setHTML('');
        senders.message(content);
    }
};

server_adder.onclick = function () {
    let server_name, server_id, server_img;
    while (!server_name) {
        server_name = prompt("Enter server name:");
    }
    while (!server_id) {
        server_id = prompt("Enter server ID:");
    }
    server_img = prompt("Enter server image URL (optional):", "");
    window.zap_global.servers.push({ id: server_id, nickname: server_name, img: server_img });
    window.zap_global.reTick = true
    save("servers", window.zap_global.servers);
}

//#region settings
settings_menu.classList.add("closed");
settings_button.onclick = function () {
    if (settings_menu.classList.contains("open")) {
        settings_menu.classList.remove("open");
        settings_menu.classList.add("closed");
    }
    else {
        settings_menu.classList.remove("closed");
        settings_menu.classList.add("open");
    }
};
//#region settings menu
let dark_toggle = document.createElement("div");
dark_toggle.classList.add("button");
dark_toggle.onclick = function () {
    window.zap_global.dark = !window.zap_global.dark;
    save("dark", window.zap_global.dark);
    if (window.zap_global.dark) {
        document.documentElement.classList.add("dark");
    }
    else {
        document.documentElement.classList.remove("dark");
    }
    let md = "";
    if (window.zap_global.editor) {
        md = window.zap_global.editor.getMarkdown();
        window.zap_global.editor.destroy();
    }
    window.zap_global.editor = new Editor({
        el: document.querySelector('div#msg_input'),
        height: '300px',
        initialEditType: 'wysiwyg',
        previewStyle: 'tab',
        usageStatistics: false,
        theme: window.zap_global.dark ? 'dark' : 'light',
    });
    window.zap_global.editor.setMarkdown(md);
};
let dark_img = document.createElement("img");
dark_img.src = "https://cdn-icons-png.flaticon.com/512/12377/12377255.png ";
dark_img.style.height = "20px";
dark_img.style.width = "20px";
dark_toggle.appendChild(dark_img);
settings_menu.appendChild(dark_toggle);
//#endregion 
function onLoad() {
    load_db(window.zap_global.db,"messages").then((messages)=>{
        let room_messages:Message[] = (messages.filter((a:Message)=>{a.id && a.id.startsWith(window.zap_global.room+"/")}) as Message[])
        window.zap_global.messages[window.zap_global.room] = room_messages
    })
    dark_toggle.click(); // Set initial dark mode state
    setInterval(onTick, 250); // Start the animation frame loop
}

document.title = "Zap Messenger Rewritten"
let id = setInterval((function () {
    if (typeof Editor != "undefined") {
        clearInterval(id);
        onLoad();
    }
}), 100);
setInterval(onPing, 500);
window.get = recievers.bind(window.zap_global).all