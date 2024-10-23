import { Context } from "vm";
import { AtomEvents } from "./types/AtomEvents";

function _atom<State>(state?: State) {
  type UseArgs = [];
  type GetArgs = [];

  type Data = State;

  function debug(value: boolean = false) {
    return that;
  }

  function context<Context extends Record<PropertyKey, unknown>>(
    value: Context
  ) {
    return that as That<State, Context, GetArgs, UseArgs, Data>;
  }

  function events<
    Value extends AtomEvents<State, Context, GetArgs, UseArgs, Data>,
  >(value: Value) {
    return that;
  }

  return that;
}

type That<
  State,
  Context extends Record<PropertyKey, unknown>,
  UseArgs extends ReadonlyArray<unknown>,
  GetArgs extends ReadonlyArray<unknown>,
  Data = State,
> = {
  context: (value: Context) => That<State, Context, GetArgs, UseArgs, Data>;
  events: <Value extends AtomEvents<State, Context, GetArgs, UseArgs, Data>>(
    value: Value
  ) => That<State, Context, GetArgs, UseArgs, Data>;
  debug: (value?: boolean) => That<State, Context, GetArgs, UseArgs, Data>;
};

function grimaldi<
  State,
  Context extends Record<PropertyKey, unknown>,
  UseArgs extends ReadonlyArray<unknown>,
  GetArgs extends ReadonlyArray<unknown>,
  Data = State,
>(value: That<State, Context, GetArgs, UseArgs, Data>) {
  return value;
}

function __atom<State>(state?: State) {
  const that = grimaldi({
    context(value) {
      return this;
    },
    events(value) {
      return this;
    },
    debug(value: boolean = false) {
      return this;
    },
  });
}

__atom("hello")
  .context({ hello: "world" })
  .events({
    set: ({ value, ctx }) => {
      ctx.hello;
      return value;
    },
  })
  .debug(true);

class Atom<
  State,
  UseArgs extends ReadonlyArray<unknown> = [],
  GetArgs extends ReadonlyArray<unknown> = [],
  Data = State,
> {
  #context: Record<PropertyKey, unknown> = {};

  constructor(state?: State) {
    return;
  }

  context = <Context extends Record<PropertyKey, unknown> = {}>(
    value: Context
  ): That<State, Context, GetArgs, UseArgs, Data> => {
    this.#context = value;
    return this;
  };

  events<(value) {
    return this;
  }

  debug = (value?: boolean) => {
    return this;
  };
}

function atomic<State>(state?: State) {
  return new Atom(state);
}

atomic("hello").context({}).events({}).debug(true);

const orderAtom = atomic({
  items: ["apple", "banana"],
  total: 0,
})
  .context({
    hello: "world",
  })
  .events({
    set: ({ value, ctx }) => {
      ctx.hello;
      //  ^?
      return value;
    },
  })
  .debug();

// const x = atom({
//   state: (ctx) => (ctx.id === "1" ? 1 : 0),
//   events: {
//     set: ({ value, ctx }) => (ctx.id === "1" ? value : 0),
//     get: ({ value }, id: string) => value,
//     use: ({ value, ctx, set, emit }, hello: string) => {
//       console.log("use", ctx.id);
//       return {
//         rerun: () => console.log("rerun"),
//         unmount: () => console.log("unmount"),
//       };
//     },
//   },
//   context: {
//     id: "1",
//   },
// });

// const cocoa = x.use({
//   select(data) {
//     return "hello";
//   },
//   useArgs: ["world"],
// });

// export const wallet_history_visible = atom({
//   state: false,
//   events: {
//     set: ({ value }) => {
//       try {
//         localStorage.setItem("wallet_history_visible", JSON.stringify(value));
//       } catch (e) {
//         console.error(e);
//       }
//       return value;
//     },
//     get: ({ value }) => {
//       try {
//         const local = localStorage.getItem("wallet_history_visible");
//         if (local) return JSON.parse(local);
//       } catch (e) {
//         console.error(e);
//       }
//       return value;
//     },
//   },
// });
