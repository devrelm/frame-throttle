# Change Log
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- `frame-throttle.d.ts` - a [TypeScript declaration file] for `frame-throttle.js`
### Changed
- Converted project to [TypeScript]
- Renamed main file from `throttle.js` to `frame-throttle.js`
- Moved main file from base directory to `dist` directory
- `throttle` method is now a module member rather than the entire module.
  This means that you must now use:
  ```
  // Correct
  var throttle = require('frame-throttle').throttle;
  ```
  rather than
  ```
  // Wrong!
  var throttle = require('frame-throttle');
  ```

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


[requestAnimationFrame]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
[TypeScript]: http://www.typescriptlang.org
[TypeScript declaration file]: https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

[Unreleased]: https://github.com/pelotoncycle/frame-throttle/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/pelotoncycle/frame-throttle/compare/v1.0.0...v1.1.0
