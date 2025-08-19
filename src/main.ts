interface Server {
    id: string;
    nickname: string;
    img: string;
}

interface Account {
    id: string;
    name: string;
}

interface Window {
    send?: Function;
    get?: Function;
    zap_global: { messages: Record<string, any>; room: string; servers: Server[]; account: Account; reTick: boolean; lastRenderedIndex: number; };
    tinymce?: any;
}

window.zap_global = {
    messages: load("messages", {}),
    room: "1",
    servers: load("servers", [{ id: "1", nickname: "General", img: "" }]), // {id, nickname, img}  
    account: load("account", {}), // Default 
    reTick: true,
    lastRenderedIndex: 0
}

if (!window.zap_global.account.name) {
    promptForAccount();
}

if (typeof window.send !== 'function') {
    console.warn("send() not defined. Using mock send.");
    window.send = function (a: any, b: any, c: any, d: any) {
        console.log("Mock send triggered with:", [a, b, c, d]);
    };
}  

const msg_send = document.getElementById("msg_send");
const msg_input = document.getElementById("msg_input");
const chat_div = document.getElementById("chat_inner_div");
const msg_container = document.getElementById("msg_container")
const servers_div = document.getElementById("servers_div");
const info_floater = document.getElementById("info_floater");
const server_adder = document.getElementById("serveradd");
const div = document.getElementById("chat_div")

if (Notification.permission === "default") {
    Notification.requestPermission();
}

//#region Utils
function save(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key: string, Default: any) {
    Default = Default || null;
    const value = localStorage.getItem(key);
    if (value) {
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error(`Error parsing JSON for key ${key}:`, e);
            return Default;
        }
    }
    return Default;
}

function change_room_binder(room: string, element: HTMLElement) {
    return function () {
        window.zap_global.lastRenderedIndex = 0; // Reset last rendered index when changing room
        msg_container.innerHTML = ""

        window.zap_global.room = room;
        console.log("Changed room to:", room);
        // Optionally, clear the messages for the new room
        window.zap_global.messages[room] = window.zap_global.messages[room] || [];

        window.zap_global.servers.forEach(function (server) {
            let server_div = document.getElementById("server_" + server.id);
            if (server_div) {
                server_div.classList.remove("selected");
            }
        });
        if (element) {
            element.classList.add("selected");
        }
        window.zap_global.reTick = true
    }
}

function sendNotification(title: string, message: string) {
    // Only send if page is hidden and notifications are allowed
    if (document.hidden && Notification.permission === "granted") {
        new Notification(title, { body: message });
    }
}

function lbsend(a: any, b: any, c: any, d: any) {
    window.send(a, b, c, d);
    window.get(a, b, c, d);
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
//#endregion


function onTick() {
    console.log("A")
    if (!window.zap_global.reTick) { return };
    window.zap_global.reTick = false

    if (!div) {
        console.warn("Main div not found, reloading page to avoid conflicts.");
        location.reload(); // Reload if div is not found
        return;
    }

    const messages = window.zap_global.messages[window.zap_global.room] || [];
    for (let i = window.zap_global.lastRenderedIndex; i < messages.length; i++) {
        let msg = messages[i];
        try {
            let msg_div = document.createElement("div");
            msg_div.className = "msg";
            msg_div.id = "msg_" + i;
            msg_div.innerHTML = `<strong>${msg.account.name}</strong> 
            <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span><br>`;
            let container = document.createElement('div');
            container.innerHTML = msg.content;
            msg_div.appendChild(container)

            msg_container.appendChild(msg_div);
            window.zap_global.lastRenderedIndex = messages.length;
            if ((msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight) <= 200) {
                msg_container.scrollTop = msg_container.scrollHeight
            }
        } catch (e) {
            console.log("Failed to render message", msg, e)
        }
    }

    window.zap_global.servers.forEach(function (server:Server, i) {
        let server_div = document.getElementById("server_" + server.id);
        let server_html = `${server.img ? `<img src="${server.img}" alt="${server.nickname}">` : ""} ${server.nickname}`;
        if (!server_div) {
            server_div = document.createElement("div");
            server_div.className = "server";
            server_div.id = "server_" + server.id;
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(server.id, server_div);
            servers_div.insertBefore(server_div, servers_div.lastChild);
        } else {
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(server.id, server_div);
        }
    });

    div.addEventListener("contextmenu", function (event: PointerEvent) {
        const target = event.target as Element
        const serverEl = target.closest('[id^="server_"]'); // safer than direct id access
        if (serverEl && event.button === 2) {
            event.preventDefault();
            const serverId = serverEl.id.replace("server_", "");
            let index = 0;
            for (const server of window.zap_global.servers) {
                if (server.id === serverId) {break};
                index++;
            }
            if (index === window.zap_global.servers.length) {index = -1}; // not found
            
            if (index !== -1) {
                const removed = window.zap_global.servers.splice(index, 1)[0];
                save("servers", window.zap_global.servers);

                document.getElementById("servers_div").removeChild(serverEl);
                console.log(`Server ${removed.nickname} removed.`);
                if (window.zap_global.room === serverId) {
                    window.zap_global.room = window.zap_global.servers.length > 0 ? window.zap_global.servers[0].id : "1";
                    window.zap_global.lastRenderedIndex = 0;
                    chat_div.innerHTML = "";
                }

                document.querySelectorAll('.server').forEach(el => el.classList.remove('selected'));
                const newSelected = document.getElementById("server_" + window.zap_global.room);
                if (newSelected) {
                    newSelected.classList.add('selected');
                }
            }

            return;
        }
    });
}

function get(timestamp: number, account: string, message: string, room: string) {
    if (!window.zap_global) { return } // Make sure site is loaded fully first

    if (!window.zap_global.messages[room]) {
        window.zap_global.messages[room] = [];
    }
    let parsed_account;
    try {
        parsed_account = JSON.parse(account);
    } catch (e) {
        console.error("Invalid JSON acc:", e.message);
        return;
    }

    console.log(`Received message in room ${room}:`, { timestamp, parsed_account, message });
    sendNotification("Zap Messenger:  " + parsed_account.name + " sent you a message!", message);
    window.zap_global.messages[room].push({
        timestamp: timestamp,
        account: parsed_account,
        content: message
    });
    save("messages", window.zap_global.messages);
    window.zap_global.reTick = true
}

msg_send.onclick = function () {
    let editor = window.tinymce.get("msg_input")
    if (editor) {
        let content = editor.getContent();
        editor.resetContent()
        let time = Date.now()
        console.log(content)
        lbsend(time, JSON.stringify(window.zap_global.account), content, window.zap_global.room)
    }
}

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

function onLoad() {
    window.tinymce.init({
        selector: 'textarea',
        plugins: ['anchor', 'autolink', 'link', 'media'],
        toolbar: 'bold italic underline strikethrough | link media mergetags | spellcheckdialog a11ycheck typography uploadcare',
        uploadcare_public_key: '681edb18a454bbe40fd2',
        height: 300
    });

    setInterval(onTick, 250) // Start the animation frame loop
}

document.title = "Zap Messager Rewritten"
let id = setInterval((() => { if (typeof window.tinymce != "undefined") { clearInterval(id); onLoad() } }), 1)