import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { debounceEffect } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.resetAllMocks();
});

afterAll(() => {
  vi.useRealTimers();
});

describe("debounceEffect", () => {
  it("should call the effect immediately if delay is 0", () => {
    const effect = vi.fn();
    const debounced = debounceEffect(effect, { delay: 0 });

    debounced();
    expect(effect).toHaveBeenCalled();
  });

  it("should debounce the effect with the specified delay", () => {
    const effect = vi.fn();
    const debounced = debounceEffect(effect, { delay: 100 });

    debounced();
    expect(effect).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(effect).toHaveBeenCalled();
  });

  it("should call the effect on the leading edge if leading is true", () => {
    const effect = vi.fn();
    const debounced = debounceEffect(effect, { delay: 100, leading: true });

    debounced();
    expect(effect).toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("should call the effect on the trailing edge if trailing is true", () => {
    const effect = vi.fn();
    const debounced = debounceEffect(effect, { delay: 100, trailing: true });

    debounced();
    expect(effect).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(effect).toHaveBeenCalled();
  });

  it("should clear the timeout if the debounced function is called again before the delay", () => {
    const effect = vi.fn();
    const debounced = debounceEffect(effect, { delay: 100 });

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(effect).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(effect).toHaveBeenCalled();
  });

  it("should call the destructor when the returned function is called", () => {
    const destructor = vi.fn();
    const effect = vi.fn(() => destructor);
    const debounced = debounceEffect(effect, { delay: 100 });

    const cancel = debounced();
    vi.advanceTimersByTime(100);
    cancel();
    expect(destructor).toHaveBeenCalled();
  });
});
