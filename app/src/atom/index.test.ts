import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { atom } from ".";

describe("atom", () => {
  it("should initialize with the given state", () => {
    const instance = atom({
      state: 0,
    });
    expect(instance.value).toBe(0);
  });

  it("should initialize with the state from a function", () => {
    const instance = atom({
      state: (context) => context.multiplier * 2,
      context: { multiplier: 3 },
    });
    expect(instance.value).toBe(6);
  });

  it("should set the state using the set function", () => {
    const instance = atom({
      state: 0,
      debug: true,
      events: {
        set: ({ value, previous }) => {
          return value + 1;
        },
      },
    });
    instance.set(5);
    expect(instance.value).toBe(6);
  });

  it("should get the state using the get function", () => {
    const instance = atom({
      state: 5,
      events: {
        get: ({ value }) => value * 2,
      },
    });
    const result = instance.get();
    expect(result).toBe(10);
  });

  it("should execute the use function and collect the resulting functions", () => {
    const rerun = vi.fn();
    const unmount = vi.fn();

    let state = 0;

    const instance = atom({
      state: 0,
      events: {
        use: (undefined, state) => ({ rerun, unmount }),
      },
    });

    const hook = renderHook(() =>
      instance.use({
        useArgs: [state],
      })
    );

    expect(rerun).not.toHaveBeenCalled();
    expect(unmount).not.toHaveBeenCalled();

    act(() => {
      state = 5;
      hook.rerender();
    });

    expect(state).toBe(5);
    expect(rerun).toHaveBeenCalled();

    hook.unmount();
    expect(unmount).toHaveBeenCalledOnce();
  });

  it("should update context using emit", () => {
    const instance = atom({
      state: 0,
      context: { count: 0 },
    });
    instance.emit({ count: 5 });
    expect(instance.ctx.count).toBe(5);
  });

  it("should subscribe to changes in the atom's value", () => {
    const instance = atom({
      state: 0,
    });
    const subscriber = vi.fn();
    const subscription = instance.subscribe(subscriber);
    instance.set(1);
    expect(subscriber).toHaveBeenCalledWith(1);
    subscription.unsubscribe();
  });
});
