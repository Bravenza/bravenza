import { supabase } from "@/integrations/supabase/client";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const ACTION_TO_FUNCTION: Record<string, string> = {
  // mk-hub: Catalog, Listings, Search, Offers/Negotiation, Product interactions
  "listings": "mk-hub", "listing-detail": "mk-hub", "my-listings": "mk-hub",
  "create-listing": "mk-hub", "update-listing": "mk-hub", "delete-listing": "mk-hub",
  "toggle-favorite": "mk-hub", "seller-profile": "mk-hub", "seller-public-profile": "mk-hub",
  "make-offer": "mk-hub", "listing-offers": "mk-hub", "my-offers": "mk-hub", "respond-offer": "mk-hub",
  "accept-counter": "mk-hub", "reject-counter": "mk-hub",
  "bundle-offer": "mk-hub", "negotiation-timeline": "mk-hub", "expire-offers": "mk-hub",
  "activity-feed": "mk-hub", "log-activity": "mk-hub",
  "price-history": "mk-hub", "recommendations": "mk-hub",
  "saved-searches": "mk-hub", "save-search": "mk-hub", "delete-saved-search": "mk-hub",
  "drop-reminders": "mk-hub", "toggle-drop-reminder": "mk-hub",
  "catalog-products": "mk-hub", "catalog-product": "mk-hub", "catalog-offers": "mk-hub",
  "catalog-search": "mk-hub", "catalog-create-product": "mk-hub", "catalog-create-offer": "mk-hub",
  "watchlist-check": "mk-hub", "watchlist-toggle": "mk-hub",
  "product-comments": "mk-hub", "product-comment": "mk-hub",
  "product-reviews": "mk-hub", "product-review": "mk-hub",
  "check-purchase": "mk-hub", "product-analytics": "mk-hub", "freight-quote": "mk-hub",

  // mk-orders: Orders, Payments, Disputes, Chat, Hub PRO
  "create-order": "mk-orders", "confirm-payment": "mk-orders", "my-orders": "mk-orders",
  "my-sales": "mk-orders", "update-order-status": "mk-orders", "resolve-dispute": "mk-orders",
  "rate-seller": "mk-orders", "admin-orders": "mk-orders", "open-dispute": "mk-orders",
  "admin-disputes": "mk-orders",
  "chat-messages": "mk-orders", "send-message": "mk-orders",
  "hub-orders": "mk-orders", "hub-update-status": "mk-orders", "hub-inspect": "mk-orders",
  "laudo-lookup": "mk-orders", "check-auto-payout": "mk-orders",

  // mk-seller: Seller Onboarding, Analytics, Coupons, Boosts, Collections, Social
  "seller-onboarding": "mk-seller", "seller-onboarding-status": "mk-seller",
  "price-drop-suggestions": "mk-seller",
  "seller-analytics": "mk-seller", "my-coupons": "mk-seller", "create-coupon": "mk-seller",
  "update-coupon": "mk-seller", "delete-coupon": "mk-seller", "validate-coupon": "mk-seller",
  "use-coupon": "mk-seller",
  "update-storefront": "mk-seller", "snapshot-prices": "mk-seller",
  "recalc-seller-tier": "mk-seller", "seller-tier-info": "mk-seller",
  "boost-activate": "mk-seller", "boost-deactivate": "mk-seller", "my-boosts": "mk-seller",
  "my-collections": "mk-seller", "create-collection": "mk-seller",
  "update-collection": "mk-seller", "delete-collection": "mk-seller",
  "toggle-follow": "mk-seller", "is-following": "mk-seller", "my-follows": "mk-seller",
  "loyalty-balance": "mk-seller", "seller-leaderboard": "mk-seller", "check-badges": "mk-seller",
};

export async function marketplaceRequest(
  _cpf: string,
  action: string,
  method: string = "GET",
  body?: any,
  extraParams?: Record<string, string>
) {
  const fnName = ACTION_TO_FUNCTION[action] || "marketplace-listings";
  const params = new URLSearchParams({ action, ...extraParams });
  const url = `${FUNCTION_BASE}/${fnName}?${params}`;

  // Get current session JWT token for authenticated requests
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  // Send JWT token for authentication (replaces x-client-cpf header trust)
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro na requisição");
  }

  return res.json();
}

/**
 * Build authenticated headers for mk-hub requests.
 * Use this helper in components that call mk-hub directly (outside marketplaceRequest).
 */
export async function getMarketplaceHeaders(): Promise<Record<string, string>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}
