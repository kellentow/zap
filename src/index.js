import htmlContent from './body.html';
import cssContent from './body.css';

const global = {
    messages: {},
    room: "1",
    servers: [], // {id, nickname, img}
    account: { name: "You", id: Math.random() * 65565 } // Default account
}

let lastRenderedIndex = 0; // Track last rendered message index

function lbsend(a, b, c, d) {
    send(a, b, c, d);
    get(a, b, c, d);
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key, Default) {
    // sourcery skip: dont-reassign-parameters
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

function promptForAccount() {
    let name = null;
    while (!name || name.trim().length === 0) {
        name = prompt("Enter your name to continue:");
        if (name === null) {
            alert("You must enter a name to use the chat.");
        }
    }
    global.account = {
        name: name.trim(),
        id: Math.floor(Math.random() * 65565)
    };
    save("account", global.account);
}

global.messages = load("messages", {});
global.servers = load("servers", [{ id: "1", nickname: "General", img: "" }]);
global.account = load("account", {});
if (!global.account.name) {
    promptForAccount();
}

let div = document.getElementById("chat_div");
if (!div) {
    for (let i = 0; i < document.body.children.length; i++) {
        document.body.children[i].style.display = "none";
    }
    document.body.insertAdjacentHTML('beforeend', htmlContent)
    const style = document.createElement('style');
    style.textContent = cssContent;
    document.head.appendChild(style);
} else {
    console.warn("Chat div already exists, reloading page to avoid conflicts.");
    location.reload(); // Reload if div already exists
}
div = document.getElementById("chat_div");

function get(timestamp, account, message, room) {
    if (!global.messages[room]) {
        global.messages[room] = [];
    }
    let parsed_message, parsed_account;
    try {
        parsed_message = JSON.parse(message);
    } catch (e) {
        console.error("Invalid JSON msg:", e.message);
        return;
    }
    try {
        parsed_account = JSON.parse(account);
    } catch (e) {
        console.error("Invalid JSON acc:", e.message);
        return;
    }
    if (!parsed_account || !parsed_message) {
        console.error("Parsed account or message is null", account, message);
        return;
    }
    console.log(`Received message in room ${room}:`, { timestamp, parsed_account, parsed_message });
    global.messages[room].push({
        timestamp: timestamp,
        account: parsed_account,
        message: parsed_message
    });
    save("messages", global.messages);
}

const msg_input = document.getElementById("msg_input");
const msg_send = document.getElementById("msg_send");
const chat_div = document.getElementById("chat_inner_div");
const servers_div = document.getElementById("servers_div");
const server_adder = document.getElementById("serveradd");
const info_floater = document.getElementById("info_floater");

info_floater.innerHTML = `<strong>v${process.env.VERSION}</strong><br>
    <strong>Build:</strong> ${process.env.BUILD_ID}<br>`

msg_send.onclick = function () {
    let msg = msg_input.value;
    if (msg) {
        msg_input.value = "";
        lbsend(Date.now(), JSON.stringify(global.account), JSON.stringify({ text: msg }), global.room)
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
    global.servers.push({ id: server_id, nickname: server_name, img: server_img });
    save("servers", global.servers);
}

function change_room_binder(room, element) {
    return function () {
        lastRenderedIndex = 0; // Reset last rendered index when changing room
        for (let i = chat_div.children.length - 1; i >= 0; i--) {
            const element = chat_div.children[i];
            if (element.id.startsWith("msg_")) {
                element.remove();
            }
        }

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
    }
}

function onTick() {
    if (!div) {
        console.warn("Main div not found, reloading page to avoid conflicts.");
        location.reload(); // Reload if div is not found
        return;
    }
    const messages = global.messages[global.room] || [];
    for (let i = lastRenderedIndex; i < messages.length; i++) {
        let msg = messages[i];
        let msg_div = document.createElement("div");
        msg_div.className = "msg";
        msg_div.id = "msg_" + i;
        msg_div.innerHTML = `<strong>${msg.account.name}</strong> 
            <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span><br>
            ${msg.message.text}`;
        chat_div.appendChild(msg_div);
    }
    lastRenderedIndex = messages.length;

    global.servers.forEach(function (server, i) {
        let server_div = document.getElementById("server_" + server.id);
        let server_html = `${server.img ? `<img src="${server.img}" alt="${server.nickname}">` : ""} ${server.nickname}`;
        if (!server_div) {
            server_div = document.createElement("div");
            server_div.className = "server";
            server_div.id = "server_" + server.id;
            server_div.className = "server";
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(server.id, server_div);
            servers_div.insertBefore(server_div, servers_div.lastChild);
        } else {
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(server.id, server_div);
        }
    });

    requestAnimationFrame(onTick);
}

div.addEventListener("contextmenu", function (event) {
    const serverEl = event.target.closest('[id^="server_"]'); // safer than direct id access
    if (serverEl && event.button === 2) {
        event.preventDefault();
        const serverId = serverEl.id.replace("server_", "");
        const index = global.servers.findIndex(s => s.id === serverId);
        if (index !== -1) {
            const removed = global.servers.splice(index, 1)[0];
            save("servers", global.servers);

            document.getElementById("servers_div").removeChild(serverEl);
            console.log(`Server ${removed.nickname} removed.`);
            if (global.room === serverId) {
                global.room = global.servers.length > 0 ? global.servers[0].id : "1";
                lastRenderedIndex = 0;
                chat_div.innerHTML = "";
            }

            document.querySelectorAll('.server').forEach(el => el.classList.remove('selected'));
            const newSelected = document.getElementById("server_" + global.room);
            if (newSelected) {
                newSelected.classList.add('selected');
            }
        }

        return;
    }
});

requestAnimationFrame(onTick); // Start the animation frame loop