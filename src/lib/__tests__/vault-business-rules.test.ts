/**
 * Vault Club Business Rules Tests
 *
 * Covers: loyalty points accumulation, tier progression,
 * and gamification rules as documented in memory.
 */
import { describe, it, expect } from "vitest";

// ─── Loyalty tier logic (mirrored from LoyaltyPointsWidget) ───
function tierFromBalance(bal: number) {
  if (bal >= 10000) return { label: "Platinum", nextTier: "", nextAt: 0 };
  if (bal >= 5000) return { label: "Gold", nextTier: "Platinum", nextAt: 10000 };
  if (bal >= 2000) return { label: "Silver", nextTier: "Gold", nextAt: 5000 };
  return { label: "Bronze", nextTier: "Silver", nextAt: 2000 };
}

// ─── Points calculation (1pt per R$1, 1.5x for Vault members) ───
function calculatePoints(amountBRL: number, isVaultMember: boolean): number {
  const base = Math.floor(amountBRL);
  return isVaultMember ? Math.floor(base * 1.5) : base;
}

// ─── Review Mode rule: 5 consecutive rejections → 30-day suspension ───
function shouldTriggerReviewMode(consecutiveRejections: number): boolean {
  return consecutiveRejections >= 5;
}

// ─── Vault tier SLA (hours) ───
const TIER_SLA: Record<string, { standard: number; complex: number; technical: number }> = {
  access: { standard: 24, complex: 72, technical: 48 },
  privilege: { standard: 12, complex: 48, technical: 24 },
  black: { standard: 6, complex: 24, technical: 12 },
};

describe("Loyalty Tier Progression", () => {
  it("starts at Bronze with balance 0", () => {
    expect(tierFromBalance(0).label).toBe("Bronze");
  });

  it("reaches Silver at 2000 points", () => {
    expect(tierFromBalance(2000).label).toBe("Silver");
  });

  it("stays Bronze at 1999 points", () => {
    expect(tierFromBalance(1999).label).toBe("Bronze");
  });

  it("reaches Gold at 5000 points", () => {
    expect(tierFromBalance(5000).label).toBe("Gold");
  });

  it("reaches Platinum at 10000 points", () => {
    expect(tierFromBalance(10000).label).toBe("Platinum");
  });

  it("Platinum has no next tier", () => {
    const tier = tierFromBalance(15000);
    expect(tier.nextTier).toBe("");
    expect(tier.nextAt).toBe(0);
  });

  it("Bronze next tier is Silver at 2000", () => {
    const tier = tierFromBalance(500);
    expect(tier.nextTier).toBe("Silver");
    expect(tier.nextAt).toBe(2000);
  });
});

describe("Points Accumulation", () => {
  it("non-Vault member earns 1pt per R$1", () => {
    expect(calculatePoints(100, false)).toBe(100);
  });

  it("Vault member earns 1.5x points", () => {
    expect(calculatePoints(100, true)).toBe(150);
  });

  it("floors fractional amounts", () => {
    expect(calculatePoints(99.99, false)).toBe(99);
    expect(calculatePoints(99.99, true)).toBe(148); // floor(99 * 1.5) = 148
  });

  it("zero purchase = zero points", () => {
    expect(calculatePoints(0, false)).toBe(0);
    expect(calculatePoints(0, true)).toBe(0);
  });

  it("large purchase calculates correctly", () => {
    expect(calculatePoints(5000, true)).toBe(7500);
  });
});

describe("Review Mode (anti-tourism)", () => {
  it("triggers after 5 consecutive rejections", () => {
    expect(shouldTriggerReviewMode(5)).toBe(true);
  });

  it("does not trigger at 4 rejections", () => {
    expect(shouldTriggerReviewMode(4)).toBe(false);
  });

  it("triggers at more than 5", () => {
    expect(shouldTriggerReviewMode(10)).toBe(true);
  });

  it("does not trigger at 0", () => {
    expect(shouldTriggerReviewMode(0)).toBe(false);
  });
});

describe("Vault Tier SLA Compliance", () => {
  it("Access tier has 24h standard SLA", () => {
    expect(TIER_SLA.access.standard).toBe(24);
  });

  it("Black tier has fastest SLAs", () => {
    expect(TIER_SLA.black.standard).toBeLessThan(TIER_SLA.privilege.standard);
    expect(TIER_SLA.black.complex).toBeLessThan(TIER_SLA.privilege.complex);
    expect(TIER_SLA.black.technical).toBeLessThan(TIER_SLA.privilege.technical);
  });

  it("SLA decreases as tier increases", () => {
    const tiers = ["access", "privilege", "black"];
    for (let i = 1; i < tiers.length; i++) {
      expect(TIER_SLA[tiers[i]].standard).toBeLessThan(TIER_SLA[tiers[i - 1]].standard);
    }
  });

  it("complex SLA is always the longest for each tier", () => {
    Object.values(TIER_SLA).forEach((sla) => {
      expect(sla.complex).toBeGreaterThanOrEqual(sla.standard);
      expect(sla.complex).toBeGreaterThanOrEqual(sla.technical);
    });
  });
});

describe("Points-to-Discount Conversion", () => {
  // 1 point = R$ 0.01
  const pointsToDiscount = (points: number) => points * 0.01;

  it("100 points = R$ 1.00 discount", () => {
    expect(pointsToDiscount(100)).toBeCloseTo(1.0);
  });

  it("10000 points = R$ 100.00 discount", () => {
    expect(pointsToDiscount(10000)).toBeCloseTo(100.0);
  });

  it("0 points = no discount", () => {
    expect(pointsToDiscount(0)).toBe(0);
  });
});
