import { senders, formatDate } from './helpers'
import { online_bar, div, msg_container, servers_div, chat_div } from './elements'
import { zapGlobals, Server } from './main.d'
import { change_room_binder, save } from './helpers'

const default_pfp = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAY1BMVEUVFBoAAAAAAAsAAAXGxsfc3Nxramzi4uOEhIUJBxA2NTn////l5eWxsLKbm5yXl5ljY2U8PD/Q0NFbWl3y8vK4uLkaGR9GRUihoaIAAAhxcXO+vr99fX8nJyv7+/uQkJHW1td4h7FUAAAAsElEQVR4Ac3RBQKDMBAEQBZNurg7/P+VzdV7LwDiE4933Q8AJPcBBNrCKIzgLE7CyPyrvTGNCOnEjDn+EAXzJ5IlNUasEod+ybrR6LGFIDKaUiEMuye27GONNWNBOzCBRpAQxMhR4zQzfGLKSiMWroHgxha+xp2TJ3gw0+g3PCGIk42vEBmPJ3KHp7HlZgVjLhrd4VJXQ8qF86RwWqNDcKnDE65v8/dkE/D73BZiV/zuQNAJugNKvQoAAAAASUVORK5CYII=";

let last_msg_author: string = null;
function renderMessage(global: zapGlobals, message: any, side:"top"|"bottom" = "bottom") {
    try {
        let msg_div;
        if (last_msg_author === message.account.id) {
            if (side === "bottom") {
                msg_div = msg_container.lastChild as HTMLElement;
                msg_div.innerHTML += `<br>`;
            } else {
                msg_div = msg_container.firstChild as HTMLElement;
                msg_div.innerHTML = `<br>` + msg_div.innerHTML;
            }
        } else {
            msg_div = document.createElement("div");
            msg_div.classList.add("msg","author_" + message.account.id);
            msg_div.id = "msg_" + message.id;
            msg_div.innerHTML = `
<img src="${message.account.pfp || default_pfp}" alt="pfp" style="width:30px;height:30px;border-radius:50%;margin-right:10px;" data-account="${message.account.id}">
<strong>${message.account.name}</strong> 
<span class="timestamp">${formatDate(new Date(message.timestamp))}</span>
<br>`;
        }
        
        let container = document.createElement('div');
        container.innerHTML = message.content;

        if (side === "bottom") {
            msg_div.appendChild(container)
        } else {
            msg_div.insertBefore(container, msg_div.children[2]);
        }

        msg_container.appendChild(msg_div);

        if ((msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight) <= msg_div.clientHeight + 20) {
            msg_container.scrollTop = msg_container.scrollHeight
        }
    } catch (e) {
        console.log("Failed to render message", message, e)
    }
}

function onPing(global: zapGlobals) {
    if (!global.online[global.room]) { global.online[global.room] = [] }
    senders.ping(global, global.status, window.zap_global.online[window.zap_global.room].map((ping) => { return ping.account.id }));
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
        if ((value.last - now + 5000) > 0) {
            let container = document.createElement("div");
            container.className = "user_status";
            let pfp_container = document.createElement("div");
            pfp_container.id = "pfp_container";
            let pfp = document.createElement("img");
            pfp.src = value.account.pfp || default_pfp;
            pfp.alt = value.account.name;
            pfp.id = "pfp";
            pfp_container.appendChild(pfp);
            let status_dot = document.createElement("div");
            status_dot.id = "status";
            let css_text;
            if (value.status == "online") {
                css_text = "background-color: green; ";
            } else if (value.status == "away") {
                css_text = "background-color: yellow; ";
            } else if (value.status == "typing") {
                css_text = "background-color: grey; ";
            } else {
                css_text = "background-color: red; ";
            }
            status_dot.style.cssText = css_text
            pfp_container.appendChild(status_dot);
            container.appendChild(pfp_container);
            let username_text = document.createElement("p");
            username_text.innerText = value.account.name;
            username_text.style.margin = "5px";
            username_text.style.marginLeft = "10px";
            container.appendChild(username_text);

            let block_button = document.createElement("button");
            block_button.innerText = "Block";
            block_button.style.marginLeft = "10px";
            block_button.onclick = function () {
                if (!global.blocked.includes(value.account.id)) {
                    global.blocked.push(value.account.id);
                    save("blocked", global.blocked);
                }
            };
            username_text.appendChild(block_button);
            online_bar.appendChild(container);
        }
    });
}

function onTick(global: zapGlobals) {
    if (!global.reTick) { return };
    global.reTick = false

    if (!div) {
        console.warn("Main div not found, reloading page to avoid conflicts.");
        location.reload(); // Reload if div is not found
        return;
    }

    const messages = global.messages[global.room] || [];
    const start = global.lastRenderedIndex + 1;
    const start_time = Date.now();
    for (let i = start; i < messages.length; i++) {
        let msg = messages[i];
        global.lastRenderedIndex = i;

        renderMessage(global, msg);

        last_msg_author = msg.account.id;
        if (Date.now() - start_time > 500) {
            global.reTick = true;
            break;
        }
    }

    global.servers.forEach(function (server: Server, i) {
        let server_div = document.getElementById("server_" + server.id);
        let server_html = `${server.img ? `<img src="${server.img}" alt="pfp">` : ""} ${server.nickname}`;
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

            if (index == -1) { return; }
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

            return;
        }
    });
}

function keyResend(global: zapGlobals) {
    senders.crypto_response(global)
}

function bind(global: zapGlobals) {
    let new_funcs: any = {}
    new_funcs.onTick = function () { onTick(global) }
    new_funcs.onPing = function () { onPing(global) }
    new_funcs.keyResend = function () { keyResend(global) }
    return new_funcs
}

export { onPing, onTick, keyResend, bind }
