interface Server {
    id: string;
    nickname: string;
    img: string;
}

interface Account {
    id: string;
    name: string;
    pfp: string;
}

interface Message {
    id:string,
    timestamp:number,
    content:string,   
    account:Account
}

interface zapGlobals {
    messages: {[key:string]: Message[]};
    room: string;
    servers: Server[];
    account: Account;
    reTick: boolean;
    firstRenderedIndex: number;
    lastRenderedIndex: number;
    theme: string;
    status: string;
    blocked: string[];
    online: { [key: string]: { account: Account, status: string, last: number}[] };
    editor: any;
    db: IDBDatabase;
    image_rendering: boolean;
}

export {Server,Account,zapGlobals,Message}