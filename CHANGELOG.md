# Change Log
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Changed
- Converted project to [TypeScript]

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

[Unreleased]: https://github.com/pelotoncycle/frame-throttle/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/pelotoncycle/frame-throttle/compare/v1.0.0...v1.1.0
