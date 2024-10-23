/**
 * @description
 * Creates a `useCase` string literal type.
 *
 * @param {string} value The value to convert to a `useCase` string literal type.
 * @returns {string} The `useCase` string literal type.
 */
export function useCase<
  const Value extends string,
  Result extends `use${Capitalize<Value>}`,
>(value: Value = "" as Value): Result {
  return `use${value.charAt(0).toUpperCase()}${value.slice(1)}` as Result;
}
