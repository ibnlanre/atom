import { useEffect, useState } from "react";

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

type Keys<T extends unknown> = T extends Dictionary ? Paths<T> : never;

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

type Test = ResolvePath<
  //   ^?
  { location: { address: { street: string } } },
  "location.address.street"
>;

/**
 * Check if the value is a dictionary.
 *
 * @param value - The value to check.
 *
 * @returns A boolean indicating whether the value is a dictionary.
 */
function isDictionary(value: any): value is Dictionary {
  return typeof value === "object" && value !== null;
}

function resolveSegment<State extends Dictionary, Keys extends Segments<State>>(
  state: State,
  keys: Keys
): ResolveSegment<State, Keys> {
  for (const key of keys) state = state[key] as any;
  return state as any;
}

function resolvePath<
  State extends Dictionary,
  Path extends Keys<State> = never
>(state: State, path: Path): ResolvePath<State, Path> {
  const segments = splitPath(path);
  return resolveSegment(state, segments);
}

function splitPath<Path extends string>(path: Path) {
  return path.split(".") as Split<Path>;
}

function replicateState<State extends Dictionary>(state: State) {
  return Object.create(
    Object.getPrototypeOf(state),
    Object.getOwnPropertyDescriptors(state)
  );
}

function isSetStateAction<Value, Action extends (prev: Value) => Value>(
  value: Action
): value is Action {
  return typeof value === "function";
}

type Resolver<State extends Dictionary, Path extends Keys<State>> =
  | State
  | ResolvePath<State, Path>;

function isResolvedPath<State extends Dictionary, Path extends Keys<State>>(
  value: Resolver<State, Path>,
  path?: Path
): value is ResolvePath<State, Path> {
  return path !== undefined;
}

type SetStateAction<Value> = Value | ((prev: Value) => Value);

type SetStatePathAction<
  State extends Dictionary,
  Path extends Paths<State>,
  Value extends ResolvePath<State, Path>
> = Value | ((prev: Value) => Value);

type Dispatch<T> = (value: T) => void;

function createCompositeStore<State extends Dictionary>(initialState: State) {
  let state = initialState;

  function setState(value: State) {
    state = value;
  }

  function setProperty<Path extends Keys<State>>(
    value: ResolvePath<State, Path>,
    path?: Path
  ) {
    if (!path) return setState(value);

    const keys = splitPath(path);

    const snapshot = replicateState(state);
    const pivot = keys[keys.length - 1];
    const segments = keys.slice(0, -1);

    let current = snapshot;

    for (const key of segments) current = current[key];
    current[pivot] = value;

    setState(snapshot);
  }

  function setStateAction<Value extends State>(value: Value): void;

  function setStateAction<
    Value extends ResolvePath<State, Path>,
    Path extends Keys<State>
  >(value: Value, path: Path): void;

  function setStateAction<Value>(value: (prev: Value) => Value): void;

  function setStateAction<
    Value extends ResolvePath<State, Path>,
    Path extends Keys<State>
  >(value: (prev: Value) => Value, path: Path): void;

  function setStateAction<Path extends Keys<State>>(value: any, path?: Path) {
    if (path) {
      const current = resolvePath(state, path);
      if (isSetStateAction(value)) setProperty(value(current), path);
      return setProperty(value, path);
    }

    if (isSetStateAction(value)) return setState(value(state));
    return setState(value);
  }

  function $get<Path extends Keys<State>>(path?: Path) {
    if (path) return resolvePath(state, path);
    return state;
  }

  function $set(): (value: State | ((prev: State) => State)) => void;

  function $set<Path extends Keys<State>>(
    path: Path
  ): <Value extends ResolvePath<State, Path>>(
    value: Value | ((prev: Value) => Value)
  ) => void;

  function $set<Path extends Keys<State>>(path?: Path) {
    if (!path) return (value: State) => setStateAction(value);

    return <Value extends ResolvePath<State, Path>>(
      value: Value | ((prev: Value) => Value)
    ) => setStateAction(value, path);
  }

  function $use<
    Path extends Keys<State>,
    Value extends ResolvePath<State, Path>
  >(path: Path): [Value, Dispatch<SetStateAction<Value>>];

  function $use<Path extends Keys<State>>(path?: Path) {
    const [value, setValue] = useState<Resolver<State, Path>>(() => {
      if (!path) return state;
      return resolvePath(state, path);
    });

    useEffect(() => {
      if (isResolvedPath(value, path)) setProperty(value, path);
      else setState(value);
    }, [value]);

    return [value, setValue];
  }

  return {
    $get,
    $set,
    $use,
  };
}

function createBasicStore<State>(initialState: State) {
  let state = initialState;

  function setState(value: State) {
    state = value;
  }

  function $use(): [State, Dispatch<SetStateAction<State>>] {
    const [value, setValue] = useState(state);

    useEffect(() => setState(value), [value]);
    return [value, setValue];
  }

  return {
    $use,
    $get() {
      return state;
    },
    $set() {
      return setState;
    },
  };
}

function createStore<State extends Dictionary>(
  initialState: State
): ReturnType<typeof createCompositeStore<State>>;

function createStore<State>(initialState: State) {
  if (isDictionary(initialState)) return createCompositeStore(initialState);
  return createBasicStore(initialState);
}

const store = createStore({
  location: {
    state: "NY",
    country: "USA",
    address: {
      street: "123 Main St",
      city: "New York",
      zip: "10001",
      phone: "555-1234", // Added phone property
      info: {
        name: "John Doe",
        age: 30,
      },
    },
  },
});

const [location, setLocation] = store.$use("location.address.info.age");
const setValue = store.$set("location.address.info.name");
