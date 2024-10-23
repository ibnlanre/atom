import type { AtomEvents } from "./AtomEvents";
import type { AtomState } from "./AtomState";
import type { DebounceOptions } from "./Debounce";

/**
 * Configuration options for creating an `atom`.
 *
 * @template State The type of the state.
 * @template Data The type of data returned by the `get` event.
 * @template Context The type of context associated with the `atom`.
 * @template UseArgs An array of argument types for the `use` event.
 * @template GetArgs An array of argument types for the `get` event.
 *
 * @property {AtomState<State, Context>} state The initial state or a function to generate the initial state.
 * @property {boolean} [debug] A boolean indicating whether to log the state history for debugging.
 * @property {AtomEvents<State, Context, UseArgs, GetArgs, Data>} [events] An object containing functions to interact with the `atom`.
 * @property {Context} [context] Record of mutable context on the atom instance.
 * @property {DebounceOptions} [debounce] Options for debouncing the `use` function.
 *
 */
export type AtomConfig<
  State,
  Data = State,
  Context extends {
    [key: string]: any;
  } = {},
  UseArgs extends ReadonlyArray<any> = [],
  GetArgs extends ReadonlyArray<any> = [],
> = {
  /**
   * The initial state or a function to generate the initial state.
   */
  state: AtomState<State, Context>;
  /**
   * A boolean indicating whether to log the state history for debugging.
   */
  debug?: boolean;
  /**
   * An object containing functions to interact with the `atom`.
   */
  events?: AtomEvents<State, Context, UseArgs, GetArgs, Data>;
  /**
   * Record of mutable context on the atom instance.
   */
  context?: Context;
  /**
   * Options for debouncing the `use` function.
   */
  debounce?: DebounceOptions;
};
