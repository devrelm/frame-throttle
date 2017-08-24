export type Cancellable<T extends Function>
    = T
    & {
        cancel(): void;
    }

const wrapperFactory = function (wrapperContext: any) {
    const resetCancelToken = () => {
        wrapperContext.cancelToken = false;
    };

    const wrapper = <T extends Function>(cbThis: any, cb: T, ...args: any[]) => {
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

const throttleFactory = function <T extends Function>(callback: T, thisArg?: any, ...argArray: any[]) {
    const wrapper = wrapperFactory({});
    const argCount = arguments.length;
    const throttledCallback = function (...args: any[]) {
        wrapper(argCount > 1 ? thisArg : this, callback, ...argArray, ...args);
    } as any as Cancellable<T>;
    throttledCallback.cancel = () => wrapper.cancel();
    return throttledCallback;
};

export const throttle = <T extends Function>(callback: T): Cancellable<T> => {
    const throttledCallback = throttleFactory(callback);

    // Override `bind()` to create a new throttled callback, otherwise both
    // the unbound and bound callbacks will have the same scope.
    throttledCallback.bind = throttleFactory.bind(null, callback);

    return throttledCallback;
};
