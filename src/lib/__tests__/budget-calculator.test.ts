import { describe, it, expect } from "vitest";
import {
  roundUpTo90,
  calculateProductPrice,
  calculateCardTotal,
  calculateInstallmentValue,
  generateInstallmentOptions,
  calculateFullBudget,
  formatPriceBR,
  DEFAULT_MULTIPLIER,
  MERCADO_PAGO_RATES,
} from "../budget-calculator";

describe("roundUpTo90", () => {
  it("rounds 1047.12 → 1047.90", () => {
    expect(roundUpTo90(1047.12)).toBe(1047.90);
  });

  it("keeps 1047.90 unchanged", () => {
    expect(roundUpTo90(1047.90)).toBe(1047.90);
  });

  it("rounds 1047.91 → 1048.90", () => {
    expect(roundUpTo90(1047.91)).toBe(1048.90);
  });

  it("rounds 0.10 → 0.90", () => {
    expect(roundUpTo90(0.10)).toBe(0.90);
  });

  it("rounds 999.99 → 1000.90", () => {
    expect(roundUpTo90(999.99)).toBe(1000.90);
  });

  it("rounds whole numbers correctly", () => {
    expect(roundUpTo90(100)).toBe(100.90);
  });

  it("handles zero", () => {
    expect(roundUpTo90(0)).toBe(0.90);
  });
});

describe("calculateProductPrice", () => {
  it("applies default multiplier 1.36 and rounds to .90", () => {
    const cost = 500;
    const raw = cost * DEFAULT_MULTIPLIER; // 680
    const expected = roundUpTo90(raw);
    expect(calculateProductPrice(cost)).toBe(expected);
  });

  it("uses custom multiplier", () => {
    const price = calculateProductPrice(100, 2);
    // 100 * 2 = 200 → 200.90
    expect(price).toBe(200.90);
  });

  it("handles zero cost", () => {
    expect(calculateProductPrice(0)).toBe(0.90);
  });
});

describe("calculateCardTotal", () => {
  it("returns same as base for 1x (no interest)", () => {
    const base = 680.90;
    const total = calculateCardTotal(base, 1);
    // rate = 0, so 680.90 / 1 = 680.90 → roundUpTo90 = 680.90
    expect(total).toBe(680.90);
  });

  it("applies interest rate for 12x", () => {
    const base = 1000.90;
    const rate = MERCADO_PAGO_RATES[12]; // 0.2211
    const expectedRaw = base / (1 - rate);
    const expected = roundUpTo90(expectedRaw);
    expect(calculateCardTotal(base, 12)).toBe(expected);
  });

  it("card total is always >= base price", () => {
    const base = 500.90;
    for (let i = 1; i <= 12; i++) {
      expect(calculateCardTotal(base, i)).toBeGreaterThanOrEqual(base);
    }
  });
});

describe("calculateInstallmentValue", () => {
  it("divides total by installments and rounds up to 2 decimals", () => {
    // 1000 / 3 = 333.333... → ceil to 333.34
    expect(calculateInstallmentValue(1000, 3)).toBe(333.34);
  });

  it("exact division stays exact", () => {
    expect(calculateInstallmentValue(1200, 4)).toBe(300);
  });
});

describe("generateInstallmentOptions", () => {
  it("returns 12 options", () => {
    const options = generateInstallmentOptions(1000.90);
    expect(options).toHaveLength(12);
  });

  it("1x has 0% interest", () => {
    const options = generateInstallmentOptions(1000.90);
    expect(options[0].interestRate).toBe(0);
  });

  it("installment values are positive", () => {
    const options = generateInstallmentOptions(500.90);
    options.forEach((o) => {
      expect(o.installmentValue).toBeGreaterThan(0);
      expect(o.totalWithInterest).toBeGreaterThan(0);
    });
  });

  it("total with interest increases with more installments", () => {
    const options = generateInstallmentOptions(1000.90);
    // Generally monotonically non-decreasing
    for (let i = 1; i < options.length; i++) {
      expect(options[i].totalWithInterest).toBeGreaterThanOrEqual(options[0].totalWithInterest);
    }
  });
});

describe("formatPriceBR", () => {
  it("formats in BRL", () => {
    const formatted = formatPriceBR(1234.56);
    expect(formatted).toContain("1.234,56");
  });

  it("formats zero", () => {
    const formatted = formatPriceBR(0);
    expect(formatted).toContain("0,00");
  });
});

describe("calculateFullBudget", () => {
  it("returns consistent budget structure", () => {
    const budget = calculateFullBudget(500);
    expect(budget.totalCost).toBe(500);
    expect(budget.multiplier).toBe(DEFAULT_MULTIPLIER);
    expect(budget.productPrice).toBe(budget.pixPrice);
    expect(budget.cardOptions).toHaveLength(12);
    expect(budget.grossProfit).toBe(budget.productPrice - 500);
    expect(budget.profitMargin).toBeGreaterThan(0);
    expect(budget.profitMargin).toBeLessThan(100);
  });

  it("profit margin is ~26.5% for default multiplier", () => {
    const budget = calculateFullBudget(1000);
    // (1 - 1/1.36) * 100 ≈ 26.47%
    expect(budget.profitMargin).toBeGreaterThan(25);
    expect(budget.profitMargin).toBeLessThan(28);
  });

  it("handles zero cost without errors", () => {
    const budget = calculateFullBudget(0);
    expect(budget.productPrice).toBe(0.90);
    expect(budget.profitMargin).toBeGreaterThan(0);
  });
});
