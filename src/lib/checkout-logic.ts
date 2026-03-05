/**
 * Pure business logic extracted from mkv2-checkout edge function.
 * These functions are testable without Deno or network dependencies.
 */

/** Mercado Pago interest rates by installment count */
export const MP_RATES: Record<number, number> = {
  1: 0, 2: 0.0964, 3: 0.1123, 4: 0.1136, 5: 0.1431, 6: 0.1432,
  7: 0.1672, 8: 0.1673, 9: 0.1969, 10: 0.2065, 11: 0.2066, 12: 0.2211,
};

/** Installment surcharge tiers (seller absorbs this to offer interest-free) */
export const INSTALLMENT_SURCHARGES: Record<number, number> = {
  3: 5, 6: 10, 10: 14, 12: 18,
};

/** Get surcharge percent for a given interest_free_installments tier */
export function getSurchargePercent(interestFreeMax: number): number {
  if (interestFreeMax <= 0) return 0;
  const tiers = [3, 6, 10, 12];
  for (const t of tiers) {
    if (interestFreeMax <= t) return INSTALLMENT_SURCHARGES[t];
  }
  return INSTALLMENT_SURCHARGES[12];
}

/** Calculate card total with interest: amount / (1 - rate) */
export function calcCardTotal(baseAmount: number, installments: number, interestFreeMax: number = 0): number {
  if (interestFreeMax > 0 && installments <= interestFreeMax) return baseAmount;
  const rate = MP_RATES[installments] || 0;
  if (rate === 0) return baseAmount;
  return Math.round((baseAmount / (1 - rate)) * 100) / 100;
}

/** Calculate protection end: 8 business days from a given date */
export function calcProtectionEnd(from: Date = new Date()): string {
  const d = new Date(from);
  let biz = 0;
  while (biz < 8) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) biz++;
  }
  return d.toISOString();
}

/** Validate that all orders have pending_payment status */
export function validateOrderStatuses(orders: { status: string; order_code?: string }[]): {
  valid: boolean;
  invalidCodes: string[];
} {
  const invalid = orders.filter(o => o.status !== "pending_payment");
  return {
    valid: invalid.length === 0,
    invalidCodes: invalid.map(o => o.order_code || "unknown"),
  };
}

/** Consolidate total amount from multiple orders */
export function consolidateOrderTotal(
  orders: { sale_price?: number; shipping_cost?: number; authentication_fee?: number }[]
): number {
  return orders.reduce((sum, o) => {
    return sum + (o.sale_price || 0) + (o.shipping_cost || 0) + (o.authentication_fee || 0);
  }, 0);
}
