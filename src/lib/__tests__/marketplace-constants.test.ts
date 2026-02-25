import { describe, it, expect } from "vitest";
import {
  conditionLabels,
  conditionColors,
  normalizeShippingMode,
} from "../marketplace-constants";

describe("conditionLabels", () => {
  it("has all expected conditions", () => {
    expect(conditionLabels.novo).toBe("Novo");
    expect(conditionLabels.usado_excelente).toBe("Excelente");
    expect(conditionLabels.usado_bom).toBe("Bom");
    expect(conditionLabels.usado_regular).toBe("Regular");
  });
});

describe("conditionColors", () => {
  it("has color classes for each condition", () => {
    Object.keys(conditionLabels).forEach((key) => {
      expect(conditionColors[key]).toBeDefined();
    });
  });
});

describe("normalizeShippingMode", () => {
  it("maps seller_ships → direct", () => {
    expect(normalizeShippingMode("seller_ships")).toBe("direct");
  });

  it("maps hub → bravenza", () => {
    expect(normalizeShippingMode("hub")).toBe("bravenza");
  });

  it("returns value as-is for other modes", () => {
    expect(normalizeShippingMode("direct")).toBe("direct");
    expect(normalizeShippingMode("bravenza")).toBe("bravenza");
  });

  it("defaults to direct for undefined", () => {
    expect(normalizeShippingMode(undefined)).toBe("direct");
  });
});
