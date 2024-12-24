import { SetStateAction, useEffect, useState } from "react";

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

function isSetStateAction<Value>(
  value: SetStateAction<Value>
): value is (prev: Value) => Value {
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

class Store<State extends Dictionary> {
  private state: State;

  constructor(initialState: State) {
    this.state = initialState;
  }

  #setState = (value: State) => {
    this.state = value;
  };

  #setProperty = <Path extends Keys<State>>(
    value: ResolvePath<State, Path>,
    path?: Path
  ) => {
    if (!path) return this.#setState(value);

    const keys = splitPath(path);

    const snapshot = replicateState(this.state);
    const pivot = keys[keys.length - 1];
    const segments = keys.slice(0, -1);

    let current = snapshot;

    for (const key of segments) current = current[key];
    current[pivot] = value;

    this.#setState(snapshot);
  };

  #createSetState = <Path extends Keys<State>>(path: Path) => {
    return <Value extends ResolvePath<State, Path>>(
      value: Value | ((prev: Value) => Value)
    ) => {
      const get = isSetStateAction(value) ? value : () => value;
      const current = resolvePath(this.state, path);
      this.#setProperty(get(current), path);
    };
  };

  $get = <Path extends Keys<State>>(path?: Path) => {
    if (path) return resolvePath(this.state, path);
    return this.state;
  };

  $set = <Path extends Keys<State>>(path?: Path) => {
    if (path) return this.#createSetState(path);
    return this.#setState;
  };

  $use = <Path extends Keys<State>>(path?: Path) => {
    const [value, setValue] = useState<Resolver<State, Path>>(() => {
      if (!path) return this.state;
      return resolvePath(this.state, path);
    });

    useEffect(() => {
      if (isResolvedPath(value, path)) this.#setProperty(value, path);
      else this.#setState(value);
    }, [value]);

    return [value, setValue] as const;
  };
}

function createStore<State extends Dictionary>(initialState: State) {}

const store = createStore({
  location: {
    state: "NY",
    country: "USA",
    address: {
      street: "123 Main St",
      city: "New York",
      zip: "10001",
      phone: "555-1234", // Added phone property
    },
  },
});
