import {jsdom} from 'jsdom';
import * as sinon from 'sinon';
import {test} from './helpers';
import {throttle} from '../frame-throttle';

const mockRaf = require('mock-raf')();

const setup = () => {
    const document = jsdom('<html><body></body></html>');
    global.window = document.defaultView;
    global.window.requestAnimationFrame = mockRaf.raf;
};

const teardown = () => {
    delete global.window;
};

test('calls requestAnimationFrame once for multiple event occurrences', (t) => {
    setup();
    t.plan(3);

    const rafSpy = sinon.stub(window, 'requestAnimationFrame');
    const throttledListener = throttle(() => undefined);
    const event = 'resize';
    rafSpy.reset();

    window.addEventListener(event, throttledListener);

    t.equal(rafSpy.callCount, 0,
        'sanity check - requestAnimationFrame not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(rafSpy.callCount, 1,
        'calls requestAnimationFrame upon first event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(rafSpy.callCount, 1,
        'does not call requestAnimationFrame again upon second event dispatch');
}, teardown);

test('waits until the animation frame to call the callback', (t) => {
    setup();
    t.plan(3);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    t.equal(listener.callCount, 0,
        'sanity check - listener not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(listener.callCount, 0,
        'does not call listener upon first event dispatch');

    mockRaf.step();

    t.equal(listener.callCount, 1,
        'calls listener during animation frame');
}, teardown);

test('calls the listener multiple times for multiple event/frame cycles', (t) => {
    setup();
    t.plan(3);

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
}, teardown);

test('calls the listener once per event dispatch', (t) => {
    setup();
    t.plan(3);

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
}, teardown);

test('no longer calls listener after removeEventListener', (t) => {
    setup();
    t.plan(2);

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
}, teardown);

test('passes the event object to the original listener', (t) => {
    setup();
    t.plan(2);

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
}, teardown);

test('passes the latest event object to the original listener', (t) => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);

    window.addEventListener('resize', throttledListener);
    const eventObject = new window.Event('resize');
    window.dispatchEvent(eventObject);

    window.addEventListener('scroll', throttledListener);
    const secondEventObject = new window.Event('scroll');
    window.dispatchEvent(secondEventObject);

    t.notEqual(eventObject, secondEventObject,
        'sanity check - the event objects are not equal');

    mockRaf.step();

    t.equal(listener.getCall(0).args[0].type, secondEventObject.type,
        'listener called with the second provided event object');
}, teardown);

test('passes the throttled listener context as the listener context', (t) => {
    setup();
    t.plan(1);

    const listener = sinon.spy();
    const id = {};
    const throttledListener = throttle(listener).bind(id);
    const event = 'resize';
    const eventObject = new window.Event(event);

    window.addEventListener(event, throttledListener);
    window.dispatchEvent(eventObject);
    mockRaf.step();

    t.equal(listener.getCall(0).thisValue, id,
        'listener is called with the context of the throttled listener');
}, teardown);

test('throttles plain calls to the callback', (t) => {
    setup();
    t.plan(3);

    const callback = sinon.spy();
    const firstCallArgument = {};
    const secondCallArgument = {};
    const throttledCallback = throttle(callback);

    throttledCallback(firstCallArgument);
    throttledCallback(secondCallArgument);

    t.false(callback.called,
        'callback is not called before rAF');

    mockRaf.step();

    t.true(callback.calledOnce,
        'callback is called once after rAF');
    t.true(callback.calledWithExactly(firstCallArgument),
        'callback was called with the arguments for the first call');
}, teardown);
