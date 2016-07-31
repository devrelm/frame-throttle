function throttle(callback) {
    var running = false;

    return function () {
        if (running) {
            return;
        }
        running = true;

        var args = arguments;
        function frameHandler() {
            callback.apply(undefined, args);
            running = false;
        }

        if (requestAnimationFrame) {
            requestAnimationFrame(frameHandler);
        } else {
            setTimeout(frameHandler, 1000 / 60); // 60 fps
        }
    };
}

module.exports = throttle;
