import { type DependencyList, type EffectCallback, useEffect } from "react";
import { deepSort } from "../deep-sort";

export function makeUseSynchronizedEffect() {
  /**
   * A set defining whether a `useArgs` has been executed by the `use` function.
   * @type {Map<string, boolean>}
   */
  const queue = new Map<string, boolean>();

  /**
   * Creates a key from the dependencies passed to it.
   *
   * @private
   * @param {DependencyList} dependencies The dependencies to compare deeply.
   *
   * @returns {string} The key generated from the dependencies.
   */
  function createKey(dependencies: DependencyList) {
    const identifier = JSON.stringify(deepSort(dependencies));
    const lastAddedKey = Array.from(queue.keys()).pop();

    if (lastAddedKey !== identifier) {
      queue.forEach((_, key) => queue.set(key, true));
      queue.set(identifier, true);
    }

    return identifier;
  }

  /**
   * Synchronizes an effect function with the dependencies passed to it.
   *
   * @private
   * @param {EffectCallback} effect The effect function to be synchronized.
   * @param {string} key The key generated from the dependencies.
   * @param {boolean} enabled Whether to enable the effect.
   *
   * @returns {EffectCallback} The effect function to be synchronized.
   */
  function sync(effect: EffectCallback, key: string, enabled: boolean) {
    if (!enabled) return;
    if (!queue.get(key)) return;

    queue.set(key, false);
    return effect();
  }

  /**
   * A custom hook that synchronizes an effect function with the dependencies passed to it.
   *
   * @param {EffectCallback} effect The effect function to be synchronized.
   * @param {DependencyList} dependencies The dependencies to compare deeply.
   * @param {boolean} enabled Whether to enable the effect.
   */
  return function useSynchronizedEffect(
    effect: EffectCallback,
    dependencies: DependencyList,
    enabled: boolean
  ) {
    const key = createKey(dependencies);
    useEffect(() => sync(effect, key, enabled), [key, enabled]);
  };
}
