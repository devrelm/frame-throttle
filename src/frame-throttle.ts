export const throttle = <T extends Function>(callback: T): T => {
    const wrapperFactory = (wrapperContext: any) =>
        function (cbThis: any, cb: T, ...args: any[]) {
            const resetWaiting = () => {
                this.waiting = false;
            };

            this.callbackThis = cbThis;
            this.args = args;

            if (this.waiting) {
                return;
            }
            this.waiting = true;

            if ('requestAnimationFrame' in window) {
                window.requestAnimationFrame(() => {
                    cb.apply(this.callbackThis, this.args);
                    resetWaiting();
                });
            } else {
                cb.apply(this.callbackThis, this.args);
                window.setTimeout(resetWaiting, 1000 / 60); // 60 fps
            }
        }.bind(wrapperContext) as T;

    const wrapper = wrapperFactory({});
    const throttledCallback = function (...args: any[]) {
        wrapper(this, callback, ...args);
    };

    // Override `bind()` to bind the callback, which requires creating a new
    // wrapper with separate 'waiting' context
    throttledCallback.bind = (thisArg: any, ...argArray: any[]) => {
        const newWrapper = wrapperFactory({});
        return (...args: any[]) => newWrapper(thisArg, callback, ...argArray, ...args);
    };

    return throttledCallback as any as T;
};
