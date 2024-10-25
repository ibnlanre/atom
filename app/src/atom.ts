import { SetStateAction, useEffect, useState } from "react";

import type { Atom } from "./types/Atom";
import type { AtomConfig } from "./types/AtomConfig";
import type { AtomOptions } from "./types/AtomOptions";
import type { AtomResult } from "./types/AtomResult";
import type { Collector } from "./types/Collector";
import type { Fields } from "./types/Fields";
import type { Params } from "./types/Params";

import { debounceEffect } from "./debounce-effect";
import { getComputedState } from "./get-computed-state";
import { isFunction } from "./is-function";
import { makeUseSyncEffect } from "./make-use-sync-effect";
import { Particle } from "./particle";

/**
 * @description Creates an `atom` instance for managing and updating state.
 *
 * @template State The type of the state.
 * @template Data The type of data returned by the `get` event.
 * @template Context The type of context associated with the `atom`.
 * @template UseArgs An array of argument types for the `use` event.
 * @template GetArgs An array of argument types for the `get` event.
 *
 * @function
 *
 * @typedef {Object} AtomConfig
 * @param {AtomConfig} config Configuration object for the `atom`.
 * @param {State | ((context: Context) => State)} config.state Initial state or a function to generate the initial state.
 * @param {Context} [config.context] Record of mutable context on the atom instance.
 * @param {number} [config.delay] Debounce delay in milliseconds before executing the `use` function.
 *
 * @typedef {Object} AtomEvents
 * @param {AtomEvents} [config.events] events object containing functions to interact with the `atom`.
 * @param {(params: Setter<State, Context>) => State} [config.events.set] Function to set the `atom`'s state.
 * @param {(params: Getter<State, Context>) => Data} [config.events.get] Function to get data from the `atom`'s state.
 * @param {(fields: Fields<State, Context>, ...useArgs: UseArgs) => Collector} [config.events.use] Function to perform asynchronous events.
 *
 * @typedef {Object} Atom
 * @returns {Atom<State, Data, Context, UseArgs, GetArgs>} An Atom instance.
 */
export function atom<
  State,
  Context extends Record<string, unknown>,
  UseArgs extends ReadonlyArray<any>,
  GetArgs extends ReadonlyArray<any>,
  Data = State,
>(
  config: AtomConfig<State, Context, UseArgs, GetArgs, Data>
): Atom<State, Context, UseArgs, GetArgs, Data> {
  const {
    state,
    debounce = {},
    context = {} as Context,
    debug = false,
    events,
  } = config;
  const { set, get, use } = { ...events };

  const initialState = isFunction<Context, State>(state)
    ? state(context)
    : state;

  const observable = new Particle(initialState, debug);
  const signal = new Particle(context);

  /**
   * Represents the functions to execute on specific `atom` events.
   *
   * @typedef {Object} Collector
   * @property {Set<() => void>} rerun A set of functions to execute on the next execution of the `use` function.
   * @property {Set<() => void>} unmount A set of functions to execute on unmount.
   */
  const collector = {
    rerun: new Set<() => void>(),
    unmount: new Set<() => void>(),
  };

  /**
   * Represents the functions used to collect and dispose of functions.
   *
   * @typedef {Object}
   * @property {Function} rerun A method that adds a cleanup function to the rerun collector.
   * @property {Function} unmount A method that adds a cleanup function to the unmount collector.
   */
  const on: Collector = {
    rerun: (fn?: () => void) => {
      if (isFunction(fn)) {
        collector.rerun.add(fn);
      }
    },
    unmount: (fn?: () => void) => {
      if (isFunction(fn)) {
        collector.unmount.add(fn);
      }
    },
  };

  /**
   * Sets the context of the `atom` instance.
   * @param {Partial<Context> | ((curr: Context) => Context)} ctx The context to set.
   * @returns {Context} The updated context.
   */
  const emit = (ctx: Partial<Context> | ((curr: Context) => Context)) => {
    const curr = signal.value;

    if (isFunction<Context>(ctx)) signal.publish(ctx(curr));
    else signal.publish({ ...curr, ...ctx });

    return signal.value;
  };

  /**
   * Executes a cleanup function and catches any errors.
   * @param {() => void} cleanup The function to execute.
   * @returns {void}
   */
  const trash = (cleanup: () => void) => {
    try {
      cleanup();
    } catch (error) {
      if (debug) {
        const message = "Error occured during cleanup";
        console.error(message, error);
      }
    }
  };

  /**
   * Disposes of the set of functions resulting from the last execution of the `use` function.
   *
   * @param {"rerun" | "unmount"} bin The type of disposal ("rerun" or "unmount").
   */
  const dispose = (bin: "rerun" | "unmount") => {
    collector[bin].forEach(trash);
    collector[bin].clear();
  };

  /**
   * Subscribes to changes in the `atom` context's value.
   *
   * @function
   * @param {Function} observer The callback function to be called with the new value.
   * @returns {Object} An object with an `unsubscribe` function to stop the subscription.
   */
  const provide = signal.subscribe;

  /**
   * Sets the value of the `atom` instance.
   *
   * @function
   * @param {SetStateAction<State>} value The value to set the `atom` instance to.
   * @returns {void}
   */
  const setValueWithArgs = (value: SetStateAction<State>) => {
    const resolvedValue = getComputedState(value, observable.value);
    const params: Params<State, Context> = {
      value: resolvedValue,
      previous: observable.value,
      ctx: signal.value,
      emit,
    };

    // The set function allows optional transformations and returns the new state.
    if (set) observable.publish(set(params));
    else observable.publish(resolvedValue);
  };

  /**
   * Represents the core fields and context of an `atom` instance.
   *
   * @typedef {Object} Fields
   *
   * @property {State} value The current state of the `atom` instance.
   * @property {Timeline<State>} timeline An object containing functions to travel through the `atom`'s timeline.
   *
   * @property {Function} set A function to set the value of the `atom` instance with optional transformations.
   * @property {Function} subscribe A function to subscribe to changes in the `atom`'s value.
   * @property {Function} publish A function to update the value of the `atom` instance.
   *
   * @property {Function} emit Sets the context of the `atom` instance.
   * @property {Context} ctx The context associated with the `atom` instance.
   *
   * @property {Function} dispose Disposes of the functions in the collector.
   * @property {Function} on Provides control over functions to execute on specific `atom` events.
   */
  const fields: Fields<State, Context> = {
    get value() {
      return observable.value;
    },
    timeline: {
      get history() {
        return observable.history;
      },
      get forward() {
        return observable.forward();
      },
      get backward() {
        return observable.backward();
      },
      redo: observable.redo,
      undo: observable.undo,
    },
    set: setValueWithArgs,
    subscribe: observable.subscribe,
    publish: observable.publish,
    emit,
    get ctx() {
      return signal.value;
    },
    dispose,
    on,
  };

  /**
   * Executes the `use` function and collects the resulting functions.
   *
   * @function
   * @param {UseArgs} useArgs Optional arguments to pass to the `use` event.
   * @returns {void}
   */
  const useValueWithArgs = (...useArgs: UseArgs) => {
    // Get the disposable functions from the `use` function.
    const value = use?.(fields, ...useArgs);

    // Add the functions to the collector.
    if (isFunction(value)) on.unmount(value);
    else {
      on.rerun(value?.rerun);
      on.unmount(value?.unmount);
    }
  };

  /**
   * Gets the value of the `atom` instance with optional transformations.
   *
   * @function
   * @param {State} value The value of the `atom` instance.
   * @param {GetArgs} getArgs Optional arguments to pass to the `get` event.
   *
   * @returns {Data} The value of the `atom` instance.
   */
  const getValueWithArgs = (
    value: State = observable.value,
    ...getArgs: GetArgs
  ) => {
    const params: Params<State, Context> = {
      value,
      previous: observable.value,
      ctx: signal.value,
      emit,
    };

    // The get function allows optional transformations and returns the transformed value.
    if (get) return get(params, ...getArgs);
    else return value as unknown as Data;
  };

  /**
   * A hook to synchronize the execution of the `use` function.
   * @type {Function}
   */
  const useSyncEffect = makeUseSyncEffect();

  /**
   * A hook to use the `atom` instance.
   *
   * @template Select The type of data returned by the `use` event.
   *
   * @function
   * @param {AtomOptions} options Optional options to customize the `atom` hook.
   * @param {Function} options.select A function to select data from the `atom`'s state.
   * @param {GetArgs} options.getArgs Optional arguments to pass to the `get` event.
   * @param {UseArgs} options.useArgs Optional arguments to pass to the `use` event.
   * @param {boolean} options.enabled Whether or not to execute the `use` function.
   *
   * @returns {[Select, SetAtom<State, Context>]} An array containing the selected data and a function to set the `atom`'s state.
   */
  const useAtom = <Key extends string, Select = Data>(
    options?: AtomOptions<Key, State, UseArgs, GetArgs, Data, Select>
  ): AtomResult<Key, State, Context, Select> => {
    const {
      key = "value",
      select = (data: Data) => data as unknown as Select,
      getArgs = [] as unknown as GetArgs,
      useArgs = [] as unknown as UseArgs,
      enabled = true,
    } = { ...options };

    const [state, setState] = useState(fields.value);
    const [ctx, setCtx] = useState(fields.ctx);

    const execute = debounceEffect(() => {
      // Run cleanup functions from the last execution.
      dispose("rerun");
      useValueWithArgs(...useArgs);
    }, debounce);

    useSyncEffect(execute, useArgs, enabled);
    useEffect(() => {
      // Subscribe to state changes.
      const subscriber = observable.subscribe(setState);

      // Subscribe to context changes.
      const provider = provide(setCtx);

      return () => {
        subscriber.unsubscribe();
        provider.unsubscribe();

        // Run cleanup functions for unmount.
        dispose("unmount");
      };
    }, []);

    const value = select(getValueWithArgs(state, ...getArgs));
    const setValue = (value: SetStateAction<State>) => {
      setValueWithArgs(getComputedState(value, state));
    };

    const result = {
      [key]: value,
      [`set${key.charAt(0).toUpperCase() + key.slice(1)}`]: setValue,
      [`${key}Ctx`]: ctx,
    } as AtomResult<Key, State, Context, Select>;

    return result;
  };

  /**
   * Represents the context and functions associated with an `atom` instance.
   *
   * @typedef {Object} AtomInstance
   * @property {Function} get A function to get the `atom`'s state.
   * @property {Function} use A hook to use the `atom` instance.
   */
  return Object.assign(fields, { get: getValueWithArgs, use: useAtom });
}
