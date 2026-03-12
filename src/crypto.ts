import nacl, { BoxKeyPair } from 'tweetnacl'
import util from 'tweetnacl-util'

class crypto_session {
    static version = 2;

    id: string;
    otherPublicKey: Uint8Array; // recipient's public key
    selfKeyPair: nacl.BoxKeyPair; // our key pair

    constructor(id: string, otherPublicKey: Uint8Array, selfKeyPair?: nacl.BoxKeyPair) {
        this.id = id;
        this.otherPublicKey = otherPublicKey;
        this.selfKeyPair = selfKeyPair || nacl.box.keyPair(); // generate if not provided
    }

    // --- encrypt message for recipient ---
    encrypt(message: string): Uint8Array {
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const plaintext = util.decodeUTF8(message);

        const ciphertext = nacl.box(plaintext, nonce, this.otherPublicKey, this.selfKeyPair.secretKey);

        // return {nonce + ciphertext} as one buffer
        const combined = new Uint8Array(nonce.length + ciphertext.length);
        combined.set(nonce, 0);
        combined.set(ciphertext, nonce.length);
        return combined;
    }

    // --- decrypt incoming message ---
    decrypt(data: Uint8Array): string {
        const nonce = data.slice(0, nacl.box.nonceLength);
        const ciphertext = data.slice(nacl.box.nonceLength);

        const plaintext = nacl.box.open(ciphertext, nonce, this.otherPublicKey, this.selfKeyPair.secretKey);
        if (!plaintext) throw new Error("Decryption failed or message was tampered with");

        return util.encodeUTF8(plaintext);
    }

    // --- serialize keys for storage or transfer ---
    serialize() {
        return {
            version: crypto_session.version,
            id: this.id,
            otherPublicKey: util.encodeBase64(this.otherPublicKey),
            selfKeyPair: {
                publicKey: util.encodeBase64(this.selfKeyPair.publicKey),
                secretKey: util.encodeBase64(this.selfKeyPair.secretKey)
            }
        };
    }

    // --- deserialize saved session ---
    static deserialize(data: any): crypto_session {
        if (data.version !== crypto_session.version) throw new Error("Incompatible session version");

        const otherPublicKey = util.decodeBase64(data.otherPublicKey);
        const selfKeyPair = {
            publicKey: util.decodeBase64(data.selfKeyPair.publicKey),
            secretKey: util.decodeBase64(data.selfKeyPair.secretKey)
        };
        return new crypto_session(data.id, otherPublicKey, selfKeyPair);
    }
}

async function makeKeys() {
    const keyPair = nacl.box.keyPair()
    return { publicKey: keyPair.publicKey, privateKey:keyPair.secretKey, keyPair };
}

class crypto_manager {
    static version = 1;
    selfKeys: nacl.BoxKeyPair;
    sessions: { [key: string]: crypto_session } = {};

    constructor(selfKeys: nacl.BoxKeyPair) {
        this.selfKeys = selfKeys;
    }

    // --- initialize a new manager with fresh keys ---
    static init(): crypto_manager {
        const keyPair = nacl.box.keyPair();
        return new crypto_manager(keyPair);
    }

    // --- get an existing session by id ---
    getSession(id: string): crypto_session | null {
        return this.sessions[id] || null;
    }

    // --- add a session (peer public key in base64) ---
    addSession(id: string, otherKeyBase64: string): crypto_session {
        if (id in this.sessions) return this.sessions[id];

        const otherKey = util.decodeBase64(otherKeyBase64);
        const newSession = new crypto_session(id, otherKey, this.selfKeys);
        this.sessions[id] = newSession;
        return newSession;
    }

    // --- decrypt "sessionless" message (if needed) ---
    decrypt(ciphertext: Uint8Array, senderPublicKey: Uint8Array): string {
        // just a helper if you have a raw message and sender key
        const tempSession = new crypto_session("temp", senderPublicKey, this.selfKeys);
        return tempSession.decrypt(ciphertext);
    }

    // --- serialize manager for storage ---
    async serialize() {
        const sessionsSerialized: { [key: string]: any } = {};
        for (const [id, session] of Object.entries(this.sessions)) {
            sessionsSerialized[id] = session.serialize();
        }

        return {
            version: crypto_manager.version,
            selfKeys: {
                publicKey: util.encodeBase64(this.selfKeys.publicKey),
                secretKey: util.encodeBase64(this.selfKeys.secretKey)
            },
            sessions: sessionsSerialized
        };
    }

    // --- deserialize manager ---
    static deserialize(data: any): crypto_manager {
        if (data.version !== crypto_manager.version) throw new Error("Incompatible manager version");

        const selfKeys: nacl.BoxKeyPair = {
            publicKey: util.decodeBase64(data.selfKeys.publicKey),
            secretKey: util.decodeBase64(data.selfKeys.secretKey)
        };

        const manager = new crypto_manager(selfKeys);

        for (const [id, sessionData] of Object.entries(data.sessions)) {
            manager.sessions[id] = crypto_session.deserialize(sessionData);
        }

        return manager;
    }
}

export { crypto_manager, crypto_session, makeKeys };