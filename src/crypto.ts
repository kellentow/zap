// Encrypt large data using AES-GCM + RSA-OAEP
export async function encryptLargePayload(
    rsaPublicKey: CryptoKey,
    plaintext: Uint8Array | ArrayBuffer | string
) {
    if (typeof plaintext === "string") {
        plaintext = new TextEncoder().encode(plaintext);
    } else if (plaintext instanceof ArrayBuffer) {
        plaintext = new Uint8Array(plaintext);
    }

    // 1. Generate AES key
    const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true, // extractable, so we can wrap it
        ["encrypt", "decrypt"]
    );

    // 2. Encrypt the plaintext
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        (plaintext as any as ArrayBuffer)
    );

    // 3. Wrap (RSA-encrypt) the AES key
    const wrappedKey = await crypto.subtle.wrapKey(
        "raw",
        aesKey,
        rsaPublicKey,
        { name: "RSA-OAEP" }
    );

    return {
        wrappedKey: new Uint8Array(wrappedKey),
        iv,
        ciphertext: new Uint8Array(ciphertext),
    };
}
// Decrypt data encrypted by encryptLargePayload()
export async function decryptLargePayload(
    rsaPrivateKey: CryptoKey,
    wrappedKey: Uint8Array | ArrayBuffer,
    iv: Uint8Array | ArrayBuffer,
    ciphertext: Uint8Array | ArrayBuffer
) {
    wrappedKey = wrappedKey instanceof Uint8Array ? wrappedKey : new Uint8Array(wrappedKey);
    iv = iv instanceof Uint8Array ? iv : new Uint8Array(iv);
    ciphertext = ciphertext instanceof Uint8Array ? ciphertext : new Uint8Array(ciphertext);

    // 1. Unwrap (RSA-decrypt) the AES key
    const aesKey = await crypto.subtle.unwrapKey(
        "raw",
        (wrappedKey as any as ArrayBuffer),
        rsaPrivateKey,
        { name: "RSA-OAEP" },
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    // 2. Decrypt the ciphertext
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: (iv as any as ArrayBuffer) },
        aesKey,
        (ciphertext as any as ArrayBuffer)
    );

    return new Uint8Array(decrypted);
}

class crypto_session {
    static version = 1;
    id: string;
    other_key: CryptoKey;
    self_keys: CryptoKeyPair;

    constructor(id: string, other_key: CryptoKey, self_keys: CryptoKeyPair) {
        this.id = id;
        this.other_key = other_key;
        this.self_keys = self_keys;
    }

    async encrypt(message: string): Promise<ArrayBuffer> {
        const payload = await encryptLargePayload(this.other_key, message);
        const json = JSON.stringify(payload);
        return new TextEncoder().encode(json).buffer;
    }

    async decrypt(ciphertext: ArrayBuffer): Promise<string> {
        let json, payload;

        json = new TextDecoder().decode(ciphertext);

        payload = JSON.parse(json);

        return await decryptLargePayload(this.self_keys.privateKey, payload.wrappedKey, payload.iv, payload.ciphertext) as any as string;
    }

    async serialize() {
        return {
            version: crypto_session.version,
            id: this.id,
            other_key: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", this.other_key)))),
            self_keys: {
                publicKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", this.self_keys.publicKey)))),
                privateKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", this.self_keys.privateKey))))
            }
        };
    }

    static async deserialize(data: any) {
        if (data.version !== crypto_session.version) {
            throw new Error("Incompatible crypto_session version");
        }
        let other_key_buffer = Uint8Array.from(atob(data.other_key), c => c.charCodeAt(0));
        let other_key = await window.crypto.subtle.importKey("spki", other_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
        let self_public_key_buffer = Uint8Array.from(atob(data.self_keys.publicKey), c => c.charCodeAt(0));
        let self_private_key_buffer = Uint8Array.from(atob(data.self_keys.privateKey), c => c.charCodeAt(0));
        let self_public_key = await window.crypto.subtle.importKey("spki", self_public_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
        let self_private_key = await window.crypto.subtle.importKey("pkcs8", self_private_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
        let self_keys = { publicKey: self_public_key, privateKey: self_private_key };
        return new crypto_session(data.id, other_key, self_keys);
    }
}

async function makeKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
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

class crypto_manager {
    static version = 1;
    self_keys: CryptoKeyPair;
    sessions: { [key: string]: crypto_session } = {};

    constructor(self_keys: CryptoKeyPair) {
        this.self_keys = self_keys;
    }

    static async init() {
        const { keyPair } = await makeKeys();
        return new crypto_manager(keyPair);
    }

    get_session(id: string): crypto_session {
        if (id in this.sessions) {
            return this.sessions[id];
        }
        return null;
    }

    add_session(id: string, other_key: string) {
        if (id in this.sessions) {
            return this.sessions[id];
        }
        let other_key_buffer = Uint8Array.from(atob(other_key), c => c.charCodeAt(0));
        return window.crypto.subtle.importKey("spki", other_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]).then((imported_key) => {
            let new_session = new crypto_session(id, imported_key, this.self_keys);
            this.sessions[id] = new_session;
            return new_session;
        });
    }

    async decrypt(ciphertext: ArrayBuffer): Promise<string> { //only here because can decrypt sessionless, encryption requires session
        const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, this.self_keys.privateKey, ciphertext);
        return new TextDecoder().decode(decrypted);
    }

    async serialize() {
        let sessions_serialized: { [key: string]: any } = {};
        for (let [id, session] of Object.entries(this.sessions)) {
            sessions_serialized[id] = session.serialize();
        }
        return {
            version: crypto_manager.version,
            self_keys: {
                publicKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", this.self_keys.publicKey)))),
                privateKey: btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", this.self_keys.privateKey))))
            },
            sessions: sessions_serialized
        };
    }

    static async deserialize(data: any) {
        if (data.version !== crypto_manager.version) {
            throw new Error("Incompatible crypto_manager version");
        }
        let self_public_key_buffer = Uint8Array.from(atob(data.self_keys.publicKey), c => c.charCodeAt(0));
        let self_private_key_buffer = Uint8Array.from(atob(data.self_keys.privateKey), c => c.charCodeAt(0));
        let self_public_key = await window.crypto.subtle.importKey("spki", self_public_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
        let self_private_key = await window.crypto.subtle.importKey("pkcs8", self_private_key_buffer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
        let self_keys = { publicKey: self_public_key, privateKey: self_private_key };
        let manager = new crypto_manager(self_keys);
        for (let [id, session_data] of Object.entries(data.sessions)) {
            manager.sessions[id] = await crypto_session.deserialize(session_data);
        }
        return manager;
    }
}

export { crypto_manager, crypto_session, makeKeys };