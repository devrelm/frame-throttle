import {JSDOM} from 'jsdom';
import * as MockRaf from 'mock-raf';
import * as sinon from 'sinon';
import {test} from './helpers';
import {throttle} from '../frame-throttle';

const mockRaf = MockRaf();

const setup = () => {
    const {window} = new JSDOM('<html><body></body></html>');
    global.window = window;
    global.window.requestAnimationFrame = mockRaf.raf;
    global.window.cancelAnimationFrame = mockRaf.cancel;
};

const teardown = () => {
    delete global.window;
};

test('calls requestAnimationFrame once for multiple event occurrences', (t) => {
    setup();
    t.plan(3);

    const rafSpy = sinon.stub(window, 'requestAnimationFrame', window.requestAnimationFrame);
    const throttledListener = throttle(() => undefined);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    t.equal(rafSpy.callCount, 0,
        'sanity check - requestAnimationFrame not called before event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(rafSpy.callCount, 1,
        'calls requestAnimationFrame upon first event dispatch');

    window.dispatchEvent(new window.Event(event));

    t.equal(rafSpy.callCount, 1,
        'does not call requestAnimationFrame again upon second event dispatch');

    rafSpy.restore();
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

test('multiple throttled listeners bound from the same source are throttled separately', t => {
    setup();
    t.plan(7);

    const rafSpy = sinon.stub(window, 'requestAnimationFrame', window.requestAnimationFrame);
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const id1 = {};
    const id2 = {};
    const boundThrottledListener1 = throttledListener.bind(id1);
    const boundThrottledListener2 = throttledListener.bind(id2);

    throttledListener();

    t.equal(rafSpy.callCount, 1,
        'raf is called once for the unbound listener');

    throttledListener();

    t.equal(rafSpy.callCount, 1,
        'raf is called _only_ once for the unbound listener');

    boundThrottledListener1();

    t.equal(rafSpy.callCount, 2,
        'raf is called once for the first bound listener');

    boundThrottledListener1();

    t.equal(rafSpy.callCount, 2,
        'raf is called _only_ once for the first bound listener');

    boundThrottledListener2();

    t.equal(rafSpy.callCount, 3,
        'raf is called once for the second bound listener');

    boundThrottledListener2();

    t.equal(rafSpy.callCount, 3,
        'raf is called _only_ once for the second bound listener');

    mockRaf.step();

    t.equal(listener.callCount, 3,
        'listener is called once for each bound and unbound throttled listener');
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

test('calling `.apply` does not bypass the throttle', t => {
    setup();
    t.plan(3);

    const rafSpy = sinon.stub(window, 'requestAnimationFrame', window.requestAnimationFrame);
    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const context1 = {};

    throttledListener();

    t.equal(rafSpy.callCount, 1,
        'raf is called once for the base listener');

    throttledListener.apply(context1);

    t.equal(rafSpy.callCount, 1,
        'raf is not called when `apply` called with a separate context after already waiting');

    mockRaf.step();

    t.equal(listener.callCount, 1,
        'listener is called once for each bound and unbound throttled listener');
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

    mockRaf.step();

    t.strictEquals(listener.getCall(0).thisValue, context1,
        'listener is called with the passed context');

    t.true(listener.calledWithExactly(arg1, arg2),
        'listener is called with the passed args');
}, teardown);

test('calling `.apply` passes the _latest_ context and args to the listener', t => {
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

    mockRaf.step();

    t.strictEquals(listener.getCall(0).thisValue, context2,
        'listener is called with the latest context');

    t.true(listener.calledWithExactly(argB1, argB2),
        'listener is called with the latest args');
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

    mockRaf.step();

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

    mockRaf.step();

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

    mockRaf.step();

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

    mockRaf.step();

    t.strictEqual(listener.getCall(0).thisValue, context1,
        'listener is called with the correct context');

    t.deepEquals(listener.getCall(0).args, [argA1, argA2, argB1, argB2],
        'listener is called with the combined args');
}, teardown);

test('calling `cancel` cancels the request', t => {
    setup();
    t.plan(1);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);

    throttledListener();

    throttledListener.cancel();

    mockRaf.step();

    t.strictEqual(listener.callCount, 0,
        'listener was not called');
}, teardown);

test('calling `cancel` on a bound throttled listener cancels the request', t => {
    setup();
    t.plan(1);

    const listener = sinon.spy();
    const throttledListener = throttle(listener);
    const boundThrottledListener = throttledListener.bind({});

    boundThrottledListener();

    boundThrottledListener.cancel();

    mockRaf.step();

    t.strictEqual(listener.callCount, 0,
        'listener was not called');
}, teardown);

test('calling `cancel` on a bound throttled listener does not cancel the original or others bound from it', t => {
    setup();
    t.plan(3);

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

    mockRaf.step();

    t.strictEqual(listener.callCount, 2,
        'listener was called twice');

    t.strictEqual(listener.getCall(0).thisValue, context0,
        'listener was called through unbound throttled listener');
    t.strictEqual(listener.getCall(1).thisValue, context2,
        'listener was called through second bound throttled listener');
}, teardown);
