import type { Subscription } from "../types/Subscription";

/**
 * Represents a subject that maintains a current value and emits it to subscribers.
 * @template State The type of the initial and emitted values.
 */
export class Particle<State> {
  /**
   * The current value of the subject.
   *
   * @private
   * @type {State}
   */
  #state: State;

  /**
   * The set of subscribers to the subject.
   *
   * @private
   * @type {Set<Function>}
   */
  #subscribers: Set<Function>;

  /**
   * The current index of the state history for time-travel.
   *
   * @private
   * @type {number}
   * @default 0
   */
  #cursor: number = 0;

  /**
   * Determines whether to log the state history for debugging.
   * @type {boolean}
   *
   * @private
   * @default false
   */
  #debug: boolean = false;

  /**
   * The history of state values for time-travel.
   * @readonly
   *
   * @description
   * This property is only available when the debug option is set to `true`.
   * Otherwise, it is an empty array.
   *
   * @type {State[]} The history of state values.
   */
  public history: State[] = [];

  /**
   * Creates a new instance of Particle.
   * @param {State} initialValue The initial value of the subject.
   */
  constructor(initialValue: State, debug: boolean = false) {
    // Set the initial value of the subject
    this.#state = initialValue;

    // Initialize the subscribers set
    this.#subscribers = new Set();

    if (debug) {
      // Set the debug option to log state history
      this.#debug = debug;

      // Initialize the history array with the initial value
      if (debug) this.history.push(initialValue);
    }
  }

  /**
   * Returns the current value of the subject.
   * @returns {State} The current value.
   */
  get value(): State {
    return this.#state;
  }

  /**
   * Determines whether it is possible to perform an undo operation.
   * @returns {boolean} `true` if an undo operation can be performed, `false` otherwise.
   */
  get canUndo(): boolean {
    if (!this.#debug) return false;
    return this.#cursor > 0;
  }

  /**
   * Determines whether it is possible to perform a redo operation.
   * @returns {boolean} `true` if a redo operation can be performed, `false` otherwise.
   */
  get canRedo(): boolean {
    if (!this.#debug) return false;
    return this.#cursor < this.history.length - 1;
  }

  /**
   * Updates the state with a new value and keeps a history for time-travel.
   *
   * @param {State} value The new state value to set.
   * @returns {State} The updated state value.
   */
  publish = (value: State): State => {
    if (!Object.is(this.#state, value)) {
      // Update the current state with the new value
      this.#state = value;

      if (this.#debug) {
        // Keep a history of state values for time-travel
        // Splice any future history beyond the current index
        this.history.splice(this.#cursor + 1);

        // Push the new state value into the history
        this.history.push(value);

        // Update the current index to point to the newly added state value
        this.#cursor = this.history.length - 1;
      }

      // Notify subscribers about the state change
      this.notifySubscribers();
    }

    return value;
  };

  /**
   * Retrieves the next state from the history for time-travel.
   * @returns {State | undefined} The next state, or undefined if there is no next state.
   */
  forward = (): State | undefined => {
    if (!this.#debug) return undefined;

    // Calculate the index of the next state
    const cursor = this.#cursor + 1;

    // If cursor is greater than or equal to the history length, return undefined
    if (cursor >= this.history.length) return undefined;

    // Retrieve the next state from history
    return this.history[cursor];
  };

  /**
   * Retrieves the previous state from the history for time-travel.
   * @returns {State | undefined} The previous state, or undefined if there is no previous state.
   */
  backward = (): State | undefined => {
    if (!this.#debug) return undefined;

    // Calculate the index of the previous state
    const cursor = this.#cursor - 1;

    // If cursor is 0, return the current state
    if (!cursor) return this.#state;

    // If cursor is greater than 0, retrieve the previous state from history
    if (cursor > 0) {
      return this.history[cursor];
    }

    // If there is no previous state, return undefined
    return undefined;
  };

  /**
   * Reverts to the previous state from the history for undoing an action.
   */
  undo = () => {
    // Check if there is a previous state to undo to
    if (this.canUndo) {
      // Decrement the cursor to move to the previous state
      this.#cursor--;

      // Set the current state to the previous state from history
      this.#state = this.history[this.#cursor] as State;

      // Notify subscribers that the state has changed
      this.notifySubscribers();
    }
  };

  /**
   * Moves forward in the history to redo an action.
   */
  redo = () => {
    // Check if there is a state to redo to
    if (this.canRedo) {
      // Increment the cursor to move forward in history
      this.#cursor++;

      // Set the current state to the next state from history
      this.#state = this.history[this.#cursor] as State;

      // Notify subscribers that the state has changed
      this.notifySubscribers();
    }
  };

  /**
   * Subscribes to the subject and receives emitted values.
   * @param {Function} observer The callback function to be called with emitted values.
   * @param {boolean} [immediate=true] Whether to run the callback immediately with the current state. Defaults to `true`.
   *
   * @description
   * When immediate is true, the callback will execute immediately with the current state.
   * When immediate is false or not provided, the callback will only execute after a change has occurred.
   *
   * @returns {{ unsubscribe: Function }} An object with a function to unsubscribe the callback.
   */
  subscribe = (
    observer: (value: State) => any,
    immediate: boolean = true
  ): Subscription => {
    // Check if the observer is not already subscribed
    if (!this.#subscribers.has(observer)) {
      // Add the observer to the subscribers set
      this.#subscribers.add(observer);
      // notify the observer with the current state if immediate is true
      if (immediate) observer(this.#state);
    }

    // Return an object with an unsubscribe function
    return {
      /**
       * Unsubscribes the observer from further updates.
       */
      unsubscribe: () => {
        this.#subscribers.delete(observer);
      },
    };
  };

  /**
   * Unsubscribes all subscribers from the subject.
   */
  unsubscribe = (): void => {
    this.#subscribers.clear();
  };

  /**
   * Notifies all subscribers with the current value.
   * If a subscriber's callback throws an error, it's caught and logged.
   *  @protected
   */
  protected notifySubscribers = () => {
    // Iterate through all subscribers and invoke their callbacks with the current state
    this.#subscribers.forEach((callback) => {
      try {
        callback(this.#state);
      } catch (err) {
        if (!this.#debug) return;
        // Catch and log any errors that occur in subscriber callbacks
        console.error("Error occurred in subscriber callback:", err);
      }
    });
  };
}
