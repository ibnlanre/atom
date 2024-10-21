/**
 * Represents configuration options for an `atom`.
 *
 * @template State The type of the atom's state.
 * @template Data The type of data derived from the atom's state.
 * @template Context The type of context associated with the `atom`.
 * @template UseArgs The type of the atom's` function.
 * @template GetArgs The type of the atom's `get` function.
 * @template Select The type of selected data associated with the `atom`.
 *
 * @property {boolean} [enabled] A boolean indicating whether the `use` function should be executed.
 * @property {(data: Data) => Select} [select] A function to select data from the atom's data.
 * @property {UseArgs} [useArgs] An array of arguments to pass to the atom's `use` function.
 * @property {GetArgs} [getArgs] An array of arguments to pass to the atom's `get` function.
 */
export type AtomOptions<
  Key extends string,
  State,
  UseArgs extends ReadonlyArray<any>,
  GetArgs extends ReadonlyArray<any>,
  Data = State,
  Select = Data,
> = {
  /**
   * The key to use for the atom.
   */
  key?: Key;
  /**
   * A boolean indicating whether the `use` function should be executed.
   */
  enabled?: boolean;
  /**
   * A function to select data from the atom's data.
   * @param data The data returned by the atom's `get` function.
   * @returns {Select} The selected data.
   */
  select?: (data: Data) => Select;
  /**
   * An array of arguments to pass to the atom's `use` function.
   *
   * @type {UseArgs}
   * @memberof AtomOptions
   */
  useArgs?: UseArgs;
  /**
   * An array of arguments to pass to the atom's `get` function.
   *
   * @type {GetArgs}
   * @memberof AtomOptions
   */
  getArgs?: GetArgs;
};
