import "./networking"
import { save, load, senders, recievers, change_room_binder, set_favicon, FAVICON_READ} from './helpers'
import { settings_menu, server_adder, msg_send, settings_button, chat_div, style } from './elements'
import { zapGlobals } from './main.d'
import { bind } from './loops'
import { Editor } from './editor'
import changelogs from './changelogs.json'
import './tests'
import { init as contextMenuInit } from './contextmenu'
import showdown from 'showdown' // external library scary ):
// bye bye showdown, hello shitty homemade library
//import {parseMarkdown, charsToHtml} from './mdparser'
//nvm it broken

set_favicon(FAVICON_READ);

declare global {
    interface Window {
        send: Function;
        get: Function;
        zap_global: zapGlobals;
    }
}

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
        window.zap_global.status = "away";
    } else if (document.visibilityState === "visible") {
        window.zap_global.status = "online";
    }
    set_favicon(FAVICON_READ);
});

document.addEventListener("beforeunload", function () {
    window.zap_global.status = "offline";
    senders.ping(window.zap_global);
});

let converter = new showdown.Converter();

window.zap_global = {
    messages: {},
    room: "1",
    servers: load("servers", [{ id: "1", nickname: "General", img: "" }]), // {id, nickname, img}
    account: load("account", {}), // Default 
    reTick: true,
    status: "online",
    firstRenderedIndex:0,
    lastRenderedIndex: 0,
    theme: load("theme", "light"),
    blocked: load("blocked", []),
    online: {},
    editor: undefined,
    db: undefined,
    image_rendering: load("image_rendering", true)
};

// Show changelogs for new versions
if ((load("lastUpdateCheck", -1) + 1) < changelogs.length) {
    let changelog_div = document.createElement("div");
    changelog_div.innerHTML = "<h2>Changelogs</h2>";
    changelog_div.style.width = "90%"
    changelog_div.style.height = "90%"
    changelog_div.style.overflowY = "auto"
    changelog_div.style.backgroundColor = "var(--palette-2)"
    changelog_div.style.color = "var(--palette-text)"
    changelog_div.style.padding = "10px"
    changelog_div.style.boxSizing = "border-box"
    changelog_div.style.zIndex = "1000";
    changelog_div.style.left = "5%";
    changelog_div.style.top = "5%";

    // button to close
    let close_button = document.createElement("button");
    close_button.innerText = "Close";
    close_button.onclick = function () {
        changelog_div.remove();
    };
    changelog_div.appendChild(close_button);
    changelog_div.style.position = "fixed";
    changelog_div.style.top = "7%";
    changelog_div.style.right = "7%";

    // the logs

    let changelog_messages = changelogs.slice(load("lastUpdateCheck", -1) + 1);
    changelog_messages.forEach((change: { text: string, date: string, version_str: string }) => {
        let entry = document.createElement("div");
        let text = `## Version ${change.version_str} - ${change.date}\n` + change.text;
        let md_as_html = converter.makeHtml(text);
        //let md_as_html = charsToHtml(parseMarkdown(text));
        entry.innerHTML = md_as_html;
        changelog_div.appendChild(entry);
    });

    document.body.appendChild(changelog_div);
    save("lastUpdateCheck", changelogs.length - 1);
}


let normalizeOps = function normalizeOps(ops: [string, IDBObjectStoreParameters?][]) {
    const final: Record<string, [string, IDBObjectStoreParameters?]> = {};

    for (let [name, opts] of ops) {
        const op = name[0];
        const store = name.slice(1);
        final[store] = [op, opts]; // later ops overwrite earlier ones
    }

    return Object.entries(final).map(([store, [op, opts]]) => [op + store, opts] as [string, IDBObjectStoreParameters?]);
}

let request = window.indexedDB.open("ZapMessengerRW", 1);
request.onsuccess = function (e) {
    window.zap_global.db = request.result
}
request.onupgradeneeded = (event) => {
    const db = request.result;
    let needed: [string, IDBObjectStoreParameters?][] = [];

    switch (event.oldVersion) {
        case 0:
            needed.push(["+ messages", { keyPath: "id", autoIncrement: true }]);
        case 1:
            needed.push(["-+ messages", { keyPath: "id", autoIncrement: false }]);
    }

    needed = normalizeOps(needed)

    needed.forEach(([fullop, options]) => {
        const [op, name] = fullop.split(" ", 2); // "op storeName"
        if (op === "+") {
            if (!db.objectStoreNames.contains(name)) {
                db.createObjectStore(name, options);
            } else {
                console.warn(`Cannot add ${name} because it already exists`)
            }
        } else if (op === "-") {
            if (db.objectStoreNames.contains(name)) {
                db.deleteObjectStore(name);
            } else {
                console.warn(`Cannot remove ${name} because it doesn't exist`)
            }
        } else if (op === "-+") {
            if (db.objectStoreNames.contains(name)) {
                db.deleteObjectStore(name);
            }
            db.createObjectStore(name, options);
        }
    });
};

if (!window.zap_global.account.name) {
    promptForAccount();
}

let { onPing, onTick, keyResend } = bind(window.zap_global)

if (Notification.permission === "default") {
    Notification.requestPermission();
}

async function promptForAccount() {
    let name = null;
    while (!name || name.trim().length === 0) {
        name = prompt("Enter your name to continue:");
        if (name === null || name.trim().length === 0) {
            alert("You must enter a name to use the chat.");
        }
    }
    window.zap_global.account = {
        name: name.trim(),
        id: crypto.randomUUID(),
        pfp: ""
    };
    save("account", window.zap_global.account);
}

msg_send.onclick = function () {
    if (window.zap_global.editor) {
        let content = window.zap_global.editor.getMD();
        let attachments = window.zap_global.editor.getAttachments();
        window.zap_global.editor.setMD('');
        let targets = window.zap_global.online[window.zap_global.room].map((ping) => { return ping.account.id })
        senders.message(window.zap_global, content, attachments, targets);
    }
};

server_adder.onclick = async function () {
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

function remakeEditor() {
    let md = "";
    if (window.zap_global.editor) {
        md = window.zap_global.editor.getHTML();
        window.zap_global.editor.destroy();
    }
    window.zap_global.editor = new Editor(
        'div#msg_input',
        "dark"
    );
    window.zap_global.editor.setMD(md);

    (window.zap_global.editor as Editor).textinput.addEventListener("keydown", function (e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey && window.zap_global.editor.getMD().trim() !== "") {
            // if (enter) and (not shift) and (cursor at end) and (no selection)
            e.preventDefault();
            msg_send.click();
        }
    });
}
function reloadTheme() {
    let theme = window.zap_global.theme;
    document.documentElement.setAttribute("data-theme", theme);
    let icon_color = "black";
    if (theme == "obsidian") {
        icon_color = "purple";
    } else if (theme == "outerspace") {
        icon_color = "white";
    }
    fetch("asset://icons/settings_"+icon_color+".png").then(res => res.blob()).then(blob => {
        (settings_button.children[0] as HTMLImageElement).src = URL.createObjectURL(blob);
    });
    fetch("asset://icons/add_"+icon_color+".png").then(res => res.blob()).then(blob => {
        (server_adder.children[0] as HTMLImageElement).src = URL.createObjectURL(blob);
    });
}
function setTheme(theme: string) {
    window.zap_global.theme = theme;
    save("theme", window.zap_global.theme);
    reloadTheme();
}
remakeEditor();
reloadTheme();

//#region settings menu
(() => { // theme selector
    let theme_select = document.createElement("div");
    theme_select.style.height = "50px";
    theme_select.style.display = "flex";
    theme_select.style.flexDirection = "column";
    theme_select.style.gap = "10px";
    ["outerspace", "obsidian", "light", "green", "orange"].forEach((theme => {
        let theme_div = document.createElement("div");
        theme_div.style.display = "flex";
        theme_div.style.flexDirection = "row";
        theme_div.style.alignItems = "center";
        theme_div.style.gap = "5px";
        let name = document.createElement("p");
        name.innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
        theme_div.appendChild(name);
        let apply_button = document.createElement("button");
        apply_button.innerText = "Apply";
        apply_button.onclick = function () {
            setTheme(theme);
        }
        theme_div.appendChild(apply_button);

        let preview = document.createElement("div");
        preview.setAttribute("data-theme", theme);
        preview.style.height = "20px";
        preview.style.display = "flex";
        preview.style.flexDirection = "row";

        let palette1 = document.createElement("div");
        palette1.style.backgroundColor = "var(--palette-1)";
        palette1.style.width = "20px";

        let palette2 = document.createElement("div");
        palette2.style.backgroundColor = "var(--palette-2)";
        palette2.style.width = "20px";

        let palette3 = document.createElement("div");
        palette3.style.backgroundColor = "var(--palette-3)";
        palette3.style.width = "20px";

        let palette4 = document.createElement("div");
        palette4.style.backgroundColor = "var(--palette-4)";
        palette4.style.width = "20px";

        let palette5 = document.createElement("div");
        palette5.style.backgroundColor = "var(--palette-5)";
        palette5.style.width = "20px";
        preview.appendChild(palette1);
        preview.appendChild(palette2);
        preview.appendChild(palette3);
        preview.appendChild(palette4);
        preview.appendChild(palette5);

        theme_div.appendChild(preview);
        theme_select.appendChild(theme_div);
    }));
    settings_menu.appendChild(theme_select);
})();
(() => { // image rendering toggle
    let image_rendering = document.createElement("input");
    image_rendering.type = "checkbox";
    image_rendering.id = "image_rendering";
    image_rendering.checked = window.zap_global.image_rendering;
    image_rendering.onchange = function () {
        window.zap_global.image_rendering = image_rendering.checked;
        save("image_rendering", window.zap_global.image_rendering);
        if (window.zap_global.image_rendering) {
            chat_div.classList.remove("no_imgs");
        } else {
            chat_div.classList.add("no_imgs");
        }
    };
    image_rendering.onchange({} as Event);
    let image_rendering_label = document.createElement("label");
    image_rendering_label.setAttribute("for", "image_rendering");
    image_rendering_label.innerText = "Show Images in Chat";
    settings_menu.appendChild(image_rendering_label);
    settings_menu.appendChild(image_rendering);
})();
(() => { // set pfp button
    let pfp_button = document.createElement("button");
    pfp_button.innerText = "Set Profile Picture";
    let file_picker = document.createElement("input");
    file_picker.type = "file";
    file_picker.accept = "image/*";
    file_picker.style.display = "none";
    file_picker.onchange = () => {
        let file = file_picker.files[0]
        let reader = new FileReader()
        reader.onload = (e) => {
            window.zap_global.account.pfp = e.target.result as string;
            save("account", window.zap_global.account);
        }
        reader.readAsDataURL(file)
    }
    pfp_button.onclick = () => {
        file_picker.click();
    };
    settings_menu.appendChild(pfp_button);
})();
(() => { // blocked users list
    let div = document.createElement("div");
    div.style.flexDirection = "column";
    div.style.marginTop = "20px";
    function updateBlockedList() {
        div.innerHTML = "<h3>Blocked Users</h3>";
        style.innerText = '';
        for ( let id in window.zap_global.blocked ) {
            let blocked_id = window.zap_global.blocked[id];
            let blocked_div = document.createElement("div");
            blocked_div.style.display = "flex";
            blocked_div.style.flexDirection = "row";
            blocked_div.style.alignItems = "center";
            blocked_div.style.justifyContent = "space-between";
            blocked_div.style.gap = "10px";
            let name_span = document.createElement("span");
            name_span.innerText = blocked_id;
            blocked_div.appendChild(name_span);
            let unblock_button = document.createElement("button");
            unblock_button.innerText = "Unblock";
            unblock_button.onclick = () => {
                window.zap_global.blocked.splice(parseInt(id), 1);
                save("blocked", window.zap_global.blocked);
                div.removeChild(blocked_div);
            };
            blocked_div.appendChild(unblock_button);
            div.appendChild(blocked_div);
            style.innerText += `.author_${blocked_id} { display: none; }\n`;
        }
    }
    setInterval(updateBlockedList, 1000);
    settings_menu.appendChild(div);
})();
//#endregion 
function onLoad() {
    setInterval(onTick, 250); // Start the animation frame loop
    let temp = document.createElement("div")
    change_room_binder(window.zap_global, "1", temp)()
    temp.remove()
}

document.title = "Zap Messenger Rewritten"
let id = setInterval((function () {
    if (document.readyState == "complete" && typeof window.zap_global.db !== "undefined") {
        clearInterval(id);
        onLoad();
    }
}), 100);
setInterval(onPing, 500);
setInterval(keyResend, 30000)
window.get = recievers.bind(window.zap_global).all

contextMenuInit(window.zap_global);