/**
 * Represents the debounce options.
 *
 * @typedef {Object} DebounceOptions
 *
 * @property {number} [delay=0] The delay in milliseconds before invoking the effect.
 * @property {boolean} [leading=false] The effect function should be invoked on the leading edge.
 * @property {boolean} [trailing=true] The effect function should be invoked on the trailing edge.
 */
export interface DebounceOptions {
  /**
   * The delay in milliseconds before invoking the effect.
   * @default 0
   * @type {number}
   * @memberof DebounceOptions
   */
  delay?: number;
  /**
   * The effect function should be invoked on the leading edge.
   * @default false
   * @type {boolean}
   * @memberof DebounceOptions
   * @description If `true`, the effect function will be invoked immediately after the first invocation.
   * @see https://css-tricks.com/debouncing-throttling-explained-examples/
   */
  leading?: boolean;
  /**
   * The effect function should be invoked on the trailing edge.
   * @default true
   * @type {boolean}
   * @memberof DebounceOptions
   * @description If `true`, the effect function will be invoked after the `delay` milliseconds timeout.
   * @see https://css-tricks.com/debouncing-throttling-explained-examples/
   */
  trailing?: boolean;
}
