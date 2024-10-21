import { describe, expect, it, vi } from "vitest";

import { getComputedState } from ".";
import { isFunction } from "../is-function";

vi.mock("./is-set-state-function");
const isFunctionMock = vi.mocked(isFunction);

describe("getComputedState", () => {
  it("should return the initial state if it is not a function", () => {
    const initialState = 5;
    const previousState = 10;
    isFunctionMock.mockReturnValue(false);

    const result = getComputedState(initialState, previousState);
    expect(result).toBe(initialState);
  });

  it("should return the result of the initial state function if it is a function", () => {
    const initialState = (prevState: number) => prevState + 1;
    const previousState = 10;
    isFunctionMock.mockReturnValue(true);

    const result = getComputedState(initialState, previousState);
    expect(result).toBe(11);
  });

  it("should handle string state correctly", () => {
    const initialState = "initial";
    const previousState = "previous";
    isFunctionMock.mockReturnValue(false);

    const result = getComputedState(initialState, previousState);
    expect(result).toBe(initialState);
  });

  it("should handle boolean state correctly", () => {
    const initialState = true;
    const previousState = false;
    isFunctionMock.mockReturnValue(false);

    const result = getComputedState(initialState, previousState);
    expect(result).toBe(initialState);
  });

  it("should handle function state correctly with complex logic", () => {
    const initialState = (prevState: { count: number }) => ({
      count: prevState.count + 1,
    });
    const previousState = { count: 10 };
    isFunctionMock.mockReturnValue(true);

    const result = getComputedState(initialState, previousState);
    expect(result).toEqual({ count: 11 });
  });
});
