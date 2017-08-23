export type Cancellable<T extends Function>
    = T
    & {
        cancel(): void;
    }

export const throttle = <T extends Function>(callback: T): Cancellable<T> => {
    const wrapperFactory = function (wrapperContext: any) {
        const resetCancelToken = () => {
            wrapperContext.cancelToken = false;
        };

        const wrapper = (cbThis: any, cb: T, ...args: any[]) => {
            wrapperContext.callbackThis = cbThis;
            wrapperContext.args = args;

            if (wrapperContext.cancelToken) {
                return;
            }

            if ('requestAnimationFrame' in window) {
                wrapperContext.cancelToken = window.requestAnimationFrame(() => {
                    cb.apply(wrapperContext.callbackThis, wrapperContext.args);
                    resetCancelToken();
                });
            } else {
                cb.apply(wrapperContext.callbackThis, wrapperContext.args);
                wrapperContext.cancelToken = window.setTimeout(resetCancelToken, 1000 / 60); // 60 fps
            }
        };

        (wrapper as Cancellable<typeof wrapper>).cancel = () => {
            if ('requestAnimationFrame' in window) {
                window.cancelAnimationFrame(wrapperContext.cancelToken);
            }
            window.clearTimeout(wrapperContext.cancelToken);
            resetCancelToken();
        };

        return wrapper as Cancellable<typeof wrapper>;
    };

    const wrapper = wrapperFactory({});
    const throttledCallback = function (...args: any[]) {
        wrapper(this, callback, ...args);
    } as any as Cancellable<T>;
    throttledCallback.cancel = () => wrapper.cancel();

    // Override `bind()` to bind the callback, which requires creating a new
    // wrapper with separate 'waiting' context
    throttledCallback.bind = (thisArg: any, ...argArray: any[]) => {
        const newWrapper = wrapperFactory({});
        const newThrottledCallback = function (...args: any[]) {
            return newWrapper(thisArg, callback, ...argArray, ...args);
        } as any as Cancellable<T>;
        newThrottledCallback.cancel = () => newWrapper.cancel();
        return newThrottledCallback;
    };

    return throttledCallback;
};
