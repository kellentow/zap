import { senders, recievers, load, sendNotification, change_room_binder } from './helpers'

interface TestDesc {
    [key: string]: TestDesc | Function
}

let depth = 0

let tests:TestDesc = {
    "helpers.ts":{
        recievers: {
            ping: function() {
                throw new Error("Not implemented")
            },
            join: function() {
                throw new Error("Not implemented")
            },
            crypto: function() {
                throw new Error("Not implemented")
            },
            history_request: function() {
                throw new Error("Not implemented")
            },
            recieve_history: function() {
                throw new Error("Not implemented")
            }
        },
        senders: {
            ping: function() {
                throw new Error("Not implemented")
            },
            join: function() {
                throw new Error("Not implemented")
            },
            crypto: function() {
                throw new Error("Not implemented")
            },
            crypto_request: function() {
                throw new Error("Not implemented")
            },
            crypto_response: function() {
                throw new Error("Not implemented")
            },
            request_history: function() {
                throw new Error("Not implemented")
            },
            send_history: function() {
                throw new Error("Not implemented")
            }
        },
        save: function() {
            throw new Error("Not implemented")
        },
        load: function() {
            throw new Error("Not implemented")
        },
        sendNotification: function() {
            throw new Error("Not implemented")
        },
        change_room_binder: function() {
            throw new Error("Not implemented")
        },
        formatDate: function() {
            throw new Error("Not implemented")
        }
    }
}

function test_desc(desc: TestDesc) {
    depth++
    for (let key in desc) {
        if (typeof desc[key] == "function") {
            let status = "Error"
            let output = null

            try {
                output = desc[key]()
                if (output === true || output === undefined || output === 0) {
                    status = "Pass"
                } else {
                    status = "Fail"
                }
            } catch (e) {
                status = "Error"
                output = e
            }

            console.log("| ".repeat(depth) + status + " " + key, output)
        } else if (typeof desc[key] == "object") {
            console.log("| ".repeat(depth) + key)
            test_desc(desc[key])
        }
    }
    depth--
}

let sent_msg:[any,any,any,any] | [] = []

// @ts-ignore
window.test = function() {
    let og_globals = window.zap_global
    let og_send = window.send;

    window.send = function(...args:[any,any,any,any]) {
        sent_msg = args
    }
    window.zap_global = {
        messages: {},
        room: "",
        servers: [],
        account: {id: "", name: "", pfp: ""},
        reTick: false,
        lastRenderedIndex: 0,
        theme: "light",
        status: "online",
        online: {},
        blocked: [],
        editor: null,
        db: null as unknown as IDBDatabase,
        image_rendering: false
    }

    console.log("Running tests...")
    test_desc(tests)
    window.send = og_send;
    window.zap_global = og_globals
}