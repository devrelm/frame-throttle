import MockRaf from 'mock-raf';
import { throttle } from '../src';

const mockRaf = MockRaf();

describe('throttle with requestAnimationFrame', () => {
  let rafSpy: jest.SpyInstance<number, [FrameRequestCallback]>;
  beforeEach(() => {
    rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(mockRaf.raf);
    jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(mockRaf.cancel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls requestAnimationFrame once for multiple event occurrences', () => {
    const throttledListener = throttle(() => undefined);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - requestAnimationFrame not called before event dispatch
    expect(rafSpy).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));

    // calls requestAnimationFrame upon first event dispatch
    expect(rafSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event(event));

    // does not call requestAnimationFrame again upon second event dispatch
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it('waits until the animation frame to call the listener', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - listener not called before event dispatch
    expect(listener).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));

    // does not call listener upon first event dispatch
    expect(listener).toHaveBeenCalledTimes(0);

    mockRaf.step();

    // calls listener during animation frame
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls the listener multiple times for multiple event/frame cycles', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - listener not called before event dispatch
    expect(listener).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));
    mockRaf.step();

    // listener is called during first event/frame cycle
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event(event));
    mockRaf.step();

    // listener is called during second event/frame cycle
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('calls the listener once per event dispatch', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    // sanity check - listener not called before event dispatch
    expect(listener).toHaveBeenCalledTimes(0);

    window.dispatchEvent(new Event(event));
    mockRaf.step();

    // listener is called during first event/frame cycle
    expect(listener).toHaveBeenCalledTimes(1);

    mockRaf.step();

    // listener is not called during second frame without event
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('no longer calls listener after removeEventListener', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const event = 'resize';

    window.addEventListener(event, throttledListener);

    window.dispatchEvent(new Event(event));
    mockRaf.step();

    // sanity check - listener called during first event/frame cycle
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(event, throttledListener);

    window.dispatchEvent(new Event(event));
    mockRaf.step();

    // listener is not called during second cycle after throttled listener is removed
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('passes the event object to the original listener', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const event = 'resize';
    const eventObject = new Event(event);

    window.addEventListener(event, throttledListener);

    window.dispatchEvent(eventObject);
    mockRaf.step();

    // sanity check - listener called during first event/frame cycle
    expect(listener).toHaveBeenCalledTimes(1);

    // listener called with the provided event object
    expect(listener).toHaveBeenCalledWith(eventObject);
  });

  it('passes the throttled listener context as the listener context', () => {
    const listener = jest.fn();
    const id = {};
    const throttledListener = throttle(listener).bind(id);
    const event = 'resize';
    const eventObject = new Event(event);

    window.addEventListener(event, throttledListener);
    window.dispatchEvent(eventObject);
    mockRaf.step();

    // listener is called with the context of the throttled listener
    expect(listener.mock.instances[0]).toBe(id);
  });

  it('multiple throttled listeners bound from the same source are throttled separately', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const id1 = {};
    const id2 = {};
    const boundThrottledListener1 = throttledListener.bind(id1);
    const boundThrottledListener2 = throttledListener.bind(id2);

    throttledListener();

    // raf is called once for the unbound listener
    expect(rafSpy).toHaveBeenCalledTimes(1);

    throttledListener();

    // raf is called _only_ once for the unbound listener
    expect(rafSpy).toHaveBeenCalledTimes(1);

    boundThrottledListener1();

    // raf is called once for the first bound listener
    expect(rafSpy).toHaveBeenCalledTimes(2);

    boundThrottledListener1();

    // raf is called _only_ once for the first bound listener
    expect(rafSpy).toHaveBeenCalledTimes(2);

    boundThrottledListener2();

    // raf is called once for the second bound listener
    expect(rafSpy).toHaveBeenCalledTimes(3);

    boundThrottledListener2();

    // raf is called _only_ once for the second bound listener
    expect(rafSpy).toHaveBeenCalledTimes(3);

    mockRaf.step();

    // listener is called once for each bound and unbound throttled listener
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('throttles plain calls to the listener', () => {
    const listener = jest.fn();
    const firstCallArgument = 1;
    const secondCallArgument = 2;
    const throttledCallback = throttle(listener);

    throttledCallback(firstCallArgument);
    throttledCallback(secondCallArgument);

    // listener is not called before rAF
    expect(listener).toHaveBeenCalledTimes(0);

    mockRaf.step();

    // listener is called once after rAF
    expect(listener).toHaveBeenCalledTimes(1);

    // listener was called with the arguments for the first call
    expect(listener).toHaveBeenCalledWith(firstCallArgument);
  });

  it('calling `.apply` does not bypass the throttle', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const context1 = {};

    throttledListener();

    // raf is called once for the base listener
    expect(rafSpy).toHaveBeenCalledTimes(1);

    throttledListener.apply(context1);

    // raf is not called when `apply` called with a separate context after already waiting
    expect(rafSpy).toHaveBeenCalledTimes(1);

    mockRaf.step();

    // listener is called once for each bound and unbound throttled listener
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calling `.apply` passes the context and args to the listener', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const context1 = { id: 1 };
    const arg1 = 1;
    const arg2 = 2;

    throttledListener.apply(context1, [arg1, arg2]);

    mockRaf.step();

    // listener is called with the passed context
    expect(listener.mock.instances[0]).toBe(context1);

    // listener is called with the passed args
    expect(listener).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.apply` with an undefined context passes the context and args to the listener', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const arg1 = 1;
    const arg2 = 2;

    throttledListener.apply(undefined, [arg1, arg2]);

    mockRaf.step();

    // listener is called with the passed context
    expect(listener.mock.instances[0]).toBe(undefined);

    // listener is called with the passed args
    expect(listener).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.apply` passes the _latest_ context and args to the listener', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const context1 = { context: 1 };
    const context2 = { context: 2 };
    const argA1 = { arg: 'a1' };
    const argA2 = { arg: 'a2' };
    const argB1 = { arg: 'b1' };
    const argB2 = { arg: 'b2' };

    throttledListener.apply(context1, [argA1, argA2]);
    throttledListener.apply(context2, [argB1, argB2]);

    mockRaf.step();

    // listener is called with the latest context
    expect(listener.mock.instances[0]).toBe(context2);

    // listener is called with the latest args
    expect(listener).toHaveBeenCalledWith(argB1, argB2);
  });

  it('calling `.bind` with arguments prepends those arguments to the final call', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
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

    mockRaf.step();

    // listener is called with the bound context
    expect(listener.mock.instances[0]).toBe(context1);

    // listener is called with the combined args
    expect(listener).toHaveBeenCalledWith(argA1, argA2, argB1, argB2);
  });

  it('calling `.bind` with no arguments adds no extra arguments', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const context1 = { context: 1 };
    const arg1 = { arg: '1' };
    const arg2 = { arg: '2' };

    const boundThrottledListener = throttledListener.bind(context1);
    boundThrottledListener(arg1, arg2);

    mockRaf.step();

    // listener is called with the correct context
    expect(listener.mock.instances[0]).toBe(context1);

    // listener is called with the combined args
    expect(listener).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.bind` with arguments adds no extra arguments', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const context1 = { context: 1 };
    const arg1 = { arg: '1' };
    const arg2 = { arg: '2' };

    const boundThrottledListener = throttledListener.bind(context1, arg1, arg2);
    boundThrottledListener();

    mockRaf.step();

    // listener is called with the correct context
    expect(listener.mock.instances[0]).toBe(context1);

    // listener is called with the combined args
    expect(listener).toHaveBeenCalledWith(arg1, arg2);
  });

  it('calling `.bind` followed by `.apply` correctly combines arguments', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
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

    mockRaf.step();

    // listener is called with the first-bound context
    expect(listener.mock.instances[0]).toBe(context1);

    // listener is called with the combined args
    expect(listener).toHaveBeenCalledWith(argA1, argA2, argB1, argB2);
  });

  it('calling `cancel` cancels the request', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);

    throttledListener();

    throttledListener.cancel();

    mockRaf.step();

    // listener was not called
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('calling `cancel` on a bound throttled listener cancels the request', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const boundThrottledListener = throttledListener.bind({});

    boundThrottledListener();

    boundThrottledListener.cancel();

    mockRaf.step();

    // listener was not called
    expect(listener).toHaveBeenCalledTimes(0);
  });

  test('calling `cancel` on a bound throttled listener does not cancel the original or others bound from it', () => {
    const listener = jest.fn();
    const throttledListener = throttle(listener);
    const context0 = { context: 0 };
    const context1 = { context: 1 };
    const context2 = { context: 2 };
    const boundThrottledListener1 = throttledListener.bind(context1);
    const boundThrottledListener2 = throttledListener.bind(context2);

    throttledListener.apply(context0);
    boundThrottledListener1();
    boundThrottledListener2();

    boundThrottledListener1.cancel();

    mockRaf.step();

    // listener was called twice
    expect(listener).toHaveBeenCalledTimes(2);

    // listener was called through unbound throttled listener
    expect(listener.mock.instances[0]).toBe(context0);

    // listener was called through second bound throttled listener
    expect(listener.mock.instances[1]).toBe(context2);
  });
});
