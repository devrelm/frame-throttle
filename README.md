# frame-throttle

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A lightweight wrapper using [requestAnimationFrame] to throttle event callbacks.

## Installation

`npm install frame-throttle`

## Purpose

_frame-throttle_ improves performance by only calling callbacks once per frame.

When listening to `scroll` and `resize` events (among others), the browser
tends to fire off more events per second than are actually useful.
For instance, if your event listener sets some element positions, then it is
possible for those positions to be updated multiple times in a single rendered
frame. In this case, all of the layout calculations triggered by setting the
elements' positions will be wasted except for the one time that it runs
immediately prior to the browser rendering the updated layout to the screen.

To avoid wasting cycles, we can use [requestAnimationFrame] to only run your
event listener once just before the page is rendered to the screen.
For browsers that do not support `requestAnimationFrame`, _frame-throttle_
will fall back to `setTimeout` (see [gotchas](#gotchas) below.)

## Use

To use _frame-throttle_, simply create your callback, and pass it to the
`throttle` method — the return value is a throttled callback which you can
pass to any method that would take your original callback,
such as `addEventListener` and `removeEventListener`:

```js
var throttle = require('frame-throttle').throttle;

var callback = function(e) {
    // handle a 'resize' event
}

var throttledCallback = throttle(callback);

window.addEventListener('resize', throttledCallback);
window.removeEventListener('resize', throttledCallback);
```

You can use `throttle` to throttle any function, not just event listeners.
The function will be called once during the next animation frame using
`requestAnimationFrame` if it exists. If `requestAnimationFrame` does not exist,
then the callback will be called immediately, and `setTimeout` will be used to
ignore further calls for 1/60th of a second.

## Examples

### `.cancel()`

Throttled functions can be canceled, which is useful for cleaning up after
yourself when you are no longer listening to an event.

```js
var throttledListener = throttle(listener);
window.addEventListener('resize', throttledListener);
submitButton.addEventListener('click', () => {
    window.removeEventListener('resize', throttledListener);
    // prevent any queued calls from executing on the next animation frame:
    throttledListener.cancel();
})
```

### Binding

Throttled functions can be bound, and pass their context and args to your listener:

```js
// count the number of times that listener is called for each event type
var counterObj = {
    resize: 0,
    scroll: 0,
};
var eventCounter = function (event) {
    this[event] += 1;
};
var throttledCounter = throttle(eventCounter);
window.addEventListener('resize', throttledCounter.bind(counterObj, 'resize'));
window.addEventListener('scroll', throttledCounter.bind(counterObj, 'scroll'));
```

Each bound and unbound instance is throttled separately. This means that in the
above example, if the resize and scroll events were fired within the same
animation frame, both `counterObj.resize` and `counterObj.scroll` would be
incremented.

## Gotchas

### Fallback to `setTimeout`

There are some slight differences in how `frame-throttle` behaves, depending on
whether or not `window.requestAnimationFrame` exists.

If `requestAnimationFrame` exists, then the callback will be called during the
animation-frame callback section of the browser's next [browsing context event loop].
In this case the callback is called at the optimal time because all layout and
dimensions will be the most up-to-date available before the page is rendered
to the screen. The arguments passed to your callback will be the most recent
arguments passed to your callback before the animation frame.

If `requestAnimationFrame` does not exist, then the callback will be called
immediately, and will not be called again for at least 1/60th of a second. This
allows you to make make adjustments before the next frame renders, but there is
a small possibility that the information you calculate your changes off of will
be out of date by the time the next frame renders. The arguments to your callback
will be the arguments of the first call to the throttled callback, and will
be reset 1/60th of a second after the first call to the throttled callback.

### `cancel()`

`cancel()` cancels only the next scheduled run of the listener. If your
throttled listener is called again after calling `cancel()`, your listener
will be scheduled to run again during the next animation frame (or immediately
if `window.requestAnimationFrame` does not exist.


[travis-image]: https://travis-ci.org/pelotoncycle/frame-throttle.svg?branch=master
[travis-url]: https://travis-ci.org/pelotoncycle/frame-throttle

[coveralls-image]: https://coveralls.io/repos/github/pelotoncycle/frame-throttle/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/pelotoncycle/frame-throttle?branch=master

[browsing context event loop]: https://html.spec.whatwg.org/multipage/webappapis.html#processing-model-8
[requestAnimationFrame]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
