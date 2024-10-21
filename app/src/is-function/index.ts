/**
 * Check if the provided value is a function.
 *
 * @param {unknown} value Value to be checked.
 * @returns {boolean} `true` if the value is a function, `false` otherwise.
 */
export function isFunction<Argument, Result = Argument>(
  value: unknown
): value is (argument: Argument) => Result {
  return typeof value === "function";
}
