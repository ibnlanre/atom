import type { EffectCallback } from "react";
import type { DebounceOptions } from "../types/Debounce";

/**
 * Debounce an effect function.
 *
 * @param {EffectCallback} effect The effect function to be debounced.
 * @param {Object} [options={}] The options object.
 * @param {number} [options.delay] The delay in milliseconds before invoking the effect.
 * @param {boolean} [options.leading=false] The effect function should be invoked on the leading edge.
 * @param {boolean} [options.trailing=true] The effect function should be invoked on the trailing edge.
 *
 * @returns {(...args: Arguments) => () => void} A function to trigger the debounced effect.
 */
export function debounceEffect<
  Destructor extends ReturnType<EffectCallback>,
  Arguments extends ReadonlyArray<any>,
  Effect extends (...args: Arguments) => Destructor,
>(effect: Effect, options: DebounceOptions = {}) {
  const { delay = 0, leading = false, trailing = true } = options;

  if (!delay) return effect;

  let timeout: Timer | null = null;
  let destructor: Destructor;

  const debouncedEffect = (...args: Arguments) => {
    if (timeout) clearTimeout(timeout);
    else if (leading) destructor = effect(...args);

    timeout = setTimeout(() => {
      if (trailing) destructor = effect(...args);
      timeout = null;
    }, delay);

    return (): void => {
      if (timeout) clearTimeout(timeout);
      destructor?.();
    };
  };

  return debouncedEffect as Effect;
}
