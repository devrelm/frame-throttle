export function throttle(callback) {
    let running = false;
    function resetRunning() {
        running = false;
    }

    return function () {
        if (running) {
            return;
        }
        running = true;

        const listenerThis = this;
        const args = arguments;
        if ('requestAnimationFrame' in window) {
            window.requestAnimationFrame(() => {
                callback.apply(listenerThis, args);
                resetRunning();
            });
        } else {
            callback.apply(listenerThis, args);
            window.setTimeout(resetRunning, 1000 / 60); // 60 fps
        }
    };
}
