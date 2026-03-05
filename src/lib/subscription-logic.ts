/**
 * Pure business logic extracted from mkv2-subscription-downgrade edge function.
 * These functions are testable without Deno or network dependencies.
 */

/** Determine which offer IDs to pause when downgrading to free (keep 5 most recent) */
export function getOfferIdsToPause(activeOfferIds: string[]): string[] {
  if (activeOfferIds.length <= 5) return [];
  return activeOfferIds.slice(5);
}

/** Map MercadoPago subscription status to internal status */
export function mapMpStatusToInternal(mpStatus: string): string {
  const mapping: Record<string, string> = {
    authorized: "active",
    paused: "paused",
    cancelled: "cancelled",
    pending: "pending",
  };
  return mapping[mpStatus] || "unknown";
}

/** Check if a subscription has expired based on effective end date */
export function isSubscriptionExpired(
  sub: {
    grace_period_end?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
  },
  now: Date = new Date()
): boolean {
  const effectiveEnd = sub.grace_period_end || sub.current_period_end;
  if (effectiveEnd && new Date(effectiveEnd) <= now) return true;
  if (sub.cancel_at_period_end && sub.current_period_end && new Date(sub.current_period_end) <= now) return true;
  return false;
}

/** Validate that a plan is not free (price > 0) for subscription creation */
export function validatePlanForSubscription(priceMonthly: number): {
  valid: boolean;
  error?: string;
} {
  if (priceMonthly <= 0) {
    return { valid: false, error: "Planos gratuitos não podem ser assinados" };
  }
  return { valid: true };
}
