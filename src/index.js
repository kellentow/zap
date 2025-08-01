import { stampURI, stampURIvideo } from './utils.js';

global = {
    messages: {}
}

function get(timestamp, account, message, room) {
    if (!global.messages[room]) {
        global.messages[room] = [];
    }
    try {
        var message = JSON.parse(message);
    } catch (e) {
        console.error("Invalid JSON msg:", e.message);
        return;
    }
    try {
        var account = JSON.parse(account);
    } catch (e) {
        console.error("Invalid JSON acc:", e.message);
        return;
    }
    global.messages[room].push({
        timestamp: timestamp,
        account: account,
        message: message
    });
}

