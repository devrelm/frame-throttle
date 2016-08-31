import * as test from 'tape-catch';

test('requiring throttle', (t) => {
    t.plan(1);

    const throttle = require('../frame-throttle').throttle;
    t.equal(typeof throttle, 'function', 'returns a function');
});
