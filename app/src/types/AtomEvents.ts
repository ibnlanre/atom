import type { Fields } from "./Fields";
import type { Params } from "./Params";

/**
 * Represents events associated with an `atom`.
 *
 * @template State The type of the state.
 * @template Data The type of data returned by the `get` event.
 * @template Context The type of context associated with the `atom`.
 * @template UseArgs An array of argument types for the `use` event.
 * @template GetArgs An array of argument types for the `get` event.
 *
 * @property {Function} [set] A middleware function that is called before the state is set.
 * @property {Function} [get] A middleware function that is called before the state is retrieved.
 * @property {Function} [use] An effect to execute based on the dependencies.
 */
export interface AtomEvents<
  State,
  Context extends Record<string, unknown> = {},
  UseArgs extends ReadonlyArray<unknown> = [],
  GetArgs extends ReadonlyArray<unknown> = [],
  Data = State,
> {
  /**
   * This function can be used to perform actions or validations before the state change occurs.
   *
   * @param params The parameters used by the `set` method.
   * @returns {State} The new state.
   */
  set?: (params: Params<State, Context>) => State;
  /**
   * This function can be used to perform actions or transformations before the state is accessed.
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
