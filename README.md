# frame-throttle

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A lightweight wrapper using [requestAnimationFrame] to throttle event callbacks.

## Installation

`npm install frame-throttle`

## Purpose

When listening to `scroll` and `resize` events (among others), the browser
tends to fire off more events per second than are actually useful.
For instance, if your event listener sets some element positions, then it is
possible for those positions to be updated multiple times in a single rendered
frame. In this case, all of the layout calculations triggered by setting the
elements' positions will be wasted except for the one time that it runs
immediately prior to the browser rendering the updated layout to the screen.

To avoid wasting cycles, we can use [requestAnimationFrame] to only run the
event listener once just before the page is rendered to the screen.
For browsers that do not support `requestAnimationFrame`, _frame-throttle_
will fall back to `setTimeout` (see [gotchas](#gotchas) below.)

## Use

To use _frame-throttle_, simply create your listener, and pass it to the
`throttle` method. You can then pass the throttled listener to
`addEventListener` and `removeEventListener` like any other listener:

```
var throttle = require('frame-throttle').throttle;

var listener = function(e) {
    // handle a 'resize' event
}

var throttledListener = throttle(listener);

window.addEventListener('resize', throttledListener);
window.removeEventListener('resize', throttledListener);
```

You can use `throttle` to throttle any callback method. The callback will be
called once during the next animation frame using `requestAnimationFrame`
if it exists. If `requestAnimationFrame` does not exist, then the callback will
be called immediately, and `setTimeout` will be used to ignore further calls
for 1/60th of a second.

## Gotchas

There is a slight difference in how `frame-throttle` works that depends on
whether or not `requestAnimationFrame` exists.

If `requestAnimationFrame` exists, then the callback will be called during the
animation-frame callback section of the browser's next [browsing context event loop].
In this case the callback is called at the optimal time because all layout and
dimensions will be the most up-to-date available before the page is rendered
to the screen.

If `requestAnimationFrame` does not exist, then the callback will be called
immediately, and will not be called again for at least 1/60th of a second. This
allows you to make make adjustments before the next frame renders, but there is
a small possibility that the information you calculate your changes off of will
be out of date by the time the next frame renders.


[travis-image]: https://travis-ci.org/pelotoncycle/frame-throttle.svg?branch=master
[travis-url]: https://travis-ci.org/pelotoncycle/frame-throttle

[coveralls-image]: https://coveralls.io/repos/github/pelotoncycle/frame-throttle/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/pelotoncycle/frame-throttle?branch=master

[browsing context event loop]: https://html.spec.whatwg.org/multipage/webappapis.html#processing-model-8
[requestAnimationFrame]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
