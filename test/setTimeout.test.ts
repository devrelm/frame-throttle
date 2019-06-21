import { throttle } from '../src';

const FRAME_TIME = 1000 / 60;
const frameTick = () => {
  jest.advanceTimersByTime(FRAME_TIME);
};

let requestAnimationFrame: any;

describe('throttle with setTimeout', () => {
  beforeAll(() => {
    requestAnimationFrame = window.requestAnimationFrame;
    delete window.requestAnimationFrame;
  });

  afterAll(() => {
    window.requestAnimationFrame = requestAnimationFrame;
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls setTimeout once for multiple event occurrences', () => {
    const throttledListener = throttle(() => undefined);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - setTimeout not called before event dispatch
    expect(setTimeout).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));

    // calls setTimeout upon first event dispatch
    expect(setTimeout).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event(event));

    // does not call setTimeout again upon second event dispatch
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });

  it('waits 1/60th of a second to call the callback', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - callback not called before event dispatch
    expect(callback).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));

    // calls callback upon first event dispatch
    expect(callback).toHaveBeenCalledTimes(1);

    callback.mockReset();
    window.dispatchEvent(new Event(event));
    jest.advanceTimersByTime(FRAME_TIME - 1);
    window.dispatchEvent(new Event(event));

    // does not call the callback again before 1/60th of a second
    expect(callback).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1);

    // events fired prior to 1/60th sec do not set callbacks for after 1/60th sec
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('calls the callback multiple times for multiple event/frame cycles', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - callback not called before event dispatch
    expect(callback).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));
    frameTick();

    // callback is called during first event/frame cycle
    expect(callback).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event(event));
    frameTick();

    // callback is called during second event/frame cycle
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('calls the callback once per event dispatch', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - callback not called before event dispatch
    expect(callback).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));
    frameTick();

    // callback is called during first event/frame cycle
    expect(callback).toHaveBeenCalledTimes(1);

    frameTick();

    // callback is not called during second frame without event
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('no longer calls callback after removeEventListener', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    window.dispatchEvent(new Event(event));
    frameTick();

    // sanity check - callback called during first event/frame cycle
    expect(callback).toHaveBeenCalledTimes(1);

    window.removeEventListener(event, throttledListener);

    window.dispatchEvent(new Event(event));
    frameTick();

    // callback is not called during second cycle after throttled callback is removed
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('passes the event object to the original callback', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const event = 'resize';
    const eventObject = new Event(event);

    window.addEventListener(event, throttledListener);

    window.dispatchEvent(eventObject);
    frameTick();

    // sanity check - callback called during first event/frame cycle
    expect(callback).toHaveBeenCalledTimes(1);

    // callback called with the provided event object
    expect(callback).toHaveBeenCalledWith(eventObject);
  });

  it('passes the throttled callback context as the callback context', () => {
    const callback = jest.fn();
    const id = { test: 'context' };
    const throttledListener = throttle(callback).bind(id);
    const event = 'resize';
    const eventObject = new Event(event);

    window.addEventListener(event, throttledListener);
    window.dispatchEvent(eventObject);
    frameTick();

    // callback is called with the context of the throttled callback
    expect(callback.mock.instances[0]).toBe(id);
  });

  it('multiple throttled listeners bound from the same source are throttled separately', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const id1 = { test: 'context1' };
    const id2 = { test: 'context2' };
    const boundThrottledListener1 = throttledListener.bind(id1);
    const boundThrottledListener2 = throttledListener.bind(id2);

    throttledListener();

    // setTimeout is called once for the unbound callback
    expect(setTimeout).toHaveBeenCalledTimes(1);

    throttledListener();

    // setTimeout is called _only_ once for the unbound callback
    expect(setTimeout).toHaveBeenCalledTimes(1);

    // callback is called once for the unbound callback
    expect(callback).toHaveBeenCalledTimes(1);

    boundThrottledListener1();

    // setTimeout is called once for the first bound callback
    expect(setTimeout).toHaveBeenCalledTimes(2);

    boundThrottledListener1();

    // setTimeout is called _only_ once for the first bound callback
    expect(setTimeout).toHaveBeenCalledTimes(2);

    // callback is called once for the first bound callback
    expect(callback).toHaveBeenCalledTimes(2);

    boundThrottledListener2();

    // setTimeout is called once for the second bound callback
    expect(setTimeout).toHaveBeenCalledTimes(3);

    boundThrottledListener2();

    // setTimeout is called _only_ once for the second bound callback
    expect(setTimeout).toHaveBeenCalledTimes(3);

    // callback is called once for the second bound callback
    expect(callback).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(FRAME_TIME);

    throttledListener();

    // setTimeout is called again for the unbound callback after 1/60th second
    expect(setTimeout).toHaveBeenCalledTimes(4);

    boundThrottledListener1();

    // setTimeout is called again for the first bound callback after 1/60th second
    expect(setTimeout).toHaveBeenCalledTimes(5);

    boundThrottledListener2();

    // setTimeout is called again for the second bound callback after 1/60th second
    expect(setTimeout).toHaveBeenCalledTimes(6);
  });

  it('passes first-passed arguments to the callback', () => {
    const callback = jest.fn();
    const firstCallArgument = 1;
    const throttledCallback = throttle(callback);

    throttledCallback(firstCallArgument);

    // callback is called immediately after the first call
    expect(callback).toHaveBeenCalledTimes(1);
    // callback was called with the arguments for the first call
    expect(callback).toHaveBeenCalledWith(firstCallArgument);

    callback.mockReset();
    throttledCallback();

    // callback is not called upon second call to throttled callback before 1/60th second
    expect(callback).toHaveBeenCalledTimes(0);

    frameTick();

    // callback is not called after 1/60 sec, without calling the throttled callback
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('calling `.apply` does not bypass the throttle', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context = { test: 'context' };

    throttledListener();

    // callback is called once for the base callback
    expect(callback).toHaveBeenCalledTimes(1);

    throttledListener.apply(context);

    // raf is not called when `apply` called with a separate context after already waiting
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calling `.apply` passes the context and args to the callback', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context = { test: 'context' };
    const arg1 = 1;
    const arg2 = 2;

    throttledListener.apply(context, [arg1, arg2]);

    // callback is called with the passed context
    expect(callback.mock.instances[0]).toBe(context);

    // callback is called with the passed args
    expect(callback).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.apply` with an undefined context passes the context and args to the callback', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const arg1 = 1;
    const arg2 = 2;

    throttledListener.apply(undefined, [arg1, arg2]);

    // callback is called with the passed context
    expect(callback.mock.instances[0]).toBe(undefined);

    // callback is called with the passed args
    expect(callback).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.apply` passes the _first_ context and args to the callback', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context1 = { context: 1 };
    const context2 = { context: 2 };
    const argA1 = { arg: 'a1' };
    const argA2 = { arg: 'a2' };
    const argB1 = { arg: 'b1' };
    const argB2 = { arg: 'b2' };

    throttledListener.apply(context1, [argA1, argA2]);
    throttledListener.apply(context2, [argB1, argB2]);

    // callback is called with the first context
    expect(callback.mock.instances[0]).toBe(context1);

    // callback is called with the first args
    expect(callback).toHaveBeenCalledWith(argA1, argA2);
  });

  it('calling `.bind` with arguments prepends those arguments to the final call', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context1 = { context: 1 };
    const argA1 = { arg: 'a1' };
    const argA2 = { arg: 'a2' };
    const argB1 = { arg: 'b1' };
    const argB2 = { arg: 'b2' };

    const boundThrottledListener = throttledListener.bind(
      context1,
      argA1,
      argA2
    );
    boundThrottledListener(argB1, argB2);

    // callback is called with the correct context
    expect(callback.mock.instances[0]).toBe(context1);

    // callback is called with the combined args
    expect(callback).toHaveBeenCalledWith(argA1, argA2, argB1, argB2);
  });

  it('calling `.bind` with no arguments adds no extra arguments', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context1 = { context: 1 };
    const arg1 = { arg: '1' };
    const arg2 = { arg: '2' };

    const boundThrottledListener = throttledListener.bind(context1);
    boundThrottledListener(arg1, arg2);

    // callback is called with the correct context
    expect(callback.mock.instances[0]).toBe(context1);

    // callback is called with the combined args
    expect(callback).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.bind` with arguments adds no extra arguments', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context1 = { context: 1 };
    const arg1 = { arg: '1' };
    const arg2 = { arg: '2' };

    const boundThrottledListener = throttledListener.bind(context1, arg1, arg2);
    boundThrottledListener();

    // callback is called with the correct context
    expect(callback.mock.instances[0]).toBe(context1);

    // callback is called with the combined args
    expect(callback).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.bind` followed by `.apply` correctly combines arguments', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context1 = { context: 1 };
    const context2 = { context: 2 };
    const argA1 = { arg: 'a1' };
    const argA2 = { arg: 'a2' };
    const argB1 = { arg: 'b1' };
    const argB2 = { arg: 'b2' };

    const boundThrottledListener = throttledListener.bind(
      context1,
      argA1,
      argA2
    );
    boundThrottledListener.apply(context2, [argB1, argB2]);

    // callback is called with the correct context
    expect(callback.mock.instances[0]).toBe(context1);

    // callback is called with the combined args
    expect(callback).toHaveBeenCalledWith(argA1, argA2, argB1, argB2);
  });

  it('calling `cancel` cancels the wait', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);

    throttledListener();

    throttledListener.cancel();

    throttledListener();

    // callback was called twice
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('calling `cancel` on a bound throttled callback does not cancel the original or others bound from it', () => {
    const callback = jest.fn();
    const throttledListener = throttle(callback);
    const context0 = { context: 0 };
    const context1 = { context: 1 };
    const context2 = { context: 2 };
    const boundThrottledListener1 = throttledListener.bind(context1);
    const boundThrottledListener2 = throttledListener.bind(context2);

    throttledListener.apply(context0);
    boundThrottledListener1();
    boundThrottledListener2();

    boundThrottledListener1.cancel();

    throttledListener.apply(context0);
    boundThrottledListener1();
    boundThrottledListener2();

    // callback was called four times
    expect(callback).toHaveBeenCalledTimes(4);

    // first call was from unbound throttled callback
    expect(callback.mock.instances[0]).toBe(context0);
    // second call was through first bound throttled callback
    expect(callback.mock.instances[1]).toBe(context1);
    // third call was through second bound throttled callback
    expect(callback.mock.instances[2]).toBe(context2);
    // fourth call was through first bound throttled callback
    expect(callback.mock.instances[3]).toBe(context1);
  });
});
