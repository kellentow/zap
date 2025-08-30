import { senders } from './helpers'
import { online_bar, div, msg_container, servers_div, chat_div } from './elements'
import { zapGlobals, Server } from './main.d'
import { change_room_binder, save } from './helpers'

function onPing(global: zapGlobals) {
    if (!global.online[global.room]) { global.online[global.room] = [] }
    senders.ping(global, window.zap_global.online[window.zap_global.room].map((ping) => { return ping.account.id }));
    Array.prototype.slice.call(online_bar.children).forEach(function (v: HTMLElement) { online_bar.removeChild(v).remove(); });
    let now = Date.now();
    global.online[global.room].sort(function (a, b) { return a.account.name.localeCompare(b.account.name, undefined, { sensitivity: "base" }); });
    let seen = new Set();
    global.online[global.room] =
        global.online[global.room].filter(function (user) {
            if (seen.has(user.account.id)) {
                return false;
            }
            seen.add(user.account.id);
            return true;
        });
    global.online[global.room].forEach(function (value) {
        if ((value.last - now + 65000) > 0) {
            let container = document.createElement("div");
            container.className = "user_status";
            let status_dot = document.createElement("div");
            status_dot.style.cssText = "border-radius:9999px; border-width:2px; width:15px; height:15px; " + ((value.avg < 900) ? "background-color: green;" : ((value.avg < 30000) ? "background-color: yellow;" : "background-color: red;"));
            container.appendChild(status_dot);
            let username_text = document.createElement("p");
            username_text.innerText = value.account.name;
            username_text.style.margin = "5px";
            username_text.style.marginLeft = "10px";
            container.appendChild(username_text);
            online_bar.appendChild(container);
        }
    });
}

function onTick(global: zapGlobals) {
    console.log("A")
    if (!global.reTick) { return };
    global.reTick = false

    if (!div) {
        console.warn("Main div not found, reloading page to avoid conflicts.");
        location.reload(); // Reload if div is not found
        return;
    }

    const messages = global.messages[global.room] || [];
    const start = global.lastRenderedIndex
    for (let i = start; i < Math.min(messages.length, start + 100); i++) {
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
            global.lastRenderedIndex = messages.length;
            if ((msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight) <= 200) {
                msg_container.scrollTop = msg_container.scrollHeight
            }
        } catch (e) {
            console.log("Failed to render message", msg, e)
        }
    }

    global.servers.forEach(function (server: Server, i) {
        let server_div = document.getElementById("server_" + server.id);
        let server_html = `${server.img ? `<img src="${server.img}" alt="${server.nickname}">` : ""} ${server.nickname}`;
        if (!server_div) {
            server_div = document.createElement("div");
            server_div.className = "server";
            server_div.id = "server_" + server.id;
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(global, server.id, server_div);
            servers_div.insertBefore(server_div, servers_div.lastChild);
        } else {
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(global, server.id, server_div);
        }
    });

    div.addEventListener("contextmenu", function (event: PointerEvent) {
        const target = event.target as Element
        const serverEl = target.closest('[id^="server_"]'); // safer than direct id access
        if (serverEl && event.button === 2) {
            event.preventDefault();
            const serverId = serverEl.id.replace("server_", "");
            let index = 0;
            for (const server of global.servers) {
                if (server.id === serverId) { break };
                index++;
            }
            if (index === global.servers.length) { index = -1 }; // not found

            if (index !== -1) {
                const removed = global.servers.splice(index, 1)[0];
                save("servers", global.servers);

                document.getElementById("servers_div").removeChild(serverEl);
                console.log(`Server ${removed.nickname} removed.`);
                if (global.room === serverId) {
                    global.room = global.servers.length > 0 ? global.servers[0].id : "1";
                    global.lastRenderedIndex = 0;
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
}

function bind(global: zapGlobals) {
    let new_funcs: any = {}
    new_funcs.onTick = function () { onTick(global) }
    new_funcs.onPing = function () { onPing(global) }
    return new_funcs
}

export { onPing, onTick, bind }
