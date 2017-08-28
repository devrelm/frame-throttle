# Publishing frame-throttle

#### NOTE: Node 8.3+ is requried to publish frame-throttle

To publish frame-throttle to NPM, do the following steps:

1. Run the following:
   ```
   git checkout master
   git pull
   ```
2. Decide whether the release is a major, minor, or patch release.
3. Find out what the next version will be given the version bump level and standard semver symantics.
4. Update CHANGELOG.md references and links to "UNRELEASED" with the new version number.
5. Commit those changes.
6. Run the following:
   ```
   npm version <major|minor|patch>
   ```
   Where `<major|minor|patch>` is the bump level determined earlier.
7. Run:
   ```
   git push --tags origin master
   npm publish
   ```