window.zap_global = {
    messages: load("messages", {}),
    room: "1",
    servers: load("servers", [{ id: "1", nickname: "General", img: "" }]), // {id, nickname, img}  
    account: load("account", {}), // Default 
    reTick: true,
    lastRenderedIndex: 0,
    dark: !load("dark", window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches), // Invert toggle for later inversion
    online: {},
    editor: undefined,
};
if (!window.zap_global.account.name) {
    promptForAccount();
}
if (typeof window.send !== 'function') {
    console.warn("send() not defined. Using mock send.");
    window.send = function (a, b, c, d) {
        console.log("Mock send triggered with:", [a, b, c, d]);
    };
}
var msg_send = document.getElementById("msg_send");
var online_bar = document.getElementById("status_bar");
var msg_input = document.getElementById("msg_input");
var chat_div = document.getElementById("chat_inner_div");
var msg_container = document.getElementById("msg_container");
var servers_div = document.getElementById("servers_div");
var info_floater = document.getElementById("info_floater");
var server_adder = document.getElementById("serveradd");
var typing_indicator = document.getElementById("typing");
var div = document.getElementById("chat_div");
var css_element = document.getElementById("css");
var settings_menu = document.getElementById("settings_menu");
var settings_button = document.getElementById("settings_button");
if (Notification.permission === "default") {
    Notification.requestPermission();
}
//#region Utils
window.send.message = function (text) {
    var time = Date.now();
    console.log(text);
    lbsend(0, JSON.stringify(window.zap_global.account), [time, text], window.zap_global.room);
};
window.send.ping = function () {
    lbsend(1, JSON.stringify(window.zap_global.account), Date.now(), window.zap_global.room);
};
function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function load(key, Default) {
    Default = Default || null;
    var value = localStorage.getItem(key);
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
function change_room_binder(room, element) {
    return function () {
        window.zap_global.lastRenderedIndex = 0; // Reset last rendered index when changing room
        msg_container.innerHTML = "";
        window.zap_global.room = room;
        console.log("Changed room to:", room);
        // Optionally, clear the messages for the new room
        window.zap_global.messages[room] = window.zap_global.messages[room] || [];
        window.zap_global.servers.forEach(function (server) {
            var server_div = document.getElementById("server_" + server.id);
            if (server_div) {
                server_div.classList.remove("selected");
            }
        });
        if (element) {
            element.classList.add("selected");
        }
        window.zap_global.reTick = true;
    };
}
function sendNotification(title, message) {
    // Only send if page is hidden and notifications are allowed
    if (document.hidden && Notification.permission === "granted") {
        new Notification(title, { body: message });
    }
}
function lbsend(a, b, c, d) {
    window.send(a, b, c, d);
    window.get(a, b, c, d);
}
function promptForAccount() {
    var name = null;
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
    console.log("A");
    if (!window.zap_global.reTick) {
        return;
    }
    ;
    window.zap_global.reTick = false;
    if (!div) {
        console.warn("Main div not found, reloading page to avoid conflicts.");
        location.reload(); // Reload if div is not found
        return;
    }
    var messages = window.zap_global.messages[window.zap_global.room] || [];
    for (var i = window.zap_global.lastRenderedIndex; i < messages.length; i++) {
        var msg = messages[i];
        try {
            var msg_div = document.createElement("div");
            msg_div.className = "msg";
            msg_div.id = "msg_" + i;
            msg_div.innerHTML = "<strong>".concat(msg.account.name, "</strong> \n            <span class=\"timestamp\">").concat(new Date(msg.timestamp).toLocaleTimeString(), "</span><br>");
            var container = document.createElement('div');
            container.innerHTML = msg.content;
            msg_div.appendChild(container);
            msg_container.appendChild(msg_div);
            window.zap_global.lastRenderedIndex = messages.length;
            if ((msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight) <= 200) {
                msg_container.scrollTop = msg_container.scrollHeight;
            }
        }
        catch (e) {
            console.log("Failed to render message", msg, e);
        }
    }
    window.zap_global.servers.forEach(function (server, i) {
        var server_div = document.getElementById("server_" + server.id);
        var server_html = "".concat(server.img ? "<img src=\"".concat(server.img, "\" alt=\"").concat(server.nickname, "\">") : "", " ").concat(server.nickname);
        if (!server_div) {
            server_div = document.createElement("div");
            server_div.className = "server";
            server_div.id = "server_" + server.id;
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(server.id, server_div);
            servers_div.insertBefore(server_div, servers_div.lastChild);
        }
        else {
            server_div.innerHTML = server_html;
            server_div.onclick = change_room_binder(server.id, server_div);
        }
    });
    div.addEventListener("contextmenu", function (event) {
        var target = event.target;
        var serverEl = target.closest('[id^="server_"]'); // safer than direct id access
        if (serverEl && event.button === 2) {
            event.preventDefault();
            var serverId = serverEl.id.replace("server_", "");
            var index = 0;
            for (var _i = 0, _a = window.zap_global.servers; _i < _a.length; _i++) {
                var server = _a[_i];
                if (server.id === serverId) {
                    break;
                }
                ;
                index++;
            }
            if (index === window.zap_global.servers.length) {
                index = -1;
            }
            ; // not found
            if (index !== -1) {
                var removed = window.zap_global.servers.splice(index, 1)[0];
                save("servers", window.zap_global.servers);
                document.getElementById("servers_div").removeChild(serverEl);
                console.log("Server ".concat(removed.nickname, " removed."));
                if (window.zap_global.room === serverId) {
                    window.zap_global.room = window.zap_global.servers.length > 0 ? window.zap_global.servers[0].id : "1";
                    window.zap_global.lastRenderedIndex = 0;
                    chat_div.innerHTML = "";
                }
                document.querySelectorAll('.server').forEach(function (el) { return el.classList.remove('selected'); });
                var newSelected = document.getElementById("server_" + window.zap_global.room);
                if (newSelected) {
                    newSelected.classList.add('selected');
                }
            }
            return;
        }
    });
}
function get(type, account, content, room) {
    if (!window.zap_global) {
        return;
    } // Make sure site is loaded fully first
    if (!window.zap_global.messages[room]) {
        window.zap_global.messages[room] = [];
    }
    var parsed_account;
    try {
        parsed_account = JSON.parse(account);
    }
    catch (e) {
        console.error("Invalid JSON acc:", e.message);
        return;
    }
    console.log("Received data:", { type: type, parsed_account: parsed_account, content: content, room: room });
    if (type == 0) {
        var timestamp = content[0], message = content[1];
        console.log("Received message in room ".concat(room, ":"), { timestamp: timestamp, parsed_account: parsed_account, message: message });
        sendNotification("Zap Messenger:  " + parsed_account.name + " sent you a message!", message);
        window.zap_global.messages[room].push({
            timestamp: timestamp,
            account: parsed_account,
            content: message
        });
        save("messages", window.zap_global.messages);
    }
    else if (type == 1) {
        if (!Object.prototype.hasOwnProperty.call(window.zap_global.online, room)) {
            window.zap_global.online[room] = [];
        }
        var old_l = window.zap_global.online[room].filter(function (v) { v.account.id == parsed_account.id; });
        if (old_l.length == 0) {
            old_l = [{ account: parsed_account, last: 20000, list: [], avg: Date.now() }];
        }
        var old = old_l[0];
        var list = old.list, last = old.last;
        last = Date.now() - content;
        list.push(last);
        if (list.length > 10) {
            list.shift();
        }
        var avg_1 = 0;
        list.forEach(function (delta) {
            avg_1 += delta;
        });
        avg_1 /= list.length;
        window.zap_global.online[room].push({ account: parsed_account, last: content, list: list, avg: avg_1 });
    }
    window.zap_global.reTick = true;
}
msg_send.onclick = function () {
    if (window.zap_global.editor) {
        var content = window.zap_global.editor.getHTML();
        window.zap_global.editor.setHTML('');
        window.send.message(content);
    }
};
server_adder.onclick = function () {
    var server_name, server_id, server_img;
    while (!server_name) {
        server_name = prompt("Enter server name:");
    }
    while (!server_id) {
        server_id = prompt("Enter server ID:");
    }
    server_img = prompt("Enter server image URL (optional):", "");
    window.zap_global.servers.push({ id: server_id, nickname: server_name, img: server_img });
    window.zap_global.reTick = true;
    save("servers", window.zap_global.servers);
};
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
var dark_toggle = document.createElement("div");
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
    var md = "";
    if (window.zap_global.editor) {
        md = window.zap_global.editor.getMarkdown();
        window.zap_global.editor.destroy();
    }
    window.zap_global.editor = new window.toastui.Editor({
        el: document.querySelector('div#msg_input'),
        height: '300px',
        initialEditType: 'wysiwyg',
        previewStyle: 'none',
        usageStatistics: false,
        theme: window.zap_global.dark ? 'dark' : 'light',
    });
    window.zap_global.editor.setMarkdown(md);
};
var dark_img = document.createElement("img");
dark_img.src = "https://cdn-icons-png.flaticon.com/512/12377/12377255.png ";
dark_img.style.height = "20px";
dark_img.style.width = "20px";
dark_toggle.appendChild(dark_img);
settings_menu.appendChild(dark_toggle);
//#endregion
function onLoad() {
    dark_toggle.click(); // Set initial dark mode state
    setInterval(onTick, 250); // Start the animation frame loop
}
document.title = "Zap Messenger Rewritten";
var id = setInterval((function () {
    if (typeof window.toastui != "undefined") {
        clearInterval(id);
        onLoad();
    }
}), 1);
setInterval((function () {
    window.send.ping();
    Array.prototype.slice.call(online_bar.children).forEach(function (v) { online_bar.removeChild(v).remove(); });
    var now = Date.now();
    window.zap_global.online[window.zap_global.room].sort(function (a, b) { return a.account.name.localeCompare(b.account.name, undefined, { sensitivity: "base" }); });
    var seen = new Set();
    window.zap_global.online[window.zap_global.room] =
        window.zap_global.online[window.zap_global.room].filter(function (user) {
            if (seen.has(user.account.id)) {
                return false;
            }
            seen.add(user.account.id);
            return true;
        });
    window.zap_global.online[window.zap_global.room].forEach(function (value) {
        if ((value.last - now + 65000) > 0) {
            var container = document.createElement("div");
            container.className = "user_status";
            var status_dot = document.createElement("div");
            status_dot.style.cssText = "border-radius:9999px; border-width:2px; width:15px; height:15px; " + ((value.avg < 900) ? "background-color: green;" : ((value.avg < 30000) ? "background-color: yellow;" : "background-color: red;"));
            container.appendChild(status_dot);
            var username_text = document.createElement("p");
            username_text.innerText = value.account.name;
            username_text.style.margin = "5px";
            username_text.style.marginLeft = "10px";
            container.appendChild(username_text);
            online_bar.appendChild(container);
        }
    });
}), 500);
