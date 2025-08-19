/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/body.html":
/*!***********************!*\
  !*** ./src/body.html ***!
  \***********************/
/***/ (() => {

eval("throw new Error(\"Module parse failed: Unexpected token (1:0)\\nYou may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders\\n> <link href=\\\"https://cdn.quilljs.com/1.3.6/quill.snow.css\\\" rel=\\\"stylesheet\\\" />\\n| <script src=\\\"https://cdn.quilljs.com/1.3.6/quill.min.js\\\"></script>\\n| <meta name=\\\"theme-color\\\" content=\\\"#2575fc\\\">\");\n\n//# sourceURL=webpack://zapmessenger/./src/body.html?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _body_html__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./body.html */ \"./src/body.html\");\n/* harmony import */ var _body_html__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_body_html__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _body_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./body.css */ \"./src/body.css\");\n/* harmony import */ var _service_worker_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./service-worker.js */ \"./src/service-worker.js\");\n\n\n\n\nlet div = document.getElementById(\"chat_div\");\nif (!div) {\n    for (let i = 0; i < document.body.children.length; i++) {\n        document.body.children[i].style.display = \"none\";\n    } \n    document.body.insertAdjacentHTML('beforeend', (_body_html__WEBPACK_IMPORTED_MODULE_0___default()))\n    const style = document.createElement('style');\n    style.textContent = _body_css__WEBPACK_IMPORTED_MODULE_1__;\n    document.head.appendChild(style);\n    let blob = new Blob([_service_worker_js__WEBPACK_IMPORTED_MODULE_2__], { type: 'application/javascript' });\n    let blobUrl = URL.createObjectURL(blob)\n\n    // Register the service worker using the Blob URL\n    new Worker(blobUrl)\n\n    const jsonString = JSON.stringify(manifestData);\n    blob = new Blob([jsonString], { type: 'application/json' });\n    blobUrl = URL.createObjectURL(blob);\n\n    let manifestLink = document.querySelector('link[rel=\"manifest\"]');\n\n    if (!manifestLink) {\n        manifestLink = document.createElement('link');\n        manifestLink.rel = 'manifest';\n        document.head.appendChild(manifestLink);\n    }\n\n    manifestLink.href = blobUrl;\n\n} else {\n    console.warn(\"Chat div already exists, reloading page to avoid conflicts.\");\n    location.reload(); // Reload if div already exists\n}\ndiv = document.getElementById(\"chat_div\");\n\n//# sourceURL=webpack://zapmessenger/./src/index.js?");

/***/ }),

/***/ "./src/body.css":
/*!**********************!*\
  !*** ./src/body.css ***!
  \**********************/
/***/ ((module) => {

"use strict";
eval("module.exports = \"#servers_div {\\n    position: absolute;\\n    top: 0px;\\n    left: 0px;\\n    width: 75px;\\n    height: 100%;\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    background-color: #4f4f4f;\\n    overflow-y: scroll;\\n}\\n\\n#info_floater {\\n    position: absolute;\\n    bottom: 0px;\\n    left: 0px;\\n    max-width: 75px;\\n    z-index: 1000;\\n    background-color: rgba(0, 0, 0, 0.25);\\n    color: rgba(105, 105, 105, 0.75);\\n    font-family: Arial, sans-serif;\\n}\\n\\n.server img {\\n    width: 100%;\\n    aspect-ratio: 1 / 1;\\n    border-radius: 9999px;\\n    object-fit: cover;\\n    object-position: center;\\n}\\n\\n.server {\\n    width: 100%;\\n    aspect-ratio: 1 / 1;\\n    padding: 10px;\\n    box-sizing: border-box;\\n    border-radius: 9999px;\\n    background-color: #444;\\n    margin: 5px 0;\\n    color: white;\\n    text-align: center;\\n    display: flex;\\n    align-items: column;\\n    justify-content: center;\\n    cursor: pointer;\\n}\\n\\n.server.selected {\\n    outline: 2px solid limegreen;\\n}\\n\\n#chat_inner_div {\\n    position: absolute;\\n    top: 0px;\\n    right: 0px;\\n    width: calc(100% - 75px);\\n    height: 100%;\\n    overflow-y: hidden;\\n    background-color: white;\\n    display: flex;\\n    align-items: left;\\n    flex-direction: column;\\n}\\n\\n#msg_container {\\n    width:100;\\n    height:calc(100% - 50px);\\n    overflow-y: scroll;\\n}\\n\\n.msg {\\n    width: 100%;\\n    padding: 10px;\\n    box-sizing: border-box;\\n    border-radius: 9999px;\\n    background-color: #f1f1f1;\\n    margin: 5px 0;\\n    position: relative;\\n    font-family: Arial, sans-serif;\\n    color: #333;\\n}\\n\\n#message_input_div {\\n    position: absolute;\\n    bottom: 0px;\\n    right: 0px;\\n    width: 100%;\\n    height: 50px;\\n    border-radius: 9999px;\\n    display: flex;\\n    align-items: center;\\n    flex-direction: row;\\n}\\n\\n#msg_input {\\n    margin-right: 10px;\\n    width: 100%;\\n    height: 100%;\\n    border-radius: 9999px;\\n}\\n\\n#msg_send {\\n    margin-right: 10px;\\n    aspect-ratio: 1 / 1;\\n    height: 100%;\\n    border-radius: 50%;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    padding: 0;\\n    border: none;\\n    background: none;\\n    cursor: pointer;\\n}\\n\\n#msg_send_img {\\n    width: 100%;\\n    height: 100%;\\n    border-radius: 50%;\\n    object-fit: cover;\\n    object-position: center;\\n}\\n\\n#chat_div {\\n    position: absolute;\\n    top: 0px;\\n    left: 0px;\\n    width: 100%;\\n    height: 100%;\\n    z-index: 0;\\n    background-color: #777;\\n}\";\n\n//# sourceURL=webpack://zapmessenger/./src/body.css?");

/***/ }),

/***/ "./src/service-worker.js":
/*!*******************************!*\
  !*** ./src/service-worker.js ***!
  \*******************************/
/***/ ((module) => {

"use strict";
eval("module.exports = \"manifestData = JSON.parse(`\\n{\\n    \\\"name\\\": \\\"Zap Messenger\\\",\\n    \\\"short_name\\\": \\\"Zap\\\",\\n    \\\"start_url\\\": \\\".\\\",\\n    \\\"display\\\": \\\"standalone\\\",\\n    \\\"background_color\\\": \\\"#1a1a1a\\\",\\n    \\\"theme_color\\\": \\\"#2575fc\\\"\\n}\\n`)\\n\\nconst CACHE_NAME = 'my-cache-v1';\\nconst FILES_TO_CACHE = [\\n    'https://cdn-icons-png.flaticon.com/512/1237/1237946.png',// add server image\\n    'https://cdn-icons-png.flaticon.com/512/3682/3682321.png',// send button image\\n    'https://cdn.quilljs.com/1.3.6/quill.snow.css',           //quill stuff for msg input\\n];\\nconst BLOBS_TO_CACHE = {\\n    'manifest.json': new Response(JSON.stringify(manifestData), {\\n        headers: { 'Content-Type': 'application/json' }\\n    })\\n}\\n\\n// Install event - cache files\\nself.addEventListener('install', event => {\\n    event.waitUntil(\\n        caches.open(CACHE_NAME)\\n            .then(cache => cache.addAll(FILES_TO_CACHE))\\n            .then(() => self.skipWaiting())\\n    );\\n    caches.open('my-image-cache').then(cache => {\\n        BLOBS_TO_CACHE.keys().forEach(key => {\\n            cache.put('/' + String(key), BLOBS_TO_CACHE[key]);\\n        });\\n    });\\n});\\n\\n// Activate event - cleanup old caches\\nself.addEventListener('activate', event => {\\n    event.waitUntil(\\n        caches.keys().then(keys =>\\n            Promise.all(\\n                keys.map(key => {\\n                    if (key !== CACHE_NAME) {\\n                        return caches.delete(key);\\n                    }\\n                })\\n            )\\n        ).then(() => self.clients.claim())\\n    );\\n});\\n\\n// Fetch event - respond with cache or network\\nself.addEventListener('fetch', event => {\\n    event.respondWith(\\n        caches.match(event.request)\\n            .then(cachedResponse => {\\n                if (cachedResponse) {return cachedResponse};\\n                return fetch(event.request);\\n            })\\n    );\\n});\\n\";\n\n//# sourceURL=webpack://zapmessenger/./src/service-worker.js?");

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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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