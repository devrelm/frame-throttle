# Change Log

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## [UNRELEASED]

### Chores

- Updated project to use [TSDX](https://github.com/palmerhq/tsdx) (#8)

## [3.0.0] - 2017-08-28

### Added

- Throttled listeners can now be canceled (useful for cleanup):
  ```js
  var throttledListener = throttle(listener);
  window.addEventListener('resize', throttledListener);
  submitButton.addEventListener('click', () => {
    window.removeEventListener('resize', throttledListener);
    // prevent any queued calls from executing on the next animation frame:
    throttledListener.cancel();
  });
  ```

### Changed

- Updated types to use generics; `throttle` will now return a function
  of the same type it was passed.
- frame-throttle now runs in strict mode

### Fixed

- Binding a throttled listener with `.bind()` resulted in both the bound and
  unbound listeners being throttled together.

  For instance, in the following scenario, `listener` was only being called once:

  ```js
  var throttledListener = throttle(listener);
  var boundThrottledListener1 = throttledListener.bind(someContext);
  var boundThrottledListener2 = throttledListener.bind(anotherContext);

  throttledListener();
  boundThrottledListener1();
  boundThrottledListener2();
  ```

## [2.0.1] - 2016-09-26

### Fixed

- `package.json` was misconfigured and didn't include the correct files

## [2.0.0] - 2016-09-26 [YANKED]

### Added

- `frame-throttle.d.ts` - a [TypeScript declaration file] for `frame-throttle.js`

### Changed

- Converted project to [TypeScript]
- Renamed main file from `throttle.js` to `frame-throttle.js`
- Moved main file from base directory to `dist` directory
- `throttle` method is now a module member rather than the entire module.
  This means that you must now use:
  ```js
  // Correct
  var throttle = require('frame-throttle').throttle;
  ```
  rather than
  ```js
  // Wrong!
  var throttle = require('frame-throttle');
  ```
- The throttled listener now passes its `this` context to the callback
- The callback is now passed the arguments for the most recent call to the
  throttled method rather than being passed the oldest arguments.
  This only happens when `requestAnimationFrame` is present.

### Known Issues

- `package.json` was misconfigured and didn't include the correct files

## [1.1.0] - 2016-08-23

### Fixed

- When [requestAnimationFrame] does not exist, call the callback immediately
  and ignore further events for 1/60th of a second. Old behavior was to wait
  1/60th of a second before calling callback.

### Misc

- Additional documentation in README
- coveralls.io and travis badges in README
- additional tests to cover `setTimeout` use case

## 1.0.0 - 2016-07-30

### Added

- Initial release

[requestanimationframe]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
[typescript]: http://www.typescriptlang.org
[typescript declaration file]: https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html
[1.1.0]: https://github.com/pelotoncycle/frame-throttle/compare/v1.0.0...v1.1.0
[2.0.0]: https://github.com/pelotoncycle/frame-throttle/compare/v1.1.0...v2.0.0
[2.0.1]: https://github.com/pelotoncycle/frame-throttle/compare/v1.1.0...v2.0.1
[3.0.0]: https://github.com/pelotoncycle/frame-throttle/compare/v2.0.1...v3.0.0
[unreleased]: https://github.com/pelotoncycle/frame-throttle/compare/v3.0.0...HEAD
