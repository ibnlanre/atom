import type { SetStateAction } from "react";
import type { Emit } from "./Emit";

/**
 * Represents a function to set the state of an `atom`.
 *
 * @template State The type of the state.
 * @template Context The type of context associated with the `atom`.
 *
 * @typedef {Function} SetAtom
 */
export type SetAtom<State, Context> = {
  /**
   * Sets the state with a new value.
   * @param {State | ((prevState: State) => State)} value The new state value.
   * @returns {void}
   */
  (value: SetStateAction<State>): void;
  /**
   * Sets the state with a new value.
   * @param {State | ((prevState: State) => State)} value The new state value.
   * @returns {void}
   */
  set(value: SetStateAction<State>): void;
  /**
   * The current state of the `atom` instance.
   * @type {State} value The new state value.
   */
  state: State;
  /**
   * Sets the context associated with the `atom`.
   *
   * @type {Partial<Context> | ((curr: Context) => Context)}
   * @memberof Fields<State, Context>
   */
  emit: Emit<Context>;
  /**
   * Gets the `context` associated with the `atom` instance.
   *
   * @type {Context}
   * @memberof Fields<State, Context>
   */
  ctx: Context;
};
