if (typeof window.send !== 'function') {
    let ws = new WebSocket("wss://ws.sleepyis.dev");
    let queue:[any,any,any,any][] = []
    function queueSend(a:any,b:any,c:any,d:any) {
        queue.push([a,b,c,d])
    }
    window.send = queueSend
    function setupWebSocket() {
        if (ws.readyState === WebSocket.OPEN) {
            return;
        } else if (ws.readyState === WebSocket.CONNECTING) {
            setTimeout(setupWebSocket, 100);
        } else {
            ws = new WebSocket("wss://ws.sleepyis.dev");
            ws.onopen = () => {
                window.send = function (a: any, b: any, c: any, d: any) {
                    let msg = JSON.stringify([a, b, c, d]);
                    ws.send(msg);
                }
                // flush queue
                while (queue.length > 0) {
                    let [a, b, c, d] = queue.shift()!;
                    window.send(a, b, c, d);
                }
            }
            ws.onmessage = (event) => {
                let data = event.data;
                let [a, b, c, d] = JSON.parse(data);
                window.get(a, b, c, d);
            }
            ws.onerror = (event) => {
                console.error("WebSocket error:", event);
                ws.close();
            }
            ws.onclose = (event) => {
                if (!event.wasClean) {
                    console.error("WebSocket closed unexpectedly:", event);
                    setTimeout(setupWebSocket, 1000); // try to reconnect after 1 second
                }
                // make sure send uses queueing while disconnected
                window.send = queueSend;
            }
        }
    }
    setupWebSocket();
    console.warn("Environment did not supply window.send, using default websocket to ws.sleepyis.dev");
    console.warn("This may not be wanted, if not please supply own window.send and window.get caller")
}

type ProtocolHandler = (url: string, init?: RequestInit) => Promise<Response>;

const protocolHandlers = new Map<string, ProtocolHandler>();

const old_fetch = globalThis.fetch

export function registerProtocol(scheme: string, handler: ProtocolHandler) {
    protocolHandlers.set(scheme, handler);
}

registerProtocol("http", old_fetch)
registerProtocol("https", old_fetch)

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!input) input = ""
    const url = typeof input === 'string' ? input : input.toString();
    const match = url.match(/^([a-zA-Z0-9+.-]+):\/\//);
    let scheme = match?.[1].toLowerCase();

    if (!scheme) { scheme = "http" }

    if (scheme && protocolHandlers.has(scheme)) {
        const handler = protocolHandlers.get(scheme)!;
        return handler(url, init);
    } else {
        return new Response("Protocol not found", { status: 404 })
    }
};

class FixedMap<K, V> {
    private map = new Map<K, V>();
    private capacity: number;

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    set(key: K, value: V) {
        if (this.map.has(key)) {
            this.map.delete(key); // remove old to update order
        } else if (this.map.size >= this.capacity) {
            // remove oldest entry
            const oldestKey = this.map.keys().next().value as K;
            this.map.delete(oldestKey);
        }
        this.map.set(key, value);
    }

    get(key: K): V | undefined {
        return this.map.get(key);
    }

    touch(key: K) {
        const value = this.map.get(key);
        if (value !== undefined) {
            this.map.delete(key);
            this.map.set(key, value);
        }
    }

    has(key: K): boolean {
        return this.map.has(key);
    }

    delete(key: K) {
        this.map.delete(key);
    }

    values(): V[] {
        return Array.from(this.map.values());
    }
}

import * as lz4js from 'lz4js';
import * as untyped_assets from './assets.json' // {string: [base64:string, length:number, mime:string]}

(() => { // asset protocol
    const assets: Record<string, [string, number, string]> = untyped_assets as any;
    const decoded: FixedMap<string, [Uint8Array, string]> = new FixedMap(2000)

    function base64ToUint8Array(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    registerProtocol("asset", async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url = typeof input === 'string' ? input : input.toString();
        const assetKey = url.substring(8); // remove "asset://"
        if (decoded.has(assetKey)) {
            decoded.touch(assetKey);
            let [data, mime] = decoded.get(assetKey) as any // @ts-ignore
            return new Response(data as Uint8Array, {
                status: 200,
                headers: { 'Content-Type': mime, 'X-Cache': "HIT" },
            });
        }
        const [b64, length, mime] = assets[assetKey];
        if (!b64) {
            return new Response("Asset not found", { status: 404 });
        }
        
        const compressed = base64ToUint8Array(b64);
        const decompressed: Uint8Array = lz4js.decompress(compressed);

        // add to cache
        decoded.set(assetKey, [decompressed, mime])

        // Wrap in a Response (ts ignore bc Uint8Array !== Uint8Array???????)
        // @ts-ignore
        return new Response(decompressed as Uint8Array, {
            status: 200,
            headers: { 'Content-Type': mime },
        });
    });
    protocolHandlers.set("assets", protocolHandlers.get("asset")) // alias
})()