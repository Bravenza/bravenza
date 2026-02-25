import { describe, it, expect } from "vitest";
import {
  formatCPF,
  cleanCPF,
  validateCPF,
  formatPhone,
  cleanPhone,
  validatePhone,
  validateEmail,
  formatCurrency,
  formatDate,
  formatDateTime,
  generateOrderId,
  getStatusIndex,
  isStatusCompleted,
  isStatusActive,
  mapLegacyStatus,
  VAULT_STATUSES,
} from "../constants";

describe("CPF utilities", () => {
  it("formatCPF formats 11 digits correctly", () => {
    expect(formatCPF("12345678901")).toBe("123.456.789-01");
  });

  it("formatCPF handles partial input", () => {
    expect(formatCPF("123")).toBe("123");
    expect(formatCPF("1234")).toBe("123.4");
    expect(formatCPF("1234567")).toBe("123.456.7");
  });

  it("cleanCPF strips non-digits", () => {
    expect(cleanCPF("123.456.789-01")).toBe("12345678901");
  });

  it("validateCPF accepts valid CPF", () => {
    // Known valid CPF: 529.982.247-25
    expect(validateCPF("52998224725")).toBe(true);
  });

  it("validateCPF rejects all same digits", () => {
    expect(validateCPF("11111111111")).toBe(false);
  });

  it("validateCPF rejects wrong length", () => {
    expect(validateCPF("1234")).toBe(false);
  });

  it("validateCPF rejects invalid check digits", () => {
    expect(validateCPF("12345678900")).toBe(false);
  });
});

describe("Phone utilities", () => {
  it("formatPhone formats 11-digit mobile", () => {
    expect(formatPhone("11999887766")).toBe("(11) 99988-7766");
  });

  it("formatPhone formats 10-digit landline", () => {
    expect(formatPhone("1133445566")).toBe("(11) 3344-5566");
  });

  it("cleanPhone strips non-digits", () => {
    expect(cleanPhone("(11) 99988-7766")).toBe("11999887766");
  });

  it("validatePhone accepts 10 or 11 digits", () => {
    expect(validatePhone("11999887766")).toBe(true);
    expect(validatePhone("1133445566")).toBe(true);
    expect(validatePhone("123")).toBe(false);
  });
});

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("a.b@c.d")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("@no-user.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
  });
});

describe("formatCurrency", () => {
  it("formats BRL by default", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1.234,50");
  });

  it("supports other currencies", () => {
    const result = formatCurrency(100, "USD");
    expect(result).toContain("100");
  });
});

describe("formatDate / formatDateTime", () => {
  it("formats date as dd/mm/yyyy", () => {
    const result = formatDate("2025-06-15T10:30:00Z");
    expect(result).toMatch(/15\/06\/2025/);
  });

  it("formatDateTime includes time", () => {
    const result = formatDateTime("2025-06-15T10:30:00Z");
    expect(result).toMatch(/15\/06\/2025/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("generateOrderId", () => {
  it("follows BV-DDMMYY-NNN pattern", () => {
    const id = generateOrderId();
    expect(id).toMatch(/^BV-\d{6}-\d{3}$/);
  });

  it("generates different IDs", () => {
    const ids = new Set(Array.from({ length: 20 }, generateOrderId));
    // High probability of uniqueness
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe("Order status helpers", () => {
  it("getStatusIndex returns correct index", () => {
    expect(getStatusIndex("REQUEST_RECEIVED")).toBe(0);
    expect(getStatusIndex("DELIVERED")).toBe(VAULT_STATUSES.length - 1);
    expect(getStatusIndex("UNKNOWN")).toBe(-1);
  });

  it("isStatusCompleted checks correctly", () => {
    expect(isStatusCompleted("PRODUCT_FOUND", "REQUEST_RECEIVED")).toBe(true);
    expect(isStatusCompleted("REQUEST_RECEIVED", "DELIVERED")).toBe(false);
  });

  it("isStatusActive checks equality", () => {
    expect(isStatusActive("BUDGET_SENT", "BUDGET_SENT")).toBe(true);
    expect(isStatusActive("BUDGET_SENT", "DELIVERED")).toBe(false);
  });

  it("mapLegacyStatus maps old statuses", () => {
    expect(mapLegacyStatus("SOURCING")).toBe("SEARCH_SELECTION");
    expect(mapLegacyStatus("DISPATCHED")).toBe("SHIPPED_TO_CLIENT");
    expect(mapLegacyStatus("DELIVERED")).toBe("DELIVERED"); // no mapping
  });
});
