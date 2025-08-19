import htmlContent from './body.html';
import cssContent from './body.css';
import manifestData from './manifest.json'
import workerString from './main_worker.str.js'
import mainString from '../dist/ts/main.str.js'

function create_script(src) {
    let script = document.createElement("script")
    document.body.appendChild(script)
    script.src = src
    return script
}

function create_text_script(text) {
    let blob = new Blob([mainString], { type: 'application/javascript' });
    let blobUrl = URL.createObjectURL(blob);
    let script = create_script(blobUrl);
    script.onload = (() => { URL.revokeObjectURL(blobUrl) });
    return script
}

function create_css(text) {
    const style = document.createElement('style');
    style.textContent = text;
    document.head.appendChild(style);
}

function create_html(text, parent, ...a) {
    /**
     * Adds text as a html object to the parent object
     * @param {string} text - The html code
     * @param {HTMLElement} parent - The parent for the code
     */
    const container = document.createElement('div');
    container.innerHTML = text;
    
    // Append elements (except scripts)
    Array.from(container.children).forEach(el => {
        if (el.tagName !== 'SCRIPT') {parent.appendChild(el)}
    });

    // Execute scripts
    Array.from(container.querySelectorAll('script')).forEach(script => {
        if (script.src) {
            create_script(script.src);
        } else {
            create_text_script(script.textContent);
        }
    });
}


let div = document.getElementById("chat_div");
if (div) {
    location.reload(); // Reload if div already exists
    throw Error("Chat div already exists, reloading page to avoid conflicts.")
}

for (let i = 0; i < document.body.children.length; i++) {
    document.body.children[i].style.display = "none";
}

console.log("HTML & CSS")
create_css(cssContent)
create_html(htmlContent, document.body)

// Manifest
console.log("manifest")

const jsonString = JSON.stringify(manifestData);
let manifestblob = new Blob([jsonString], { type: 'application/json' });
let manifestblobUrl = URL.createObjectURL(manifestblob);
let manifestLink = document.createElement('link'); 

manifestLink.rel = 'manifest';
document.head.appendChild(manifestLink);
manifestLink.href = manifestblobUrl;

manifestLink.onload = (() => { URL.revokeObjectURL(manifestblobUrl) })

console.log("worker")
let workerblob = new Blob([workerString], { type: 'application/javascript' });
let workerblobUrl = URL.createObjectURL(workerblob);

window.worker = new Worker(workerblobUrl)

// Main js
console.log("script")
create_text_script(mainString)