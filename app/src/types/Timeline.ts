/**
 * Represents the state timeline of an `atom`.
 *
 * @template State The type of the state.
 * @typedef {Object} Timeline
 */
type Timeline<State> = {
  /**
   * An array containing the history of state changes.
   *
   * @type {Array<State>} The history of state changes.
   */
  history: State[];
  /**
   * Retrieves the previous state in the timeline, if available.
   *
   * @type {State | undefined} The previous state in the timeline, or undefined if not available.
   */
  backward: State | undefined;
  /**
   * Retrieves the next state in the timeline, if available.
   *
   * @type {State | undefined} The next state in the timeline, or undefined if not available.
   */
  forward: State | undefined;
  /**
   * Redoes a previous state change.
   *
   * @function
   */
  redo: () => void;
  /**
   * Undoes a previous state change.
   *
   * @function
   */
  undo: () => void;
};
