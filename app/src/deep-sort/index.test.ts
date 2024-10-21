import { describe, expect, it } from "vitest";
import { deepSort } from "./index";

describe("deepSort", () => {
  it("should return null if input is null", () => {
    expect(deepSort(null)).toBeNull();
  });

  it("should return undefined if input is undefined", () => {
    expect(deepSort(undefined)).toBeUndefined();
  });

  it("should sort arrays of primitive values", () => {
    const input = [3, 1, 2];
    const expected = [1, 2, 3];
    expect(deepSort(input)).toEqual(expected);
  });

  it("should sort arrays of objects", () => {
    const input = [{ b: 2 }, { a: 1 }];
    const expected = [{ a: 1 }, { b: 2 }];
    expect(deepSort(input)).toEqual(expected);
  });

  it("should sort nested arrays and objects", () => {
    const input = [{ b: [3, 1, 2] }, { a: { d: 4, c: 3 } }];
    const expected = [{ a: { c: 3, d: 4 } }, { b: [1, 2, 3] }];
    expect(deepSort(input)).toEqual(expected);
  });

  it("should handle circular references gracefully", () => {
    const obj: any = { a: 1 };
    obj.b = obj;
    const result = deepSort(obj);
    expect(result).toEqual({ a: 1, b: obj });
  });

  it("should sort objects by keys", () => {
    const input = { b: 2, a: 1 };
    const expected = { a: 1, b: 2 };
    expect(deepSort(input)).toEqual(expected);
  });

  it("should not modify primitive values", () => {
    expect(deepSort(42)).toBe(42);
    expect(deepSort("string")).toBe("string");
    expect(deepSort(true)).toBe(true);
  });
});
