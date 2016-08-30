import * as test from 'tape-catch';

test('requiring throttle', (t) => {
    t.plan(1);

    const throttle = require('../throttle').throttle;
    t.equal(typeof throttle, 'function', 'returns a function');
});
