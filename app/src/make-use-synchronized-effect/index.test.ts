import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeUseSynchronizedEffect } from ".";

vi.mock("./deep-sort", () => ({
  deepSort: vi.fn((deps) => deps),
}));

describe("makeUseSynchronizedEffect", () => {
  const useSynchronizedEffect = makeUseSynchronizedEffect();

  it("should call effect when dependencies change", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ deps, enabled }) => useSynchronizedEffect(effect, deps, enabled),
      {
        initialProps: { deps: [1], enabled: true },
      }
    );

    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ deps: [2], enabled: true });
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("should not call effect when enabled is false", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ deps, enabled }) => useSynchronizedEffect(effect, deps, enabled),
      {
        initialProps: { deps: [1], enabled: false },
      }
    );

    expect(effect).not.toHaveBeenCalled();

    rerender({ deps: [2], enabled: false });
    expect(effect).not.toHaveBeenCalled();
  });

  it("should call effect when enabled changes to true", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ deps, enabled }) => useSynchronizedEffect(effect, deps, enabled),
      {
        initialProps: { deps: [1], enabled: false },
      }
    );

    expect(effect).not.toHaveBeenCalled();

    rerender({ deps: [1], enabled: true });
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("should create a unique key for dependencies", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ deps, enabled }) => useSynchronizedEffect(effect, deps, enabled),
      {
        initialProps: { deps: [1, 2], enabled: true },
      }
    );

    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ deps: [2, 1], enabled: true });
    expect(effect).toHaveBeenCalledTimes(2);
  });
});
