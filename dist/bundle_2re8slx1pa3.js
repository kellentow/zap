/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _body_html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./body.html */ \"./src/body.html\");\n/* harmony import */ var _body_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./body.css */ \"./src/body.css\");\n/* harmony import */ var _manifest_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./manifest.json */ \"./src/manifest.json\");\n/* harmony import */ var _main_worker_str_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./main_worker.str.js */ \"./src/main_worker.str.js\");\n/* harmony import */ var _main_str_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./main.str.js */ \"./src/main.str.js\");\n\n\n\n\n\n\nfunction create_css(text) {\n    const style = document.createElement('style');\n    style.textContent = text;\n    document.head.appendChild(style);\n}\n\nfunction create_html(text, parent, ...a) {\n    /**\n     * Adds text as a html object to the parent object\n     * @param {string} text - The html code\n     * @param {HTMLElement} parent - The parent for the code\n     */\n    parent.insertAdjacentHTML('beforeend', text)\n}\n\nlet div = document.getElementById(\"chat_div\");\nif (div) {\n    location.reload(); // Reload if div already exists\n    throw Error(\"Chat div already exists, reloading page to avoid conflicts.\")\n}\n\nfor (let i = 0; i < document.body.children.length; i++) {\n    document.body.children[i].style.display = \"none\";\n}\n\nconsole.log(\"HTML & CSS\")\ncreate_css(_body_css__WEBPACK_IMPORTED_MODULE_1__)\ncreate_html(_body_html__WEBPACK_IMPORTED_MODULE_0__, document.body)\n\n// Manifest\nconsole.log(\"manifest\")\n\nconst jsonString = JSON.stringify(_manifest_json__WEBPACK_IMPORTED_MODULE_2__);\nlet manifestblob = new Blob([jsonString], { type: 'application/json' });\nlet manifestblobUrl = URL.createObjectURL(manifestblob);\nlet manifestLink = document.createElement('link');\n\nmanifestLink.rel = 'manifest';\ndocument.head.appendChild(manifestLink);\nmanifestLink.href = blobUrl;\n\nmanifestLink.onload = (() => { URL.revokeObjectURL(manifestblobUrl) })\n\nconsole.log(\"worker\")\nlet workerblob = new Blob([_main_worker_str_js__WEBPACK_IMPORTED_MODULE_3__], { type: 'application/javascript' });\nlet workerblobUrl = URL.createObjectURL(workerblob);\n\nwindow.worker = new Worker(workerblobUrl)\n\n// Main js\nconsole.log(\"script\")\nlet blob = new Blob([_main_str_js__WEBPACK_IMPORTED_MODULE_4__], { type: 'application/javascript' });\nlet blobUrl = URL.createObjectURL(blob);\nlet script = document.createElement(\"script\")\ndocument.body.appendChild(script)\nscript.src = blobUrl\nscript.onload = (() => { URL.revokeObjectURL(blobUrl) })\n\n//# sourceURL=webpack://zapmessenger/./src/index.js?");

/***/ }),

/***/ "./src/body.css":
/*!**********************!*\
  !*** ./src/body.css ***!
  \**********************/
/***/ ((module) => {

eval("module.exports = \"#servers_div {\\n    position: absolute;\\n    top: 0px;\\n    left: 0px;\\n    width: 75px;\\n    height: 100%;\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    background-color: #4f4f4f;\\n    overflow-y: scroll;\\n}\\n\\n#info_floater {\\n    position: absolute;\\n    bottom: 0px;\\n    left: 0px;\\n    max-width: 75px;\\n    z-index: 1000;\\n    background-color: rgba(0, 0, 0, 0.25);\\n    color: rgba(105, 105, 105, 0.75);\\n    font-family: Arial, sans-serif;\\n}\\n\\n.server img {\\n    width: 100%;\\n    aspect-ratio: 1 / 1;\\n    border-radius: 9999px;\\n    object-fit: cover;\\n    object-position: center;\\n}\\n\\n.server {\\n    width: 100%;\\n    aspect-ratio: 1 / 1;\\n    padding: 10px;\\n    box-sizing: border-box;\\n    border-radius: 9999px;\\n    background-color: #444;\\n    margin: 5px 0;\\n    color: white;\\n    text-align: center;\\n    display: flex;\\n    align-items: column;\\n    justify-content: center;\\n    cursor: pointer;\\n}\\n\\n.server.selected {\\n    outline: 2px solid limegreen;\\n}\\n\\n#chat_inner_div {\\n    position: absolute;\\n    top: 0px;\\n    right: 0px;\\n    width: calc(100% - 75px);\\n    height: 100%;\\n    overflow-y: hidden;\\n    background-color: white;\\n    display: flex;\\n    align-items: left;\\n    flex-direction: column;\\n}\\n\\n#msg_container {\\n    width:100;\\n    height:calc(100% - 50px);\\n    overflow-y: scroll;\\n}\\n\\n.msg {\\n    width: 100%;\\n    padding: 10px;\\n    box-sizing: border-box;\\n    border-radius: 9999px;\\n    background-color: #f1f1f1;\\n    margin: 5px 0;\\n    position: relative;\\n    font-family: Arial, sans-serif;\\n    color: #333;\\n}\\n\\n#message_input_div {\\n    position: absolute;\\n    bottom: 0px;\\n    right: 0px;\\n    width: 100%;\\n    height: 50px;\\n    border-radius: 9999px;\\n    display: flex;\\n    align-items: center;\\n    flex-direction: row;\\n}\\n\\n#msg_input {\\n    margin-right: 10px;\\n    width: 100%;\\n    height: 100%;\\n    border-radius: 9999px;\\n}\\n\\n#msg_send {\\n    margin-right: 10px;\\n    aspect-ratio: 1 / 1;\\n    height: 100%;\\n    border-radius: 50%;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    padding: 0;\\n    border: none;\\n    background: none;\\n    cursor: pointer;\\n}\\n\\n#msg_send_img {\\n    width: 100%;\\n    height: 100%;\\n    border-radius: 50%;\\n    object-fit: cover;\\n    object-position: center;\\n}\\n\\n#chat_div {\\n    position: absolute;\\n    top: 0px;\\n    left: 0px;\\n    width: 100%;\\n    height: 100%;\\n    z-index: 0;\\n    background-color: #777;\\n}\";\n\n//# sourceURL=webpack://zapmessenger/./src/body.css?");

/***/ }),

/***/ "./src/body.html":
/*!***********************!*\
  !*** ./src/body.html ***!
  \***********************/
/***/ ((module) => {

eval("module.exports = \"<link href=\\\"https://cdn.quilljs.com/1.3.6/quill.snow.css\\\" rel=\\\"stylesheet\\\" />\\n<script src=\\\"https://cdn.quilljs.com/1.3.6/quill.min.js\\\"></script>\\n<meta name=\\\"theme-color\\\" content=\\\"#2575fc\\\">\\n<div id=\\\"chat_div\\\">\\n    <div id=\\\"servers_div\\\">\\n        <div class=\\\"server\\\" id=\\\"serveradd\\\">\\n            <img src=\\\"https://cdn-icons-png.flaticon.com/512/1237/1237946.png\\\" alt=\\\"Add Server\\\" />\\n        </div>\\n    </div>\\n    <div id=\\\"chat_inner_div\\\">\\n        <div id=\\\"msg_container\\\"></div>\\n        <div id=\\\"message_input_div\\\">\\n            <div id=\\\"msg_input\\\" style=\\\"width: 100%; overflow: auto;\\\"></div>\\n            <button id=\\\"msg_send\\\">\\n                <img id=\\\"msg_send_img\\\" src=\\\"https://cdn-icons-png.flaticon.com/512/3682/3682321.png\\\" alt=\\\"Send\\\" />\\n            </button>\\n        </div>\\n    </div>\\n    <div id=\\\"info_floater\\\"></div>\\n</div>\";\n\n//# sourceURL=webpack://zapmessenger/./src/body.html?");

/***/ }),

/***/ "./src/main.str.js":
/*!*************************!*\
  !*** ./src/main.str.js ***!
  \*************************/
/***/ ((module) => {

eval("module.exports = \"const global = {\\n    messages: {},\\n    room: \\\"1\\\",\\n    servers: [], // {id, nickname, img} \\n    account: { name: \\\"You\\\", id: Math.random() * 65565 }, // Default \\n    reTick: true\\n}\\n\\nif (typeof send !== 'function') {\\n    console.warn(\\\"send() not defined. Using mock send.\\\");\\n    window.send = function (...args) {\\n        console.log(\\\"Mock send triggered with:\\\", args);\\n    };\\n}\\n\\nif (Notification.permission === \\\"default\\\") {\\n    Notification.requestPermission();\\n}\\n\\nfunction sendNotification(title, message) {\\n    // Only send if page is hidden and notifications are allowed\\n    if (document.hidden && Notification.permission === \\\"granted\\\") {\\n        new Notification(title, { body: message });\\n    }\\n}\\n \\nlet lastRenderedIndex = 0; // Track last rendered message index\\n\\nfunction lbsend(a, b, c, d) {\\n    send(a, b, c, d);\\n    get(a, b, c, d);\\n}\\n\\nfunction save(key, value) {\\n    localStorage.setItem(key, JSON.stringify(value));\\n}\\n\\nfunction load(key, Default) {\\n    // sourcery skip: dont-reassign-parameters\\n    Default = Default || null;\\n    const value = localStorage.getItem(key);\\n    if (value) {\\n        try {\\n            return JSON.parse(value);\\n        } catch (e) {\\n            console.error(`Error parsing JSON for key ${key}:`, e);\\n            return Default;\\n        }\\n    }\\n    return Default;\\n}\\n\\nfunction promptForAccount() { \\n    let name = null;\\n    while (!name || name.trim().length === 0) {\\n        name = prompt(\\\"Enter your name to continue:\\\");\\n        if (name === null) {\\n            alert(\\\"You must enter a name to use the chat.\\\");\\n        }\\n    }\\n    global.account = {\\n        name: name.trim(),\\n        id: crypto.randomUUID()\\n    };\\n    save(\\\"account\\\", global.account);\\n}\\n\\nglobal.messages = load(\\\"messages\\\", {});\\nglobal.servers = load(\\\"servers\\\", [{ id: \\\"1\\\", nickname: \\\"General\\\", img: \\\"\\\" }]);\\nglobal.account = load(\\\"account\\\", {});\\nif (!global.account.name) {\\n    promptForAccount();\\n}\\n\\nfunction get(timestamp, account, message, room) {\\n    if (!global.messages[room]) {\\n        global.messages[room] = [];\\n    }\\n    let parsed_message, parsed_account;\\n    try {\\n        parsed_message = JSON.parse(message);\\n    } catch (e) {\\n        console.error(\\\"Invalid JSON msg:\\\", e.message);\\n        return;\\n    }\\n    try {\\n        parsed_account = JSON.parse(account);\\n    } catch (e) {\\n        console.error(\\\"Invalid JSON acc:\\\", e.message);\\n        return;\\n    }\\n    if (!parsed_account || !parsed_message) {\\n        console.error(\\\"Parsed account or message is null\\\", account, message);\\n        return;\\n    }\\n    console.log(`Received message in room ${room}:`, { timestamp, parsed_account, parsed_message });\\n    sendNotification(\\\"Zap Messenger:  \\\" + parsed_account.name + \\\" sent you a message!\\\", parsed_message[0].data)\\n    global.messages[room].push({\\n        timestamp: timestamp,\\n        account: parsed_account,\\n        content: parsed_message\\n    });\\n    save(\\\"messages\\\", global.messages);\\n    global.reTick = true\\n}\\n\\nconst msg_input = document.getElementById(\\\"msg_input\\\");\\nconst msg_send = document.getElementById(\\\"msg_send\\\");\\nconst chat_div = document.getElementById(\\\"chat_inner_div\\\");\\nconst msg_container = document.getElementById(\\\"msg_container\\\")\\nconst servers_div = document.getElementById(\\\"servers_div\\\");\\nconst server_adder = document.getElementById(\\\"serveradd\\\");\\nconst info_floater = document.getElementById(\\\"info_floater\\\");\\n\\nconst quill = new Quill(msg_input, {\\n    theme: 'snow',\\n    placeholder: 'Type a message...',\\n    modules: {\\n        toolbar: false  // Disable all formatting buttons\\n    }\\n});\\n\\ninfo_floater.innerHTML = `<strong>v${process.env.VERSION}</strong><br>\\n    <strong>Build:</strong> ${process.env.BUILD_ID}<br>`\\n\\nmsg_send.onclick = function () {\\n    const delta = quill.getContents();\\n\\n    const blocks = delta.ops.map(op => {\\n        if (typeof op.insert === 'string') {\\n            return { type: 'text', data: op.insert };\\n        } else if (op.insert.image) {\\n            return { type: 'image', data: op.insert.image };\\n        }\\n    });\\n\\n    if (blocks.some(b => b.data.trim?.())) {\\n        quill.setContents([]); // clear editor\\n        lbsend(Date.now(), JSON.stringify(global.account), JSON.stringify(blocks), global.room);\\n    }\\n}\\n\\nserver_adder.onclick = function () {\\n    let server_name, server_id, server_img;\\n    while (!server_name) {\\n        server_name = prompt(\\\"Enter server name:\\\");\\n    }\\n    while (!server_id) {\\n        server_id = prompt(\\\"Enter server ID:\\\");\\n    }\\n    server_img = prompt(\\\"Enter server image URL (optional):\\\", \\\"\\\");\\n    global.servers.push({ id: server_id, nickname: server_name, img: server_img });\\n    global.reTick = true\\n    save(\\\"servers\\\", global.servers);\\n}\\n\\nfunction change_room_binder(room, element) {\\n    return function () {\\n        lastRenderedIndex = 0; // Reset last rendered index when changing room\\n        msg_container.innerHTML = \\\"\\\"\\n\\n        global.room = room;\\n        console.log(\\\"Changed room to:\\\", room);\\n        // Optionally, clear the messages for the new room\\n        global.messages[room] = global.messages[room] || [];\\n\\n        global.servers.forEach(function (server) {\\n            let server_div = document.getElementById(\\\"server_\\\" + server.id);\\n            if (server_div) {\\n                server_div.classList.remove(\\\"selected\\\");\\n            }\\n        });\\n        if (element) {\\n            element.classList.add(\\\"selected\\\");\\n        }\\n        global.reTick = true\\n    }\\n}\\n\\nfunction onTick() {\\n    if (!global.reTick) {return};\\n    global.reTick = false\\n    if (!div) {\\n        console.warn(\\\"Main div not found, reloading page to avoid conflicts.\\\");\\n        location.reload(); // Reload if div is not found\\n        return;\\n    }\\n    const messages = global.messages[global.room] || [];\\n    for (let i = lastRenderedIndex; i < messages.length; i++) {\\n        let msg = messages[i];\\n        console.log(msg)\\n        try {\\n            let msg_div = document.createElement(\\\"div\\\");\\n            msg_div.className = \\\"msg\\\";\\n            msg_div.id = \\\"msg_\\\" + i;\\n            msg_div.innerHTML = `<strong>${msg.account.name}</strong> \\n            <span class=\\\"timestamp\\\">${new Date(msg.timestamp).toLocaleTimeString()}</span><br>`;\\n            msg.content.forEach((data) => {\\n                if (data.type === \\\"text\\\") {\\n                    const pre = document.createElement(\\\"pre\\\");\\n                    pre.textContent = data.data;\\n                    msg_div.appendChild(pre);\\n                } else if (data.type === \\\"image\\\") {\\n                    const img = document.createElement(\\\"img\\\");\\n                    try {\\n                        img.src = data.data\\n                        msg_div.appendChild(img);\\n                    } catch (e) {\\n                        console.warn(\\\"Invalid image URL:\\\", data.data);\\n                    }\\n                } else if (data.type === \\\"video\\\") {\\n                    const video = document.createElement(\\\"video\\\");\\n                    try {\\n                        video.src = data.data;\\n                        video.controls = true;\\n                        msg_div.appendChild(video);\\n                    } catch (e) {\\n                        console.warn(\\\"Invalid video URL:\\\", data.data);\\n                    }\\n                }\\n            });\\n\\n            msg_container.appendChild(msg_div);\\n            lastRenderedIndex = messages.length;\\n            if ((msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight) <= 200) {\\n                msg_container.scrollTop = msg_container.scrollHeight\\n            }\\n        } catch {\\n            console.log(\\\"Failed to render message\\\", msg)\\n        }\\n    }\\n\\n    global.servers.forEach(function (server, i) {\\n        let server_div = document.getElementById(\\\"server_\\\" + server.id);\\n        let server_html = `${server.img ? `<img src=\\\"${server.img}\\\" alt=\\\"${server.nickname}\\\">` : \\\"\\\"} ${server.nickname}`;\\n        if (!server_div) {\\n            server_div = document.createElement(\\\"div\\\");\\n            server_div.className = \\\"server\\\";\\n            server_div.id = \\\"server_\\\" + server.id;\\n            server_div.innerHTML = server_html;\\n            server_div.onclick = change_room_binder(server.id, server_div);\\n            servers_div.insertBefore(server_div, servers_div.lastChild);\\n        } else {\\n            server_div.innerHTML = server_html;\\n            server_div.onclick = change_room_binder(server.id, server_div);\\n        }\\n    });\\n}\\n\\ndiv.addEventListener(\\\"contextmenu\\\", function (event) {\\n    const serverEl = event.target.closest('[id^=\\\"server_\\\"]'); // safer than direct id access\\n    if (serverEl && event.button === 2) {\\n        event.preventDefault();\\n        const serverId = serverEl.id.replace(\\\"server_\\\", \\\"\\\");\\n        const index = global.servers.findIndex(s => s.id === serverId);\\n        if (index !== -1) {\\n            const removed = global.servers.splice(index, 1)[0];\\n            save(\\\"servers\\\", global.servers);\\n\\n            document.getElementById(\\\"servers_div\\\").removeChild(serverEl);\\n            console.log(`Server ${removed.nickname} removed.`);\\n            if (global.room === serverId) {\\n                global.room = global.servers.length > 0 ? global.servers[0].id : \\\"1\\\";\\n                lastRenderedIndex = 0;\\n                chat_div.innerHTML = \\\"\\\";\\n            }\\n\\n            document.querySelectorAll('.server').forEach(el => el.classList.remove('selected'));\\n            const newSelected = document.getElementById(\\\"server_\\\" + global.room);\\n            if (newSelected) {\\n                newSelected.classList.add('selected');\\n            }\\n        }\\n\\n        return;\\n    }\\n});\\n\\nwindow.get = get // env requires window.get\\n\\nsetInterval(onTick, 500) // Start the animation frame loop\";\n\n//# sourceURL=webpack://zapmessenger/./src/main.str.js?");

/***/ }),

/***/ "./src/main_worker.str.js":
/*!********************************!*\
  !*** ./src/main_worker.str.js ***!
  \********************************/
/***/ ((module) => {

eval("module.exports = \"\";\n\n//# sourceURL=webpack://zapmessenger/./src/main_worker.str.js?");

/***/ }),

/***/ "./src/manifest.json":
/*!***************************!*\
  !*** ./src/manifest.json ***!
  \***************************/
/***/ ((module) => {

eval("module.exports = JSON.parse('{\"name\":\"Zap Messenger\",\"short_name\":\"Zap\",\"start_url\":\".\",\"display\":\"standalone\",\"background_color\":\"#1a1a1a\",\"theme_color\":\"#2575fc\"}');\n\n//# sourceURL=webpack://zapmessenger/./src/manifest.json?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;