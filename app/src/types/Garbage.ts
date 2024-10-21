/**
 * Represents a garbage collector for managing functions.
 *
 * @description
 * The `rerun` function adds a cleanup function to be executed when the `atom` is updated.
 * The `unmount` function adds a cleanup function to be executed when the `atom` is unmounted.
 *
 * @typedef {Function} () => void
 * The cleanup function to be executed on unmount.
 */
type Garbage =
  | { rerun?: () => void; unmount?: () => void }
  | (() => void)
  | void;
