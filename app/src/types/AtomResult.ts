import type { SetStateAction } from "react";
import type { Prettify } from "./Prettify";

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
export type AtomResult<Key extends string, State, Context, Select> = [
  Select,
  ((value: SetStateAction<State>) => void) & Context,
] &
  Prettify<
    Context & {
      [K in Key]: Select;
    } & {
      [K in Key as `set${Capitalize<Key>}`]: (
        value: SetStateAction<State>
      ) => void;
    }
  >;
