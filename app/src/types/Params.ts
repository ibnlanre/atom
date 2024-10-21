import type { Emit } from "./Emit";

/**
 * Defines the parameters used by the `get` and `set` method.
 *
 * @template State The type of the state.
 * @template Context The type of context associated with the `atom`.
 */
export type Params<State, Context> = {
  value: State;
  previous: State;
  ctx: Context;
  emit: Emit<Context>;
};
