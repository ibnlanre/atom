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

function splitPath<Path extends string>(path: Path) {
  return path.split(".") as Split<Path>;
}

function createStore<State extends Dictionary>(initialState: State) {
  let state = initialState;

  function get(path?: Keys<State>) {
    if (path) {
      const segments = splitPath(path);
      return resolveSegment(state, segments);
    }

    return state;
  }

  function set(value: State): void;
  function set<
    Path extends Keys<State>,
    Value extends ResolvePath<State, Path>
  >(path: Path, value: Value): void;

  function set(path, value?: any) {
    if (isDictionary(state) && path) {
      const segments = splitPath(path);

      return Object.create(
        Object.getPrototypeOf(state),
        Object.getOwnPropertyDescriptors(state)
      ) as State;
    } else {
      state = value;
    }
  }

  return {
    get,
    set,
    use(path) {
      const value = this.get(path);
      const setValue = (newValue) => this.set(path, newValue);
      return [value, setValue];
    },
  };
}

class Store<State extends Record<PropertyKey, any>> {
  private state: State;

  constructor(state: State) {
    this.state = state;
  }

  get = (path?: Keys<State>) => {
    if (path) {
      const segments = splitPath(path);
      return resolveSegment(this.state, segments);
    }

    return this.state;
  };

  set(value: State): void;
  set<Path extends Keys<State>, Value extends ResolvePath<State, Path>>(
    path: Path,
    value: Value
  ): void;
  set(path: any, value?: any) {
    if (isDictionary(this.state) && path) {
      const segments = splitPath(path);
      const last = segments.pop();
      const parent = resolveSegment(this.state, segments);
      parent[last] = value;
    } else {
      this.state = value;
    }
  }

  use(path?: Keys<State>) {
    const value = this.get(path);
    const setValue = (newValue: any) => this.set(path, newValue);
    return [value, setValue] as const;
  }
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
    },
  },
});

const { get, set, use } = store;

const address = store.get("location.address");
const storeCopy = store.get();
const [storeUse, setStoreUse] = store.use();
const [state, setState] = store.use("location.state");
store.set("location.state", "CA");
