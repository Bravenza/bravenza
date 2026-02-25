import { describe, it, expect } from "vitest";
import { capitalizeWords, formatProductName } from "../text-utils";

describe("capitalizeWords", () => {
  it("capitalizes each word", () => {
    expect(capitalizeWords("nike air max")).toBe("Nike Air Max");
  });

  it("handles single word", () => {
    expect(capitalizeWords("adidas")).toBe("Adidas");
  });

  it("handles null/undefined", () => {
    expect(capitalizeWords(null)).toBe("");
    expect(capitalizeWords(undefined)).toBe("");
  });

  it("handles empty string", () => {
    expect(capitalizeWords("")).toBe("");
  });

  it("lowercases uppercase input first", () => {
    expect(capitalizeWords("NIKE AIR")).toBe("Nike Air");
  });
});

describe("formatProductName", () => {
  it("combines brand + model + color", () => {
    expect(formatProductName("nike", "air max 90", "White")).toBe("Nike Air Max 90 White");
  });

  it("handles missing parts", () => {
    expect(formatProductName("nike", null)).toBe("Nike");
    expect(formatProductName(null, "air max")).toBe("Air Max");
    expect(formatProductName(null, null)).toBe("");
  });
});
