import htmlContent from './body.html';
import cssContent from './body.css';
import manifestData from './manifest.json'
import workerString from './main_worker.str.js'
import mainString from '../dist/ts/str.main.js'

function createScript(src) {
    let script = document.createElement("script")
    document.body.appendChild(script)
    script.src = src
    return script
}

function createTextScript(text) {
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

/*
import { app, BrowserWindow } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
*/
