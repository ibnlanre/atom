import type { Fields } from "./Fields";
import type { Params } from "./Params";

/**
 * Represents events associated with an `atom`.
 *
 * @template State The type of the state.
 * @template Context The type of context associated with the `atom`.
 * @template Data The type of data returned by the `get` event.
 * @template UseArgs An array of argument types for the `use` event.
 * @template GetArgs An array of argument types for the `get` event.
 *
 * @property {Function} [set] A middleware to call before setting the state.
 * @property {Function} [get] A middleware to call before getting the state.
 * @property {Function} [use] An effect to execute based on the dependencies.
 */
export interface AtomEvents<
  State,
  Data,
  Context,
  UseArgs extends ReadonlyArray<any>,
  GetArgs extends ReadonlyArray<any>,
> {
  /**
   * A middleware to call before setting the state.
   *
   * @param params The parameters used by the `set` method.
   * @returns {State} The new state.
   */
  set?: (params: Params<State, Context>) => State;
  /**
   * A middleware to call before getting the state.
   *
   * @param params The parameters used by the `get` method.
   * @returns {Data} The transformed value, which could be of a different data type.
   */
  get?: (params: Params<State, Context>, ...getArgs: GetArgs) => Data;
  /**
   * An effect to execute based on the dependencies.
   *
   * @param fields The fields associated with the `atom`.
   * @param useArgs An array of arguments to pass to the `use` function.
   * @returns {Garbage} A garbage collector for cleaning up effects.
   */
  use?: (fields: Fields<State, Context>, ...useArgs: UseArgs) => Garbage;
}
