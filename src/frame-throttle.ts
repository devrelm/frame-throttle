export type CallbackFunction = (...args: any[]) => void;

export const throttle = (callback: CallbackFunction): CallbackFunction => {
    let running = false;
    function resetRunning() {
        running = false;
    }

    let callbackThis: any;
    let args: IArguments;
    return function (): void {
        callbackThis = this;
        args = arguments;

        if (running) {
            return;
        }
        running = true;

        if ('requestAnimationFrame' in window) {
            window.requestAnimationFrame(() => {
                callback.apply(callbackThis, args);
                resetRunning();
            });
        } else {
            callback.apply(callbackThis, args);
            window.setTimeout(resetRunning, 1000 / 60); // 60 fps
        }
    };
};
