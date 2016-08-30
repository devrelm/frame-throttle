/// <reference path="node/node.d.ts" />

interface Window {
    Event: typeof Event;
}

declare namespace NodeJS {
    interface Global {
        window: Window;
    }
}
