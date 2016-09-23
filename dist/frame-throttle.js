exports.throttle = function (callback) {
    var running = false;
    function resetRunning() {
        running = false;
    }
    var callbackThis;
    var args;
    return function () {
        callbackThis = this;
        args = arguments;
        if (running) {
            return;
        }
        running = true;
        if ('requestAnimationFrame' in window) {
            window.requestAnimationFrame(function () {
                callback.apply(callbackThis, args);
                resetRunning();
            });
        }
        else {
            callback.apply(callbackThis, args);
            window.setTimeout(resetRunning, 1000 / 60); // 60 fps
        }
    };
};
