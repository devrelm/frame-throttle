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

        const args = arguments;
        function frameHandler() {
            callback.apply(undefined, args);
            resetRunning();
        }

        if ('requestAnimationFrame' in window) {
            window.requestAnimationFrame(frameHandler);
        } else {
            callback.apply(undefined, args);
            window.setTimeout(resetRunning, 1000 / 60); // 60 fps
        }
    };
}
