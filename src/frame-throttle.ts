export type CallbackFunction = (...args: any[]) => void;

export const throttle = (callback: CallbackFunction): CallbackFunction => {
    let waiting = false;
    function resetWaiting() {
        waiting = false;
    }

    let callbackThis: any;
    let args: IArguments;
    return function (): void {
        callbackThis = this;
        args = arguments;

        if (waiting) {
            return;
        }
        waiting = true;

        if ('requestAnimationFrame' in window) {
            window.requestAnimationFrame(() => {
                callback.apply(callbackThis, args);
                resetWaiting();
            });
        } else {
            callback.apply(callbackThis, args);
            window.setTimeout(resetWaiting, 1000 / 60); // 60 fps
        }
    };
};
