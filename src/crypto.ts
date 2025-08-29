class crypto_session {
    static version = 1;
    id: string;
    other_key: CryptoKey;
    self_keys: CryptoKeyPair;

    constructor(id:string, other_key:CryptoKey, self_keys:CryptoKeyPair) {
        this.id = id;
        this.other_key = other_key;
        this.self_keys = self_keys;
    }

    async encrypt(message: string): Promise<ArrayBuffer> {
        const encoded = new TextEncoder().encode(message);
        return await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, this.other_key, encoded);
    }

    async decrypt(ciphertext: ArrayBuffer): Promise<string> {
        const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, this.self_keys.privateKey, ciphertext);
        return new TextDecoder().decode(decrypted);
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
    return { publicKey, privateKey, keyPair};
}

class crypto_manager {
    static version = 1;
    self_keys: any;
    sessions: {[key:string]: crypto_session} = {};

    constructor(self_keys:string) {
        if (!self_keys) {
            this.self_keys = makeKeys().then((new_keys)=>{return new_keys;});
        } else {
            this.self_keys = self_keys;
        }
    }

    get_session(id:string): crypto_session {
        if (id in this.sessions) {
            return this.sessions[id];
        }
        return null;
    }

    add_session(id:string, other_key:string) {
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
}

export { crypto_manager, crypto_session, makeKeys };