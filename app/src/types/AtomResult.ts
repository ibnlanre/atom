import type { SetStateAction } from "react";

/**
 * Represents the state and dispatch of an `atom`.
 *
 * @template Key The type of the key.
 * @template State The type of the state.
 * @template Context The type of context associated with the `atom`.
 * @template Select The type of selected data associated with the `atom`.
 *
 * @typedef {Array<Select, (value: SetStateAction<State>) => void>} UseAtomResult
 */
export type AtomResult<Key extends string, State, Context, Select> = Record<
  Key,
  Select
> &
  Record<`set${Capitalize<Key>}`, (value: SetStateAction<State>) => void> &
  Record<`${Key}Ctx`, Context>;
