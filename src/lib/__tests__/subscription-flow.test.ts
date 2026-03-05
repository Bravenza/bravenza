import { describe, it, expect } from "vitest";
import {
  getOfferIdsToPause,
  mapMpStatusToInternal,
  isSubscriptionExpired,
  validatePlanForSubscription,
} from "../subscription-logic";

describe("getOfferIdsToPause (downgrade to free)", () => {
  it("pauses nothing when 5 or fewer offers", () => {
    expect(getOfferIdsToPause(["a", "b", "c", "d", "e"])).toEqual([]);
    expect(getOfferIdsToPause(["a", "b"])).toEqual([]);
    expect(getOfferIdsToPause([])).toEqual([]);
  });

  it("pauses offers beyond the 5 most recent", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g"];
    const toPause = getOfferIdsToPause(ids);
    expect(toPause).toEqual(["f", "g"]);
  });

  it("pauses exactly N-5 offers", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `offer-${i}`);
    expect(getOfferIdsToPause(ids)).toHaveLength(5);
  });
});

describe("mapMpStatusToInternal", () => {
  it("maps authorized → active", () => {
    expect(mapMpStatusToInternal("authorized")).toBe("active");
  });

  it("maps paused → paused", () => {
    expect(mapMpStatusToInternal("paused")).toBe("paused");
  });

  it("maps cancelled → cancelled", () => {
    expect(mapMpStatusToInternal("cancelled")).toBe("cancelled");
  });

  it("maps pending → pending", () => {
    expect(mapMpStatusToInternal("pending")).toBe("pending");
  });

  it("returns unknown for unmapped statuses", () => {
    expect(mapMpStatusToInternal("something_else")).toBe("unknown");
  });
});

describe("isSubscriptionExpired", () => {
  const now = new Date("2026-03-05T12:00:00Z");

  it("returns true when grace_period_end is past", () => {
    expect(isSubscriptionExpired({
      grace_period_end: "2026-03-04T00:00:00Z",
      current_period_end: "2026-03-10T00:00:00Z",
    }, now)).toBe(true);
  });

  it("returns false when grace_period_end is future", () => {
    expect(isSubscriptionExpired({
      grace_period_end: "2026-03-10T00:00:00Z",
      current_period_end: "2026-03-01T00:00:00Z",
    }, now)).toBe(false);
  });

  it("falls back to current_period_end when no grace", () => {
    expect(isSubscriptionExpired({
      current_period_end: "2026-03-01T00:00:00Z",
    }, now)).toBe(true);
  });

  it("returns true when cancel_at_period_end and period ended", () => {
    expect(isSubscriptionExpired({
      cancel_at_period_end: true,
      current_period_end: "2026-03-04T00:00:00Z",
    }, now)).toBe(true);
  });

  it("returns false when cancel_at_period_end but period not ended", () => {
    expect(isSubscriptionExpired({
      cancel_at_period_end: true,
      current_period_end: "2026-03-10T00:00:00Z",
    }, now)).toBe(false);
  });
});

describe("validatePlanForSubscription", () => {
  it("rejects free plans (price <= 0)", () => {
    expect(validatePlanForSubscription(0).valid).toBe(false);
    expect(validatePlanForSubscription(-5).valid).toBe(false);
    expect(validatePlanForSubscription(0).error).toBeDefined();
  });

  it("accepts paid plans (price > 0)", () => {
    expect(validatePlanForSubscription(29.9).valid).toBe(true);
    expect(validatePlanForSubscription(99).valid).toBe(true);
    expect(validatePlanForSubscription(0.01).valid).toBe(true);
  });
});
