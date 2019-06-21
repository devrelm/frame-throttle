import * as test from 'tape-catch';
import {throttle} from '../src';

test('requiring throttle', (t) => {
    t.plan(2);

    const requiredThrottle = require('../frame-throttle').throttle;
    t.notEqual(requiredThrottle, undefined, 'returns a module containing a `throttle` member');
    t.equal(requiredThrottle, throttle, 'returns a module containing the `throttle` method');
});
