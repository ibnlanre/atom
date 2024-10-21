/**
 * Represents the state of an `atom`.
 *
 * @template State The type of the state.
 * @template Context The type of context associated with the `atom`.
 */
export type AtomState<State, Context> = State | ((context: Context) => State);
