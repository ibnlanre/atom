import { Dispatch, SetStateAction, useEffect, useState } from "react";

type Dictionary = {
  readonly [k: string]: unknown;
  readonly [k: number]: unknown;
  readonly [k: symbol]: unknown;
};

type Values<
  List extends readonly string[],
  Separator extends string = ".",
  Result extends string = ""
> = List extends [infer Head extends string, ...infer Tail extends string[]]
  ? Result extends ""
    ? Values<Tail, Separator, `${Head}`>
    : Result | Values<Tail, Separator, `${Result}${Separator}${Head}`>
  : Result;

type PathsHelper<
  Prefix extends readonly string[],
  Key extends string,
  Separator extends string = "."
> = Values<[...Prefix, Key], Separator>;

type Paths<
  Register extends Dictionary,
  Prefix extends readonly string[] = [],
  Separator extends string = "."
> = Register extends Dictionary
  ? {
      [Key in keyof Register]: Key extends string | number
        ? Register[Key] extends Dictionary
          ?
              | PathsHelper<Prefix, `${Key}`, Separator>
              | PathsHelper<
                  Prefix,
                  `${Key}${Separator}${Paths<Register[Key], [], Separator>}`,
                  Separator
                >
          : PathsHelper<Prefix, `${Key}`, Separator>
        : never;
    }[keyof Register]
  : never;

type Segments<T extends Dictionary> = Split<Paths<T>>;

type ResolveSegment<T extends Dictionary, K extends Segments<T>> = K extends [
  infer Head,
  ...infer Tail
]
  ? Head extends keyof T
    ? Tail extends []
      ? T[Head]
      : T[Head] extends Dictionary
      ? Tail extends Segments<T[Head]>
        ? ResolveSegment<T[Head], Tail>
        : never
      : never
    : never
  : never;

type ResolvePath<T extends Dictionary, K extends Paths<T>> = ResolveSegment<
  T,
  Split<K>
>;

type Split<
  T extends string,
  Result extends string[] = []
> = T extends `${infer Head}.${infer Tail}`
  ? Split<Tail, [...Result, Head]>
  : T extends ""
  ? Result
  : [...Result, T];

/**
 * Check if the value is a dictionary.
 *
 * @param value - The value to check.
 *
 * @returns A boolean indicating whether the value is a dictionary.
 */
function isDictionary(value: unknown): value is Dictionary {
  return typeof value === "object" && value !== null;
}

function resolveSegment<State extends Dictionary, Keys extends Segments<State>>(
  state: State,
  keys: Keys
): ResolveSegment<State, Keys> {
  for (const key of keys) state = state[key] as State;
  return state as ResolveSegment<State, Keys>;
}

function resolvePath<
  State extends Dictionary,
  Path extends Paths<State> = never
>(state: State, path: Path): ResolvePath<State, Path> {
  const segments = splitPath(path);
  return resolveSegment(state, segments);
}

function splitPath<Path extends string>(path: Path): Split<Path> {
  return path.split(".") as Split<Path>;
}

function createSnapshot<State extends Dictionary>(state: State) {
  return Object.create(
    Object.getPrototypeOf(state),
    Object.getOwnPropertyDescriptors(state)
  );
}

function isSetStateActionFunction<Value>(
  value: unknown
): value is (prev: Value) => Value {
  return typeof value === "function";
}

type StatePath<State extends Dictionary, Path extends Paths<State> = never> =
  | State
  | ResolvePath<State, Path>;

function isResolvedPath<State extends Dictionary, Path extends Paths<State>>(
  value: StatePath<State, Path>,
  path?: Path
): value is ResolvePath<State, Path> {
  return path !== undefined;
}

type StateManager<State> = [State, Dispatch<SetStateAction<State>>];

function isFunction<State>(value: unknown): value is () => State {
  return typeof value === "function";
}

function createCompositeStore<State extends Dictionary>(initialState: State) {
  let state = initialState;
  const subscribers = new Map<string, Set<(value: any) => void>>();

  function getActiveSubscribers(path: string = "") {
    if (!subscribers.has(path)) subscribers.set(path, new Set());
    return subscribers.get(path)!;
  }

  function notifySubscribers(value: unknown, path?: string) {
    const subscribers = getActiveSubscribers(path);
    subscribers.forEach((subscriber) => subscriber(value));
  }

  function setState<Path extends Paths<State>>(value: State, path?: Path) {
    state = value;

    if (!path) notifySubscribers(value);
    else {
      const value = resolvePath<State, Path>(state, path);
      notifySubscribers(value, path);
    }
  }

  function setProperty<
    Path extends Paths<State>,
    Value extends ResolvePath<State, Path>
  >(value: Value, path?: Path) {
    if (!path) return setState(value);

    const keys = splitPath(path);
    const snapshot = createSnapshot(state);
    const pivot = keys[keys.length - 1];
    const segments = keys.slice(0, -1);

    let current = snapshot;

    for (const key of segments) current = current[key];
    current[pivot] = value;

    setState(snapshot);
  }

  function setStateAction(value: SetStateAction<State>) {
    if (isSetStateActionFunction<State>(value)) setState(value(state));
    else setState(value);
  }

  function setStatePathAction<
    Path extends Paths<State>,
    Value extends ResolvePath<State, Path>
  >(value: SetStateAction<Value>, path: Path) {
    if (isSetStateActionFunction(value)) {
      const current = resolvePath(state, path);
      return setProperty(value(current), path);
    }

    setProperty(value as ResolvePath<State, Path>, path);
  }

  function $set(): Dispatch<SetStateAction<State>>;

  function $set<
    Path extends Paths<State>,
    Value extends ResolvePath<State, Path>
  >(path: Path): Dispatch<SetStateAction<Value>>;

  function $set<
    Path extends Paths<State>,
    Value extends ResolvePath<State, Path>
  >(path?: Path) {
    if (!path) return setStateAction;
    return (value: SetStateAction<Value>) => setStatePathAction(value, path);
  }

  function $get(): State;

  function $get<
    Path extends Paths<State>,
    Value extends ResolvePath<State, Path>
  >(path: Path): Value;

  function $get<Path extends Paths<State>>(path?: Path) {
    if (path) return resolvePath<State, Path>(state, path);
    return state;
  }

  function $use(): StateManager<State>;

  function $use<Path extends Paths<State>>(
    path: Path
  ): StateManager<ResolvePath<State, Path>>;

  function $use<Path extends Paths<State>>(path?: Path) {
    const [value, setValue] = useState<StatePath<State, Path>>(() => {
      if (!path) return state;
      return resolvePath(state, path);
    });

    useEffect(() => {
      if (isResolvedPath(value, path)) setProperty(value, path);
      else setState(value);
    }, [value]);

    return [value, setValue] as any;
  }

  function $sub<
    Path extends Paths<State>,
    Value extends ResolvePath<State, Path>
  >(subscriber: (value: Value) => void, path?: Path) {
    const subscribers = getActiveSubscribers(path);
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  return {
    $get,
    $set,
    $sub,
    $use,
  };
}

function createPrimitiveStore<State>(initialState: State) {
  let state = initialState;
  const subscribers = new Set<(value: State) => void>();

  function setState(value: State) {
    state = value;
    notifySubscribers(value);
  }

  function setStateAction(value: SetStateAction<State>) {
    if (isSetStateActionFunction<State>(value)) setState(value(state));
    else setState(value);
  }

  function notifySubscribers(value: State) {
    subscribers.forEach((subscriber) => subscriber(value));
  }

  function $get() {
    return state;
  }

  function $set() {
    return setStateAction;
  }

  function $use(): StateManager<State> {
    const [value, setValue] = useState(state);
    useEffect(() => setState(value), [value]);
    return [value, setValue];
  }

  function $sub(subscriber: (value: State) => void) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  return {
    $get,
    $set,
    $sub,
    $use,
  };
}

function createStore<State extends Dictionary>(
  state: State | (() => State)
): ReturnType<typeof createCompositeStore<State>>;

function createStore<State>(
  state: State | (() => State)
): ReturnType<typeof createPrimitiveStore<State>>;

function createStore<State = undefined>(initialState?: State) {
  let state: State;

  if (isFunction<State>(initialState)) state = initialState();
  else state = initialState as State;

  if (isDictionary(state)) return createCompositeStore(state);
  return createPrimitiveStore(state);
}

type State = {
  location: {
    state: string;
    country: string;
    address: {
      street: string;
      city: string;
      zip: string;
      phone: string;
      info: {
        name: string;
        age: number;
      };
    };
  };
};

const composite = createStore({
  location: {
    state: "CA",
    country: "US",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      zip: "94105",
      phone: "415-555-1234",
      info: {
        name: "John Doe",
        age: 30,
      },
    },
  },
});

const basic = createStore(0);

const base = createStore(() => {
  return {
    hi: {
      how: {
        are: "you",
      },
    },
  };
});

base.$get("hi.how.are");

const [basicValue, setBasicValue] = basic.$use();
const basicSetValue = basic.$set();

const [store, setStore] = composite.$use("location.address.street");
const setValue = composite.$set("location.address.info.name");
const value = composite.$get("location.address.info.name");
