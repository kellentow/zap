(() => {
  // src/elements.ts
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

  // src/crypto.ts
  var crypto_session = class _crypto_session {
    static version = 1;
    id;
    other_key;
    self_keys;
    constructor(id2, other_key, self_keys) {
      this.id = id2;
      this.other_key = other_key;
      this.self_keys = self_keys;
    }
    async encrypt(message) {
      const encoded = new TextEncoder().encode(message);
      return await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, this.other_key, encoded);
    }
    async decrypt(ciphertext) {
      const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, this.self_keys.privateKey, ciphertext);
      return new TextDecoder().decode(decrypted);
    }
    async serialize() {
      return {
        version: _crypto_session.version,
        id: this.id,
        other_key: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", this.other_key)))),
        self_keys: {
          publicKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", this.self_keys.publicKey)))),
          privateKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", this.self_keys.privateKey))))
        }
      };
    }
    static async deserialize(data) {
      if (data.version !== _crypto_session.version) {
        throw new Error("Incompatible crypto_session version");
      }
      let other_key_buffer = Uint8Array.from(atob(data.other_key), (c) => c.charCodeAt(0));
      let other_key = await window.crypto.subtle.importKey("spki", other_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
      let self_public_key_buffer = Uint8Array.from(atob(data.self_keys.publicKey), (c) => c.charCodeAt(0));
      let self_private_key_buffer = Uint8Array.from(atob(data.self_keys.privateKey), (c) => c.charCodeAt(0));
      let self_public_key = await window.crypto.subtle.importKey("spki", self_public_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
      let self_private_key = await window.crypto.subtle.importKey("pkcs8", self_private_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
      let self_keys = { publicKey: self_public_key, privateKey: self_private_key };
      return new _crypto_session(data.id, other_key, self_keys);
    }
  };
  async function makeKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );
    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    console.log("Public Key:", btoa(String.fromCharCode(...new Uint8Array(publicKey))));
    console.log("Private Key:", btoa(String.fromCharCode(...new Uint8Array(privateKey))));
    return { publicKey, privateKey, keyPair };
  }
  var crypto_manager = class _crypto_manager {
    static version = 1;
    self_keys;
    sessions = {};
    constructor(self_keys) {
      this.self_keys = self_keys;
    }
    static async init() {
      const { keyPair } = await makeKeys();
      return new _crypto_manager(keyPair);
    }
    get_session(id2) {
      if (id2 in this.sessions) {
        return this.sessions[id2];
      }
      return null;
    }
    add_session(id2, other_key) {
      if (id2 in this.sessions) {
        return this.sessions[id2];
      }
      let other_key_buffer = Uint8Array.from(atob(other_key), (c) => c.charCodeAt(0));
      return window.crypto.subtle.importKey("spki", other_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]).then((imported_key) => {
        let new_session = new crypto_session(id2, imported_key, this.self_keys);
        this.sessions[id2] = new_session;
        return new_session;
      });
    }
    async decrypt(ciphertext) {
      const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, this.self_keys.privateKey, ciphertext);
      return new TextDecoder().decode(decrypted);
    }
    async serialize() {
      let sessions_serialized = {};
      for (let [id2, session] of Object.entries(this.sessions)) {
        sessions_serialized[id2] = session.serialize();
      }
      return {
        version: _crypto_manager.version,
        self_keys: {
          publicKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", this.self_keys.publicKey)))),
          privateKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", this.self_keys.privateKey))))
        },
        sessions: sessions_serialized
      };
    }
    static async deserialize(data) {
      if (data.version !== _crypto_manager.version) {
        throw new Error("Incompatible crypto_manager version");
      }
      let self_public_key_buffer = Uint8Array.from(atob(data.self_keys.publicKey), (c) => c.charCodeAt(0));
      let self_private_key_buffer = Uint8Array.from(atob(data.self_keys.privateKey), (c) => c.charCodeAt(0));
      let self_public_key = await window.crypto.subtle.importKey("spki", self_public_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
      let self_private_key = await window.crypto.subtle.importKey("pkcs8", self_private_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
      let self_keys = { publicKey: self_public_key, privateKey: self_private_key };
      let manager = new _crypto_manager(self_keys);
      for (let [id2, session_data] of Object.entries(data.sessions)) {
        manager.sessions[id2] = await crypto_session.deserialize(session_data);
      }
      return manager;
    }
  };

  // src/helpers.ts
  var encrytion_enabled = true;
  var encrytion_ready = false;
  var session_crypto = null;
  crypto_manager.init().then((manager) => {
    session_crypto = manager;
    encrytion_ready = true;
  });
  function sendNotification(title, message) {
    if (document.hidden && Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
  }
  function change_room_binder(global, room, element) {
    return function() {
      global.lastRenderedIndex = 0;
      msg_container.innerHTML = "";
      global.room = room;
      console.log("Changed room to:", room);
      global.messages[room] = global.messages[room] || [];
      global.servers.forEach(function(server) {
        let server_div = document.getElementById("server_" + server.id);
        if (server_div) {
          server_div.classList.remove("selected");
        }
      });
      if (element) {
        element.classList.add("selected");
      }
      load_db(global.db, "messages").then((messages) => {
        console.log(messages);
        let room_messages = messages.filter((a) => {
          return a.id && a.id.startsWith(global.room + "--");
        });
        console.log(messages, room_messages);
        global.messages[global.room].push(...room_messages);
        global.messages[global.room].sort((a, b) => {
          return a.timestamp - b.timestamp;
        });
        global.reTick = true;
      });
      global.reTick = true;
      let send_join = function() {
        if (!encrytion_ready) {
          return setTimeout(send_join, 10);
        }
        senders.join(global);
        senders.crypto_request(global);
      };
      send_join();
    };
  }
  if (typeof window.send !== "function") {
    console.warn("send() not defined. Using mock send.");
    window.send = function(a, b, c, d) {
      console.debug("Mock send triggered with:", [a, b, c, d]);
    };
  }
  function lbsend(a, b, c, d, encrypt = void 0, encryption_sessions = []) {
    if (typeof encrypt == "undefined") {
      encrypt = true;
    }
    if (encrypt && encrytion_ready) {
      let messages = [];
      let allPromises = encryption_sessions.map((session) => {
        let enc_a = session.encrypt(JSON.stringify(a));
        let enc_b = session.encrypt(JSON.stringify(b));
        let enc_c = session.encrypt(JSON.stringify(c));
        let enc_d = session.encrypt(JSON.stringify(d));
        return Promise.all([enc_a, enc_b, enc_c, enc_d]).then(([a2, b2, c2, d2]) => {
          let str_a = arrayBufferToBase64(a2);
          let str_b = arrayBufferToBase64(b2);
          let str_c = arrayBufferToBase64(c2);
          let str_d = arrayBufferToBase64(d2);
          messages.push([str_a, str_b, str_c, str_d, session.id]);
        });
      });
      Promise.all(allPromises).then(() => {
        let str_msgs = JSON.stringify(messages);
        lbsend(str_msgs, null, null, null, false);
      });
    } else {
      window.send(a, b, c, d);
      window.get(a, b, c, d);
    }
  }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function load(key, Default) {
    let value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error("Error parsing JSON for key ".concat(key, ":"), e);
        return Default;
      }
    }
    return Default;
  }
  function save_db_key(db, table, value, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(table, "readwrite");
      const store = tx.objectStore(table);
      console.log(key, value);
      const request2 = store.put(value, key);
      request2.onsuccess = () => resolve();
      request2.onerror = () => reject(request2.error);
    });
  }
  function load_db(db, table) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(table, "readonly");
      const store = tx.objectStore(table);
      const request2 = store.getAll();
      request2.onsuccess = () => resolve(request2.result);
      request2.onerror = () => reject(request2.error);
    });
  }
  function base64ToArrayBuffer(base64) {
    let binary = atob(base64);
    let len = binary.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  function arrayBufferToBase64(buffer) {
    let bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  var senders = {
    message: function(global, text, recipients) {
      if (typeof text !== "string") {
        text = JSON.stringify(text);
      }
      if (text.length > 2 ** 12) {
        console.warn("Message too long, not sending.");
        return;
      }
      let time = Date.now();
      let message_id = `${global.room}--${crypto.randomUUID()}-${crypto.randomUUID()}`;
      let recipients_sessions = encrytion_enabled && recipients ? recipients.map((r) => session_crypto.get_session(r)).filter((s) => s) : [];
      lbsend(0, JSON.stringify(global.account), [time, text, message_id], global.room, encrytion_enabled, recipients_sessions);
    },
    ping: function(global, recipients) {
      let recipients_sessions = encrytion_enabled && recipients ? recipients.map((r) => session_crypto.get_session(r)).filter((s) => s) : [];
      lbsend(1, JSON.stringify(global.account), Date.now(), global.room, true, recipients_sessions);
    },
    join: function(global) {
      lbsend(2, JSON.stringify(global.account), Date.now(), global.room, false);
      senders.crypto_request(global);
    },
    crypto: function(global, message) {
      if (typeof message !== "string") {
        message = JSON.stringify(message);
      }
      lbsend(255, JSON.stringify(global.account), message, global.room, false);
    },
    crypto_request: function(global) {
      console.debug("Asking for keys");
      senders.crypto(global, { type: "KEYrequest", id: global.account.id });
    },
    crypto_response: function(global) {
      console.debug("sending key");
      if (encrytion_ready && typeof global.account != "undefined") {
        window.crypto.subtle.exportKey("spki", session_crypto.self_keys.publicKey).then((exported) => {
          senders.crypto(global, { type: "KEYresponse", id: global.account.id, public: arrayBufferToBase64(exported) });
        });
      } else {
        setTimeout(senders.crypto_response, 100, [global]);
      }
    },
    base: function(global, a, b, c, d) {
      window.send(a, b, c, d);
    },
    bind: function(global) {
      let new_sender = {};
      Object.entries(senders).forEach(([k, v]) => {
        new_sender[k] = function(...args) {
          v(global, ...args);
        };
      });
      return new_sender;
    }
  };
  var recievers = {
    message: function(global, account, content, room) {
      var timestamp = content[0], message = content[1], id2 = content[2];
      console.debug("Received message in room ".concat(room, ":"), { timestamp, account, message });
      sendNotification("Zap Messenger:  " + account.name + " sent you a message!", message);
      let new_message = {
        timestamp,
        account,
        content: message,
        id: id2
      };
      global.messages[room].push(new_message);
      save_db_key(global.db, "messages", new_message);
    },
    ping: function(global, account, content, room) {
      if (!Object.prototype.hasOwnProperty.call(global.online, room)) {
        global.online[room] = [];
      }
      let old_l = global.online[room].filter(function(v) {
        v.account.id == account.id;
      });
      if (old_l.length == 0) {
        old_l = [{ account, last: 2e4, list: [], avg: Date.now() }];
      }
      let old = old_l[0];
      var list = old.list, last = old.last;
      last = Date.now() - content;
      list.push(last);
      if (list.length > 10) {
        list.shift();
      }
      let avg_1 = 0;
      list.forEach(function(delta) {
        avg_1 += delta;
      });
      avg_1 /= list.length;
      global.online[room].unshift({ account, last: content, list, avg: avg_1 });
    },
    join: function(global, account, content, room) {
      recievers.ping(global, account, content, room);
    },
    crypto: function(global, account, content, room) {
      if (typeof content === "string") {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.error("Invalid JSON crypto:", e.message, content);
          return;
        }
      }
      if (!content.type) {
        console.warn("No type in crypto message:", content);
        return;
      }
      if (content.version > crypto_manager.version) {
        console.warn("Other user is on a newer version of the cryptography manager:", content.version, ">", crypto_manager.version);
        console.warn("Some features may not work as expected and may cause glitches.");
      }
      if (content.type == "KEYrequest") {
        console.debug("Got key request from " + account.id);
        senders.crypto_response(global, account);
      } else if (content.type == "KEYresponse") {
        if (content.public && content.public != "E2EE DENIED") {
          console.debug("Got key from " + account.id);
          let session = session_crypto.add_session(account.id, content.public);
        } else {
          console.warn("User ".concat(account.id, " denied sending their public key."));
        }
      } else {
        console.warn("Unknown crypto message type:", content);
      }
    },
    all: async function(global, type, stringed_account, content, room) {
      if (stringed_account == null) {
        let enc_msg = JSON.parse(type);
        for (let i = 0; i < enc_msg.length; i++) {
          let message = enc_msg[i];
          if (message[4] == global.account.id) {
            type = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[0])));
            stringed_account = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[1])));
            content = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[2])));
            room = JSON.parse(await session_crypto.decrypt(base64ToArrayBuffer(message[3])));
            return await recievers.all(global, type, stringed_account, content, room);
          }
        }
        ;
        console.warn("No block for us in encrypted message, ignoring.");
        return;
      }
      if (!global) {
        return;
      }
      if (!global.messages[room]) {
        global.messages[room] = [];
      }
      let account;
      try {
        account = JSON.parse(stringed_account);
      } catch (e) {
        console.error("Invalid JSON acc:", e.message, stringed_account);
        return;
      }
      if (type == 0) {
        recievers.message(global, account, content, room);
      } else if (type == 1) {
        recievers.ping(global, account, content, room);
      } else if (type == 2) {
        recievers.join(global, account, content, room);
      } else if (type == 255) {
        recievers.crypto(global, account, content, room);
      } else {
        console.warn(`${type} is a unknown message type`);
      }
      global.reTick = true;
    },
    bind: function(global) {
      let new_funcs = {};
      new_funcs.message = (...args) => {
        recievers.message(global, ...args);
      };
      new_funcs.ping = (...args) => {
        recievers.ping(global, ...args);
      };
      new_funcs.join = (...args) => {
        recievers.join(global, ...args);
      };
      new_funcs.crypto = (...args) => {
        recievers.crypto(global, ...args);
      };
      new_funcs.all = (...args) => {
        recievers.all(global, ...args);
      };
      return new_funcs;
    }
  };

  // src/loops.ts
  function onPing(global) {
    if (!global.online[global.room]) {
      global.online[global.room] = [];
    }
    senders.ping(global, window.zap_global.online[window.zap_global.room].map((ping) => {
      return ping.account.id;
    }));
    Array.prototype.slice.call(online_bar.children).forEach(function(v) {
      online_bar.removeChild(v).remove();
    });
    let now = Date.now();
    global.online[global.room].sort(function(a, b) {
      return a.account.name.localeCompare(b.account.name, void 0, { sensitivity: "base" });
    });
    let seen = /* @__PURE__ */ new Set();
    global.online[global.room] = global.online[global.room].filter(function(user) {
      if (seen.has(user.account.id)) {
        return false;
      }
      seen.add(user.account.id);
      return true;
    });
    global.online[global.room].forEach(function(value) {
      if (value.last - now + 65e3 > 0) {
        let container = document.createElement("div");
        container.className = "user_status";
        let status_dot = document.createElement("div");
        status_dot.style.cssText = "border-radius:9999px; border-width:2px; width:15px; height:15px; " + (value.avg < 900 ? "background-color: green;" : value.avg < 3e4 ? "background-color: yellow;" : "background-color: red;");
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
  function onTick(global) {
    console.log("A");
    if (!global.reTick) {
      return;
    }
    ;
    global.reTick = false;
    if (!div) {
      console.warn("Main div not found, reloading page to avoid conflicts.");
      location.reload();
      return;
    }
    const messages = global.messages[global.room] || [];
    console.log(messages);
    const start = global.lastRenderedIndex;
    for (let i = start; i < Math.min(messages.length, start + 100); i++) {
      let msg = messages[i];
      try {
        let msg_div = document.createElement("div");
        msg_div.className = "msg";
        msg_div.id = "msg_" + msg.id;
        msg_div.innerHTML = `<strong>${msg.account.name}</strong> 
            <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span><br>`;
        let container = document.createElement("div");
        container.innerHTML = msg.content;
        msg_div.appendChild(container);
        msg_container.appendChild(msg_div);
        global.lastRenderedIndex = messages.length;
        if (msg_container.scrollHeight - msg_container.scrollTop - msg_container.clientHeight <= 200) {
          msg_container.scrollTop = msg_container.scrollHeight;
        }
      } catch (e) {
        console.log("Failed to render message", msg, e);
      }
    }
    global.servers.forEach(function(server, i) {
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
    div.addEventListener("contextmenu", function(event) {
      const target = event.target;
      const serverEl = target.closest('[id^="server_"]');
      if (serverEl && event.button === 2) {
        event.preventDefault();
        const serverId = serverEl.id.replace("server_", "");
        let index = 0;
        for (const server of global.servers) {
          if (server.id === serverId) {
            break;
          }
          ;
          index++;
        }
        if (index === global.servers.length) {
          index = -1;
        }
        ;
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
          document.querySelectorAll(".server").forEach((el) => el.classList.remove("selected"));
          const newSelected = document.getElementById("server_" + global.room);
          if (newSelected) {
            newSelected.classList.add("selected");
          }
        }
        return;
      }
    });
  }
  function bind(global) {
    let new_funcs = {};
    new_funcs.onTick = function() {
      onTick(global);
    };
    new_funcs.onPing = function() {
      onPing(global);
    };
    return new_funcs;
  }

  // src/editor.ts
  var Editor = class {
    element;
    theme;
    constructor(selector, theme = "light") {
      if (typeof selector == "string") {
        this.element = document.querySelector(selector);
      } else {
        this.element = selector;
      }
      this.theme = theme;
      let modifier_bar = document.createElement("div");
      modifier_bar.style.width = "100%";
      modifier_bar.style.height = "10%";
      modifier_bar.style.backgroundColor = theme == "light" ? "#f0f0f0" : "#2e2e2e";
      modifier_bar.style.display = "flex";
      modifier_bar.style.alignItems = "center";
      modifier_bar.style.padding = "0 10px";
      modifier_bar.style.boxSizing = "border-box";
      this.element.appendChild(modifier_bar);
      let bold_button = document.createElement("button");
      bold_button.innerHTML = "<b>B</b>";
      bold_button.style.marginRight = "10px";
      bold_button.onclick = () => {
        document.execCommand("bold");
      };
      modifier_bar.appendChild(bold_button);
      let italic_button = document.createElement("button");
      italic_button.innerHTML = "<i>I</i>";
      italic_button.style.marginRight = "10px";
      italic_button.onclick = () => {
        document.execCommand("italic");
      };
      modifier_bar.appendChild(italic_button);
      let underline_button = document.createElement("button");
      underline_button.innerHTML = "<u>U</u>";
      underline_button.style.marginRight = "10px";
      underline_button.onclick = () => {
        document.execCommand("underline");
      };
      modifier_bar.appendChild(underline_button);
      let strike_button = document.createElement("button");
      strike_button.innerHTML = "<s>S</s>";
      strike_button.style.marginRight = "10px";
      strike_button.onclick = () => {
        document.execCommand("strikeThrough");
      };
      modifier_bar.appendChild(strike_button);
      let file_picker = document.createElement("input");
      file_picker.type = "file";
      file_picker.accept = "image/*";
      file_picker.style.display = "none";
      file_picker.onchange = () => {
        let file = file_picker.files[0];
        let reader = new FileReader();
        reader.onload = (e) => {
          let img = document.createElement("img");
          img.src = e.target.result;
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          this.element.querySelector("#textinput").appendChild(img);
        };
        reader.readAsDataURL(file);
      };
      modifier_bar.appendChild(file_picker);
      let photo_button = document.createElement("button");
      photo_button.innerHTML = "\u{1F4F7}";
      photo_button.style.marginRight = "10px";
      photo_button.onclick = () => file_picker.click();
      modifier_bar.appendChild(photo_button);
      let text_input = document.createElement("div");
      text_input.contentEditable = "true";
      text_input.id = "textinput";
      text_input.style.width = "100%";
      text_input.style.height = "90%";
      text_input.style.outline = "none";
      text_input.style.overflowY = "auto";
      text_input.style.padding = "10px";
      text_input.style.boxSizing = "border-box";
      text_input.style.backgroundColor = theme == "light" ? "white" : "#1e1e1e";
      text_input.style.color = theme == "light" ? "black" : "white";
      text_input.style.fontFamily = "Arial, sans-serif";
      text_input.style.fontSize = "14px";
      this.element.appendChild(text_input);
    }
    getHTML() {
      return this.element.querySelector("#textinput").innerHTML;
    }
    setHTML(html) {
      this.element.querySelector("#textinput").innerHTML = html;
    }
    destroy() {
      this.element.innerHTML = "";
    }
  };

  // src/main.ts
  window.zap_global = {
    messages: {},
    room: "1",
    servers: load("servers", [{ id: "1", nickname: "General", img: "" }]),
    // {id, nickname, img}  
    account: load("account", {}),
    // Default 
    reTick: true,
    lastRenderedIndex: 0,
    dark: !load("dark", window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches),
    // Invert toggle for later inversion
    online: {},
    editor: void 0,
    db: void 0
  };
  var normalizeOps = function normalizeOps2(ops) {
    const final = {};
    for (let [name, opts] of ops) {
      const op = name[0];
      const store = name.slice(1);
      final[store] = [op, opts];
    }
    return Object.entries(final).map(([store, [op, opts]]) => [op + store, opts]);
  };
  var request = window.indexedDB.open("ZapMessengerRW", 1);
  request.onsuccess = function(e) {
    window.zap_global.db = request.result;
  };
  request.onupgradeneeded = (event) => {
    const db = request.result;
    let needed = [];
    switch (event.oldVersion) {
      case 0:
        needed.push(["+ messages", { keyPath: "id", autoIncrement: true }]);
      case 1:
        needed.push(["-+ messages", { keyPath: "id", autoIncrement: false }]);
    }
    needed = normalizeOps(needed);
    needed.forEach(([fullop, options]) => {
      const [op, name] = fullop.split(" ", 2);
      if (op === "+") {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, options);
        } else {
          console.warn(`Cannot add ${name} because it already exists`);
        }
      } else if (op === "-") {
        if (db.objectStoreNames.contains(name)) {
          db.deleteObjectStore(name);
        } else {
          console.warn(`Cannot remove ${name} because it doesn't exist`);
        }
      } else if (op === "-+") {
        if (db.objectStoreNames.contains(name)) {
          db.deleteObjectStore(name);
        }
        db.createObjectStore(name, options);
      }
    });
  };
  if (!window.zap_global.account.name) {
    promptForAccount();
  }
  var { onPing: onPing2, onTick: onTick2 } = bind(window.zap_global);
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
  function promptForAccount() {
    let name = null;
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
  msg_send.onclick = function() {
    if (window.zap_global.editor) {
      let content = window.zap_global.editor.getHTML();
      window.zap_global.editor.setHTML("");
      let targets = window.zap_global.online[window.zap_global.room].map((ping) => {
        return ping.account.id;
      });
      console.log("Sending to targets:", targets);
      senders.message(window.zap_global, content, targets);
    }
  };
  server_adder.onclick = function() {
    let server_name, server_id, server_img;
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
  settings_menu.classList.add("closed");
  settings_button.onclick = function() {
    if (settings_menu.classList.contains("open")) {
      settings_menu.classList.remove("open");
      settings_menu.classList.add("closed");
    } else {
      settings_menu.classList.remove("closed");
      settings_menu.classList.add("open");
    }
  };
  var dark_toggle = document.createElement("div");
  dark_toggle.classList.add("button");
  dark_toggle.onclick = function() {
    window.zap_global.dark = !window.zap_global.dark;
    save("dark", window.zap_global.dark);
    if (window.zap_global.dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    let md = "";
    if (window.zap_global.editor) {
      md = window.zap_global.editor.getHTML();
      window.zap_global.editor.destroy();
    }
    window.zap_global.editor = new Editor(
      "div#msg_input",
      window.zap_global.dark ? "dark" : "light"
    );
    window.zap_global.editor.setHTML(md);
  };
  var dark_img = document.createElement("img");
  dark_img.src = "https://cdn-icons-png.flaticon.com/512/12377/12377255.png ";
  dark_img.style.height = "20px";
  dark_img.style.width = "20px";
  dark_toggle.appendChild(dark_img);
  settings_menu.appendChild(dark_toggle);
  function onLoad() {
    dark_toggle.click();
    setInterval(onTick2, 250);
    let temp = document.createElement("div");
    change_room_binder(window.zap_global, "1", temp)();
    temp.remove();
  }
  document.title = "Zap Messenger Rewritten";
  var id = setInterval((function() {
    if (document.readyState == "complete") {
      clearInterval(id);
      onLoad();
    }
  }), 100);
  setInterval(onPing2, 500);
  window.get = recievers.bind(window.zap_global).all;
})();
//# sourceMappingURL=main.big.js.map
