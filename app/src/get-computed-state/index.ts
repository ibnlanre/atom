import type { SetStateAction } from "react";
import { isFunction } from "../is-function";

/**
 * Gets the actual state value from the provided initial state.
 * @template State The type of the initial state value.
 * @param {State | ((prevState: State) => State)} initialState The initial state value or a function that returns the initial state.
 * @returns {State} The actual state value.
 */
export function getComputedState<State>(
  initialState: SetStateAction<State>,
  previousState: State
): State {
  if (isFunction<State>(initialState)) {
    return initialState(previousState);
  }
  return initialState;
}
