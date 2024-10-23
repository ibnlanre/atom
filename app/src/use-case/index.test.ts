import { describe, expect, it } from "vitest";
import { useCase } from ".";

describe("useCase", () => {
  it("should convert the first character to use-case", () => {
    const result = useCase("hello");
    expect(result).toBe("useHello");
  });

  it("should handle an empty string", () => {
    const result = useCase("");
    expect(result).toBe("use");
  });

  it("should not change a string that starts with an use-case letter", () => {
    const result = useCase("Hello");
    expect(result).toBe("useHello");
  });

  it("should handle a single character string", () => {
    const result = useCase("h");
    expect(result).toBe("useH");
  });

  it("should handle strings with special characters", () => {
    const result = useCase("!hello");
    expect(result).toBe("use!hello");
  });
});
