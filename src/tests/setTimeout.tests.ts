import {JSDOM} from 'jsdom';
import * as sinon from 'sinon';
import {test} from './helpers';
import {throttle} from '../frame-throttle';

let clock: sinon.SinonFakeTimers;

const FRAME_TIME = 1000 / 60;
const frameTick = () => {
    clock.tick(FRAME_TIME);
};

const setup = () => {
    const {window} = new JSDOM('<html><body></body></html>');
    global.window = window;
    clock = sinon.useFakeTimers();
};

const teardown = () => {
    delete global.window;
    clock.restore();
};

test('calls setTimeout once for multiple event occurrences', (t) => {
    t.plan(3);
    setup();

    const setTimeoutStub = sinon.stub(window, 'setTimeout', clock.setTimeout);
    const throttledListener = throttle(() => undefined);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    t.equal(setTimeoutStub.callCount, 0,
        'sanity check - setTimeout not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(setTimeoutStub.callCount, 1,
        'calls setTimeout upon first event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(setTimeoutStub.callCount, 1,
        'does not call setTimeout again upon second event dispatch');
}, teardown);

test('waits 1/60th of a second to call the callback', (t) => {
    setup();
    t.plan(4);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    t.equal(listener.callCount, 0,
        'sanity check - listener not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(listener.callCount, 1,
        'calls listener upon first event dispatch');

    listener.reset();
    window.dispatchEvent(new window.Event(event));
    clock.tick(FRAME_TIME - 1);
    window.dispatchEvent(new window.Event(event));

    t.equal(listener.callCount, 0,
        'does not call the listener again before 1/60th of a second');

    clock.tick(1);

    t.equal(listener.callCount, 0,
        'events fired prior to 1/60th sec do not set callbacks for after 1/60th sec');
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
    frameTick();

    t.equals(listener.callCount, 1,
        'listener is called during first event/frame cycle');

    window.dispatchEvent(new window.Event(event));
    frameTick();

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
    frameTick();

    t.equal(listener.callCount, 1,
        'listener is called during first event/frame cycle');

    frameTick();

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
    frameTick();

    t.equal(listener.callCount, 1,
        'sanity check - listener called during first event/frame cycle');

    window.removeEventListener(event, throttledListener);

    window.dispatchEvent(new window.Event(event));
    frameTick();

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
    frameTick();

    t.equal(listener.callCount, 1,
        'sanity check - listener called during first event/frame cycle');

    t.equal(listener.getCall(0).args[0], eventObject,
        'listener called with the provided event object');
}, teardown);

test('passes the first event object to the original listener', (t) => {
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

    frameTick();

    t.equal(listener.getCall(0).args[0].type, eventObject.type,
        'listener called with the first provided event object');
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
    frameTick();

    t.equal(listener.getCall(0).thisValue, id,
        'listener is called with the context of the throttled listener');
}, teardown);

test('multiple throttled listeners bound from the same source are throttled separately', t => {
    setup();
    t.plan(12);

    const setTimeoutStub = sinon.stub(window, 'setTimeout', clock.setTimeout);
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const id1 = {};
    const id2 = {};
    const boundThrottledListener1 = throttledListener.bind(id1);
    const boundThrottledListener2 = throttledListener.bind(id2);

    throttledListener();

    t.equal(setTimeoutStub.callCount, 1,
        'setTimeout is called once for the unbound listener');

    throttledListener();

    t.equal(setTimeoutStub.callCount, 1,
        'setTimeout is called _only_ once for the unbound listener');

    t.equal(listener.callCount, 1,
        'listener is called once for the unbound listener');

    boundThrottledListener1();

    t.equal(setTimeoutStub.callCount, 2,
        'setTimeout is called once for the first bound listener');

    boundThrottledListener1();

    t.equal(setTimeoutStub.callCount, 2,
        'setTimeout is called _only_ once for the first bound listener');

    t.equal(listener.callCount, 2,
        'listener is called once for the first bound listener');

    boundThrottledListener2();

    t.equal(setTimeoutStub.callCount, 3,
        'setTimeout is called once for the second bound listener');

    boundThrottledListener2();

    t.equal(setTimeoutStub.callCount, 3,
        'setTimeout is called _only_ once for the second bound listener');

    t.equal(listener.callCount, 3,
        'listener is called once for the second bound listener');

    clock.tick(FRAME_TIME);

    throttledListener();

    t.equal(setTimeoutStub.callCount, 4,
        'setTimeout is called again for the unbound listener after 1/60th second');

    boundThrottledListener1();

    t.equal(setTimeoutStub.callCount, 5,
        'setTimeout is called again for the first bound listener after 1/60th second');

    boundThrottledListener2();

    t.equal(setTimeoutStub.callCount, 6,
        'setTimeout is called again for the second bound listener after 1/60th second');
}, teardown);

test('throttles plain calls to the callback', (t) => {
    setup();
    t.plan(4);

    const callback = sinon.spy();
    const firstCallArgument = {};
    const throttledCallback = throttle(callback);

    throttledCallback(firstCallArgument);

    t.true(callback.calledOnce,
        'callback is called immediately after the first call');
    t.true(callback.calledWithExactly(firstCallArgument),
        'callback was called with the arguments for the first call');

    callback.reset();
    throttledCallback();

    t.false(callback.called,
        'callback is not called upon second call to throttled callback before 1/60th second');

    frameTick();

    t.false(callback.called,
        'callback is not called after 1/60 sec, without calling the throttled callback');
}, teardown);
