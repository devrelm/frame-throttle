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

test('calling `.apply` does not bypass the throttle', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {};

    throttledListener();

    t.equal(listener.callCount, 1,
        'listener is called once for the base listener');

    throttledListener.apply(context1);

    t.equal(listener.callCount, 1,
        'raf is not called when `apply` called with a separate context after already waiting');
}, teardown);

test('calling `.apply` passes the context and args to the listener', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {};
    const arg1 = {};
    const arg2 = {};

    throttledListener.apply(context1, [arg1, arg2]);

    t.strictEquals(listener.getCall(0).thisValue, context1,
        'listener is called with the passed context');

    t.true(listener.calledWithExactly(arg1, arg2),
        'listener is called with the passed args');
}, teardown);

test('calling `.apply` passes the _first_ context and args to the listener', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {context: 1};
    const context2 = {context: 2};
    const argA1 = {arg: 'a1'};
    const argA2 = {arg: 'a2'};
    const argB1 = {arg: 'b1'};
    const argB2 = {arg: 'b2'};

    throttledListener.apply(context1, [argA1, argA2]);
    throttledListener.apply(context2, [argB1, argB2]);

    t.strictEquals(listener.getCall(0).thisValue, context1,
        'listener is called with the first context');

    t.true(listener.calledWithExactly(argA1, argA2),
        'listener is called with the first args');
}, teardown);

test('calling `.bind` with arguments prepends those arguments to the final call', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {context: 1};
    const argA1 = {arg: 'a1'};
    const argA2 = {arg: 'a2'};
    const argB1 = {arg: 'b1'};
    const argB2 = {arg: 'b2'};

    const boundThrottledListener = throttledListener.bind(context1, argA1, argA2);
    boundThrottledListener(argB1, argB2);

    t.strictEqual(listener.getCall(0).thisValue, context1,
        'listener is called with the correct context');

    t.deepEquals(listener.getCall(0).args, [argA1, argA2, argB1, argB2],
        'listener is called with the combined args');
}, teardown);

test('calling `.bind` with no arguments adds no extra arguments', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {context: 1};
    const arg1 = {arg: '1'};
    const arg2 = {arg: '2'};

    const boundThrottledListener = throttledListener.bind(context1);
    boundThrottledListener(arg1, arg2);

    t.strictEqual(listener.getCall(0).thisValue, context1,
        'listener is called with the correct context');

    t.deepEquals(listener.getCall(0).args, [arg1, arg2],
        'listener is called with the combined args');
}, teardown);

test('calling `.bind` with arguments adds no extra arguments', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {context: 1};
    const arg1 = {arg: '1'};
    const arg2 = {arg: '2'};

    const boundThrottledListener = throttledListener.bind(context1, arg1, arg2);
    boundThrottledListener();

    t.strictEqual(listener.getCall(0).thisValue, context1,
        'listener is called with the correct context');

    t.deepEquals(listener.getCall(0).args, [arg1, arg2],
        'listener is called with the combined args');
}, teardown);

test('calling `.bind` followed by `.apply` correctly combines arguments', t => {
    setup();
    t.plan(2);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {context: 1};
    const context2 = {context: 1};
    const argA1 = {arg: 'a1'};
    const argA2 = {arg: 'a2'};
    const argB1 = {arg: 'b1'};
    const argB2 = {arg: 'b2'};

    const boundThrottledListener = throttledListener.bind(context1, argA1, argA2);
    boundThrottledListener.apply(context2, [argB1, argB2]);

    t.strictEqual(listener.getCall(0).thisValue, context1,
        'listener is called with the correct context');

    t.deepEquals(listener.getCall(0).args, [argA1, argA2, argB1, argB2],
        'listener is called with the combined args');
}, teardown);

test('calling `cancel` cancels the wait', t => {
    setup();
    t.plan(1);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);

    throttledListener();

    throttledListener.cancel();

    throttledListener();

    t.strictEqual(listener.callCount, 2,
        'listener was called twice');
}, teardown);

test('calling `cancel` on a bound throttled listener does not cancel the original or others bound from it', t => {
    setup();
    t.plan(5);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context0 = {context: 0};
    const context1 = {context: 1};
    const context2 = {context: 1};
    const boundThrottledListener1 = throttledListener.bind(context1);
    const boundThrottledListener2 = throttledListener.bind(context2);

    throttledListener.apply(context0);
    boundThrottledListener1();
    boundThrottledListener2();

    boundThrottledListener1.cancel();

    throttledListener.apply(context0);
    boundThrottledListener1();
    boundThrottledListener2();

    t.strictEqual(listener.callCount, 4,
        'listener was called four times');

    t.strictEqual(listener.getCall(0).thisValue, context0,
        'first call was from unbound throttled listener');
    t.strictEqual(listener.getCall(1).thisValue, context1,
        'second call was through first bound throttled listener');
    t.strictEqual(listener.getCall(2).thisValue, context2,
        'third call was through second bound throttled listener');
    t.strictEqual(listener.getCall(3).thisValue, context1,
        'fourth call was through first bound throttled listener');
}, teardown);
