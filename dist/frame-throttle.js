exports.throttle = function (callback) {
    var running = false;
    function resetRunning() {
        running = false;
    }
    return function () {
        if (running) {
            return;
        }
        running = true;
        var listenerThis = this;
        var args = arguments;
        if ('requestAnimationFrame' in window) {
            window.requestAnimationFrame(function () {
                callback.apply(listenerThis, args);
                resetRunning();
            });
        }
        else {
            callback.apply(listenerThis, args);
            window.setTimeout(resetRunning, 1000 / 60); // 60 fps
        }
    };
};
