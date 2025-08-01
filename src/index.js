var global = {
    messages: {}
}

delay(function () { }, 0)

console.log("a")
var canvas = document.getElementById("canvas");
console.log(canvas)

var div = document.getElementById("chat_div");
if (!div) {
    div = document.createElement("div");
    div.style.cssText = "background: none; height: 966px; width: 725px; left: 0px; top: 0px; z-index: 0;"
    div.style.width = canvas.width + "px";
    div.style.height = canvas.height + "px";
    div.id = "chat_div";
    canvas.parentElement.appendChild(div);
}
console.log(div)
canvas.style.display = "none"

function get(timestamp, account, message, room) {
    if (!global.messages[room]) {
        global.messages[room] = [];
    }
    try {
        message = JSON.parse(message);
    } catch (e) {
        console.error("Invalid JSON msg:", e.message);
        return;
    }
    try {
        account = JSON.parse(account);
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

main_div = document.createElement("div");
main_div.style.position = "relative";
main_div.style.top = "0px";
main_div.style.left = "0px";
main_div.style.width = "90%";
main_div.style.height = "100%";
main_div.style.overflowY = "scroll";
main_div.style.backgroundColor = "white";
div.appendChild(main_div);

msg_input_div = document.createElement("div");
msg_input_div.style.position = "relative";
msg_input_div.style.bottom = "0px";
msg_input_div.style.right = "0px";
msg_input_div.style.width = "90%";
main_div.appendChild(msg_input_div);

msg_input = document.createElement("input")
msg_input.type = "text"
msg_input.placeholder = "Type a message"
msg_input.style.width = "90%";
msg_input_div.appendChild(msg_input);

msg_send = document.createElement("button")
msg_send.value = "Send"
msg_send.innerText = "Send"
msg_send.style.width = "10%";
msg_send.onclick = function () {
    var msg = msg_input.value;
    if (msg) {
        get(Date.now(), JSON.stringify({ name: "You" }), JSON.stringify({ text: msg }), "test_room");
        msg_input.value = "";
        send(Date.now(), JSON.stringify({ name: "You" }), JSON.stringify({ text: msg }), "test_room")
    }
}
msg_input_div.appendChild(msg_send);


