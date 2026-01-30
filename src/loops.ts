import { senders, formatDate } from './helpers'
import { online_bar, div, msg_container, servers_div, chat_div } from './elements'
import { zapGlobals, Server } from './main.d'
import { change_room_binder, save } from './helpers'

const default_pfp = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAY1BMVEUVFBoAAAAAAAsAAAXGxsfc3Nxramzi4uOEhIUJBxA2NTn////l5eWxsLKbm5yXl5ljY2U8PD/Q0NFbWl3y8vK4uLkaGR9GRUihoaIAAAhxcXO+vr99fX8nJyv7+/uQkJHW1td4h7FUAAAAsElEQVR4Ac3RBQKDMBAEQBZNurg7/P+VzdV7LwDiE4933Q8AJPcBBNrCKIzgLE7CyPyrvTGNCOnEjDn+EAXzJ5IlNUasEod+ybrR6LGFIDKaUiEMuye27GONNWNBOzCBRpAQxMhR4zQzfGLKSiMWroHgxha+xp2TJ3gw0+g3PCGIk42vEBmPJ3KHp7HlZgVjLhrd4VJXQ8qF86RwWqNDcKnDE65v8/dkE/D73BZiV/zuQNAJugNKvQoAAAAASUVORK5CYII=";
let scroll_listener: null|(()=>void) = null;

let last_msg_author: string = null;
function renderMessage(global: zapGlobals, message: any, side: "top" | "bottom" = "bottom") {
    try {
        let msg_div;
        let neighbor: HTMLElement | null;

        if (side === "bottom") {
            neighbor = msg_container.lastElementChild as HTMLElement;
        } else {
            neighbor = msg_container.firstElementChild as HTMLElement;
        }

        const br = document.createElement("br");

        last_msg_author = neighbor
            ? neighbor.getAttribute("data-author")
            : null;
        if (last_msg_author === message.account.id) {
            if (side === "bottom") {
                msg_div = msg_container.lastChild as HTMLElement;
                msg_div.appendChild(br);
            } else {
                msg_div = msg_container.firstChild as HTMLElement;
                msg_div.insertBefore(br, msg_div.children[4]);
            }
        } else {
            msg_div = document.createElement("div");
            msg_div.classList.add("msg", "author_" + message.account.id);
            msg_div.id = "msg_" + message.id;
            msg_div.setAttribute("data-author", message.account.id);
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
            msg_div.insertBefore(container, msg_div.children[4]);
        }

        if (side === "bottom") {
            msg_container.appendChild(msg_div);
        } else {
            msg_container.insertBefore(msg_div, msg_container.firstChild);
        }


        if ((msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight) <= 200) {
            msg_container.scrollTop = msg_container.scrollHeight
        }
    } catch (e) {
        console.log("Failed to render message", message, e)
    }
}
function initialRender(global: zapGlobals, count = 50) {
    const messages = global.messages[global.room] || [];

    const end = messages.length;
    const start = Math.max(0, end - count);

    global.firstRenderedIndex = start;
    global.lastRenderedIndex = end - 1;
    console.log(end,start)

    for (let i = start; i < end; i++) {
        renderMessage(global, messages[i], "bottom");
    }

    msg_container.scrollTop = msg_container.scrollHeight;
    requestAnimationFrame(() => {
        msg_container.scrollTop = msg_container.scrollHeight;
    });

    let scrolling = false;
    console.log("Initial render done, setting up scroll listener.");
    if (scroll_listener !== null) {
        msg_container.removeEventListener("scroll", scroll_listener);
    }
    scroll_listener = () => {
        console.log("scroll")
        if (scrolling) return;

        scrolling = true;

        requestAnimationFrame(() => {
            if (msg_container.scrollTop < 100) {
                loadUp(global);
            }

            if (msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight < 100) {
                loadDown(global);
            }
            scrolling = false;
        });
    }
    msg_container.addEventListener("scroll", scroll_listener);
}

function loadDown(global: zapGlobals, batch = 20) {
    const messages = global.messages[global.room];

    if (
        window.zap_global.lastRenderedIndex >= messages.length - 1
    ) return;

    let end = Math.min(
        messages.length - 1,
        window.zap_global.lastRenderedIndex + batch
    );

    for (let i = window.zap_global.lastRenderedIndex + 1; i <= end; i++) {
        renderMessage(global, messages[i], "bottom");
    }

    window.zap_global.lastRenderedIndex = end;
}


function loadUp(global: zapGlobals, batch = 20) {
    const messages = global.messages[global.room];

    if (window.zap_global.firstRenderedIndex <= 0) return;

    const container = msg_container;

    // Save current height
    const oldHeight = container.scrollHeight;

    let start = Math.max(
        0,
        window.zap_global.firstRenderedIndex - batch
    );

    for (let i = window.zap_global.firstRenderedIndex - 1; i >= start; i--) {
        renderMessage(global, messages[i], "top");
    }

    window.zap_global.firstRenderedIndex = start;

    // Restore position
    const newHeight = container.scrollHeight;
    container.scrollTop += newHeight - oldHeight;
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

    msg_container.dispatchEvent(new Event('scroll')); // Trigger scroll to load messages if needed

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

export { onPing, onTick, keyResend, bind, initialRender }
