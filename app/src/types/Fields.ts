import type { SetStateAction } from "react";
import type { Collector } from "./Collector";
import type { Emit } from "./Emit";

/**
 * Represents the fields associated with an `atom`.
 *
 * @template State The type of the state.
 * @template Context The type of context associated with the `atom`.
 *
 * @typedef {Object} Fields
 * @memberof Atom
 */
export type Fields<State, Context> = {
  /**
   * Gets the current state of the `atom` instance.
   *
   * @function
   * @returns {State} The current state.
   */
  value: State;
  /**
   * Travel to a specific state in the timeline.
   *
   * @typedef {Object} Timeline
   * @property {Array<State>} history An array containing the history of state changes.
   * @property {Function} backward A function to access the previous value of the `atom`.
   * @property {Function} forward A function to update the value of the `atom` instance.
   * @property {Function} redo A function to redo a previous state change.
   * @property {Function} undo A function to undo a previous state change.
   */
  timeline: Timeline<State>;
  /**
   * Sets the state with a new value, optionally transforming it using the provided `set` function.
   *
   * @function
   * @param {State | ((prevState: State) => State)} value The new state value.
   */
  set: (value: SetStateAction<State>) => void;
  /**
   * Subscribes to changes in the `atom`'s value.
   *
   * @function
   * @param {Function} observer The callback function to be called with the new value.
   * @returns {Object} An object with an `unsubscribe` function to stop the subscription.
   */
  subscribe: (
    observer: (value: State) => any,
    initialize?: boolean
  ) => {
    unsubscribe: () => void;
  };
  /**
   * Sets the state with a new value.
   *
   * @function
   * @param {State} value The new state value.
   */
  publish: (value: State) => void;
  /**
   * Sets the context associated with the `atom`.
   *
   * @param {Partial<Context> | ((curr: Context) => Context)} ctx The new context or a function to transform the existing context.
   * @returns {Context} The updated context.
   */
  emit: Emit<Context>;
  /**
   * Gets the `context` associated with the `atom` instance.
   *
   * @function
   * @returns {Context} The `context`.
   */
  ctx: Context;
  /**
   * Disposes of the set of functions resulting from the last execution of the `use` function.
   *
   * @param {"rerun" | "unmount"} bin The type of disposal ("rerun" or "unmount").
   */
  dispose: (bin: "rerun" | "unmount") => void;
  /**
   * Provides control over functions to execute on specific `atom` events.
   *
   * @typedef {Object} Collector
   * @property {Function} rerun A function to add a cleanup function to be executed when the `atom` is updated.
   * @property {Function} unmount A function to add a cleanup function to be executed when the `atom` is unmounted.
   */
  on: Collector;
};
