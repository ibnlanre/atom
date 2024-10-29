import { describe, it, expect } from "vitest";
import { arraySort } from ".";

describe("arraySort", () => {
  it("should return 0 for equal values", () => {
    expect(arraySort(1, 1)).toBe(0);
    expect(arraySort("a", "a")).toBe(0);
    expect(arraySort({ a: 1 }, { a: 1 })).toBe(0);
  });

  it("should return a negative number if the first value is less than the second", () => {
    expect(arraySort(1, 2)).toBeLessThan(0);
    expect(arraySort("a", "b")).toBeLessThan(0);
    expect(arraySort({ a: 1 }, { b: 2 })).toBeLessThan(0);
  });

  it("should return a positive number if the first value is greater than the second", () => {
    expect(arraySort(2, 1)).toBeGreaterThan(0);
    expect(arraySort("b", "a")).toBeGreaterThan(0);
    expect(arraySort({ b: 2 }, { a: 1 })).toBeGreaterThan(0);
  });

  it("should handle complex objects", () => {
    const obj1 = { a: [1, 2, 3], b: { c: 4 } };
    const obj2 = { a: [1, 2, 3], b: { c: 5 } };
    expect(arraySort(obj1, obj2)).toBeLessThan(0);
  });

  it("should handle errors gracefully", () => {
    const circularObj: any = { a: 1 };
    circularObj.b = circularObj;
    expect(arraySort(circularObj, circularObj)).toBe(0);
  });
});
