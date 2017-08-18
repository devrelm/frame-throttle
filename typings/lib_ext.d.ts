interface Window {
    Event: typeof Event;
}

declare namespace NodeJS {
    interface Global {
        window: Window;
    }
}
