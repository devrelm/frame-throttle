function throttle(callback) {
    var running = false;

    function frameHandler() {
        callback();
        running = false;
    }

    return function (e) {
        if (running) {
            return;
        }
        running = true;

        if (requestAnimationFrame) {
            requestAnimationFrame(frameHandler);
        } else {
            setTimeout(frameHandler, 1000 / 60); // 60 fps
        }
    };
}

module.exports = throttle;
