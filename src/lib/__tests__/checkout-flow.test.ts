import { describe, it, expect } from "vitest";
import {
  calcCardTotal,
  getSurchargePercent,
  calcProtectionEnd,
  validateOrderStatuses,
  consolidateOrderTotal,
  MP_RATES,
} from "../checkout-logic";

describe("calcCardTotal", () => {
  it("returns base amount for 1x (no interest)", () => {
    expect(calcCardTotal(1000, 1)).toBe(1000);
  });

  it("applies correct interest for 12x", () => {
    const base = 1000;
    const rate = MP_RATES[12]; // 0.2211
    const expected = Math.round((base / (1 - rate)) * 100) / 100;
    expect(calcCardTotal(base, 12)).toBe(expected);
  });

  it("applies correct interest for 6x", () => {
    const base = 500;
    const rate = MP_RATES[6]; // 0.1432
    const expected = Math.round((base / (1 - rate)) * 100) / 100;
    expect(calcCardTotal(base, 6)).toBe(expected);
  });

  it("card total is always >= base for all installments", () => {
    for (let i = 1; i <= 12; i++) {
      expect(calcCardTotal(1000, i)).toBeGreaterThanOrEqual(1000);
    }
  });

  it("returns base amount when installments within interest-free tier", () => {
    expect(calcCardTotal(1000, 3, 6)).toBe(1000);
    expect(calcCardTotal(1000, 6, 6)).toBe(1000);
  });

  it("applies interest when installments exceed interest-free tier", () => {
    const result = calcCardTotal(1000, 7, 6);
    expect(result).toBeGreaterThan(1000);
  });
});

describe("getSurchargePercent", () => {
  it("returns 0 for interestFreeMax <= 0", () => {
    expect(getSurchargePercent(0)).toBe(0);
    expect(getSurchargePercent(-1)).toBe(0);
  });

  it("returns 5% for tier up to 3x", () => {
    expect(getSurchargePercent(1)).toBe(5);
    expect(getSurchargePercent(2)).toBe(5);
    expect(getSurchargePercent(3)).toBe(5);
  });

  it("returns 10% for tier up to 6x", () => {
    expect(getSurchargePercent(4)).toBe(10);
    expect(getSurchargePercent(6)).toBe(10);
  });

  it("returns 14% for tier up to 10x", () => {
    expect(getSurchargePercent(7)).toBe(14);
    expect(getSurchargePercent(10)).toBe(14);
  });

  it("returns 18% for tier up to 12x", () => {
    expect(getSurchargePercent(11)).toBe(18);
    expect(getSurchargePercent(12)).toBe(18);
  });

  it("returns 18% for values above 12", () => {
    expect(getSurchargePercent(15)).toBe(18);
  });
});

describe("calcProtectionEnd", () => {
  it("returns a date 8 business days in the future", () => {
    // Monday 2026-03-02
    const from = new Date("2026-03-02T12:00:00Z");
    const result = new Date(calcProtectionEnd(from));
    // 8 business days from Mon Mar 2: Mar 12 (Thu)
    expect(result.getUTCDate()).toBe(12);
    expect(result.getUTCMonth()).toBe(2); // March
  });

  it("skips weekends correctly", () => {
    // Friday 2026-03-06
    const from = new Date("2026-03-06T12:00:00Z");
    const result = new Date(calcProtectionEnd(from));
    // 8 biz days from Fri: Mon9,Tue10,Wed11,Thu12,Fri13,Mon16,Tue17,Wed18
    expect(result.getUTCDate()).toBe(18);
  });

  it("returns valid ISO string", () => {
    const result = calcProtectionEnd(new Date("2026-01-05T10:00:00Z"));
    expect(() => new Date(result)).not.toThrow();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("validateOrderStatuses", () => {
  it("accepts all orders with pending_payment", () => {
    const orders = [
      { status: "pending_payment", order_code: "ORD-001" },
      { status: "pending_payment", order_code: "ORD-002" },
    ];
    const result = validateOrderStatuses(orders);
    expect(result.valid).toBe(true);
    expect(result.invalidCodes).toHaveLength(0);
  });

  it("rejects orders with status different from pending_payment", () => {
    const orders = [
      { status: "pending_payment", order_code: "ORD-001" },
      { status: "paid", order_code: "ORD-002" },
      { status: "cancelled", order_code: "ORD-003" },
    ];
    const result = validateOrderStatuses(orders);
    expect(result.valid).toBe(false);
    expect(result.invalidCodes).toEqual(["ORD-002", "ORD-003"]);
  });

  it("rejects all non-pending orders", () => {
    const orders = [{ status: "shipped", order_code: "ORD-001" }];
    const result = validateOrderStatuses(orders);
    expect(result.valid).toBe(false);
    expect(result.invalidCodes).toEqual(["ORD-001"]);
  });
});

describe("consolidateOrderTotal", () => {
  it("sums sale_price + shipping_cost + authentication_fee", () => {
    const orders = [
      { sale_price: 500, shipping_cost: 30, authentication_fee: 20 },
      { sale_price: 300, shipping_cost: 25, authentication_fee: 15 },
    ];
    expect(consolidateOrderTotal(orders)).toBe(890);
  });

  it("handles missing fields as zero", () => {
    const orders = [
      { sale_price: 100 },
      { shipping_cost: 50 },
      {},
    ];
    expect(consolidateOrderTotal(orders)).toBe(150);
  });

  it("returns 0 for empty array", () => {
    expect(consolidateOrderTotal([])).toBe(0);
  });

  it("handles single order correctly", () => {
    const orders = [{ sale_price: 1000, shipping_cost: 50, authentication_fee: 30 }];
    expect(consolidateOrderTotal(orders)).toBe(1080);
  });
});
