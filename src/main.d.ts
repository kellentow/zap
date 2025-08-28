interface Server {
    id: string;
    nickname: string;
    img: string;
}

interface Account {
    id: string;
    name: string;
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
    lastRenderedIndex: number;
    dark: boolean;
    online: { [key: string]: { account: Account, list: number[], last: number, avg: number }[] };
    editor: any;
    db: IDBDatabase;
}

export {Server,Account,zapGlobals,Message}