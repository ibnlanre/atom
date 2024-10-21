import type { AtomOptions } from "./AtomOptions";
import type { AtomResult } from "./AtomResult";
import type { Fields } from "./Fields";

/**
 * Represents an `atom`.
 *
 * @template State The type of the state.
 * @template UseArgs An array of argument types for the `use` event.
 * @template Data The type of data returned by the `get` event.
 * @template Context The type of context associated with the `atom`.
 *
 * @typedef {Object} Atom
 * @property {Function} get Retrieves the current state or optionally transforms it using the provided function.
 * @property {Function} use Represents the result of using an `atom`.
 */
export interface Atom<
  State,
  Context,
  UseArgs extends ReadonlyArray<any>,
  GetArgs extends ReadonlyArray<any>,
  Data = State,
> extends Fields<State, Context> {
  /**
   * Retrieves the current state or optionally transforms it using the provided function.
   *
   * @function
   * @param {State} value The current state value or a transformation function.
   * @returns {Data} The transformed value, which could be of a different data type.
   */
  get(value?: State, ...getArgs: GetArgs): Data;
  /**
   * Represents the result of using an `atom`.
   *
   * @template Select The type of selected data associated with the `atom`.
   * @template State The type of the state.
   * @template Context The type of context associated with the `atom`.
   */
  use<Key extends string, Select = Data>(
    options?: AtomOptions<Key, State, UseArgs, GetArgs, Data, Select>
  ): AtomResult<Key, State, Context, Select>;
}
