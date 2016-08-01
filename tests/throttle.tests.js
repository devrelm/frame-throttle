const jsdom = require('jsdom').jsdom;
const sinon = require('sinon');
const test = require('tape-catch');
const mockRaf = require('mock-raf')();

const document = jsdom('<html><body></body></html>');
const window = document.defaultView;
global.requestAnimationFrame = sinon.spy(mockRaf.raf);

test('requiring throttle', (t) => {
    t.plan(1);

    const throttle = require('../throttle');
    t.equal(typeof throttle, 'function', 'returns a function');
});

test('calls requestAnimationFrame once for multiple event occurrences', (t) => {
    t.plan(3);

    const throttle = require('../throttle');
    const throttledListener = throttle(() => {});
    const event = 'resize';
    requestAnimationFrame.reset();

    window.addEventListener(event, throttledListener);

    t.equal(requestAnimationFrame.callCount, 0,
        'sanity check - requestAnimationFrame not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(requestAnimationFrame.callCount, 1,
        'calls requestAnimationFrame upon first event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(requestAnimationFrame.callCount, 1,
        'does not call requestAnimationFrame again upon second event dispatch');
});

test('waits until the animation frame to call the callback', (t) => {
    t.plan(3);

    const throttle = require('../throttle');
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';
    listener.reset();

    window.addEventListener(event, throttledListener);

    t.equal(listener.callCount, 0,
        'sanity check - listener not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(listener.callCount, 0,
        'does not call listener upon first event dispatch');

    mockRaf.step();

    t.equal(listener.callCount, 1,
        'calls listener during animation frame');
});

test('calls the listener multiple times for multiple event/frame cycles', (t) => {
    t.plan(3);

    const throttle = require('../throttle');
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    t.equal(listener.callCount, 0,
        'sanity check - listener not called before event dispatch');

    window.dispatchEvent(new window.Event(event));
    mockRaf.step();

    t.equals(listener.callCount, 1,
        'listener is called during first event/frame cycle');

    window.dispatchEvent(new window.Event(event));
    mockRaf.step();

    t.equals(listener.callCount, 2,
        'listener is called during second event/frame cycle');
});

test('calls the listener once per event dispatch', (t) => {
    t.plan(3);

    const throttle = require('../throttle');
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    t.equal(listener.callCount, 0,
        'sanity check - listener not called before event dispatch');

    window.dispatchEvent(new window.Event(event));
    mockRaf.step();

    t.equal(listener.callCount, 1,
        'listener is called during first event/frame cycle');

    mockRaf.step();

    t.equal(listener.callCount, 1,
        'listener is not called during second frame without event');
});

test('no longer calls listener after removeEventListener', (t) => {
    t.plan(2);

    const throttle = require('../throttle');
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    window.dispatchEvent(new window.Event(event));
    mockRaf.step();

    t.equal(listener.callCount, 1,
        'sanity check - listener called during first event/frame cycle');

    window.removeEventListener(event, throttledListener);

    window.dispatchEvent(new window.Event(event));
    mockRaf.step();

    t.equal(listener.callCount, 1,
        'listener is not called during second cycle after throttled listener is removed');
});

test('passes the event object to the original listener', (t) => {
    t.plan(2);

    const throttle = require('../throttle');
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';
    const eventObject = new window.Event(event);

    window.addEventListener(event, throttledListener);

    window.dispatchEvent(eventObject);
    mockRaf.step();

    t.equal(listener.callCount, 1,
        'sanity check - listener called during first event/frame cycle');

    t.equal(listener.getCall(0).args[0], eventObject,
        'listener called with the provided event object');
});
