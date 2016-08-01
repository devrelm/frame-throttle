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

## Use

```
var throttle = require('frame-throttle');

var listener = function(e) {
    // handle a 'resize' event
}

var throttledListener = throttle(listener);

window.addEventListener('resize', throttledListener);
```


[travis-image]: https://travis-ci.org/pelotoncycle/frame-throttle.svg?branch=master
[travis-url]: https://travis-ci.org/pelotoncycle/frame-throttle

[coveralls-image]: https://coveralls.io/repos/github/pelotoncycle/frame-throttle/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/pelotoncycle/frame-throttle?branch=master

[requestAnimationFrame]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
