import { supabase } from "@/integrations/supabase/client";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const ACTION_TO_FUNCTION: Record<string, string> = {
  // mk-hub: Listings CRUD, Favorites, Seller Profiles
  "listings": "mk-hub", "listing-detail": "mk-hub", "my-listings": "mk-hub",
  "create-listing": "mk-hub", "update-listing": "mk-hub", "delete-listing": "mk-hub",
  "toggle-favorite": "mk-hub", "seller-profile": "mk-hub", "seller-public-profile": "mk-hub",

  // mk-offers: Offers, Negotiation, Bundle
  "make-offer": "mk-offers", "listing-offers": "mk-offers", "my-offers": "mk-offers",
  "respond-offer": "mk-offers", "accept-counter": "mk-offers", "reject-counter": "mk-offers",
  "bundle-offer": "mk-offers", "negotiation-timeline": "mk-offers", "expire-offers": "mk-offers",

  // mk-catalog: Catalog CRUD, Watchlist
  "catalog-products": "mk-catalog", "catalog-product": "mk-catalog", "catalog-offers": "mk-catalog",
  "catalog-search": "mk-catalog", "catalog-create-product": "mk-catalog", "catalog-create-offer": "mk-catalog",
  "watchlist-check": "mk-catalog", "watchlist-toggle": "mk-catalog",

  // mk-engage: Comments, Reviews, Product Analytics
  "product-comments": "mk-engage", "product-comment": "mk-engage",
  "product-reviews": "mk-engage", "product-review": "mk-engage",
  "check-purchase": "mk-engage", "product-analytics": "mk-engage",

  // mk-discover: Freight, Activity, Price History, Recs, Searches, Drops, Admin Mod, Coupons
  "freight-quote": "mk-discover", "activity-feed": "mk-discover", "log-activity": "mk-discover",
  "price-history": "mk-discover", "recommendations": "mk-discover",
  "saved-searches": "mk-discover", "save-search": "mk-discover", "delete-saved-search": "mk-discover",
  "drop-reminders": "mk-discover", "toggle-drop-reminder": "mk-discover",
  "admin-flag-listing": "mk-discover", "admin-pending-offers": "mk-discover", "admin-moderate-offer": "mk-discover",
  "product-coupons": "mk-discover",

  // mk-orders: Create, Payment, My Orders/Sales, Rate, Wallet
  "create-order": "mk-orders", "confirm-payment": "mk-orders", "my-orders": "mk-orders",
  "my-sales": "mk-orders", "rate-seller": "mk-orders",
  "wallet-balance": "mk-orders", "wallet-transactions": "mk-orders",

  // mk-order-ops: Status Updates, Admin Orders, Disputes, Cancel
  "update-order-status": "mk-order-ops", "admin-orders": "mk-order-ops",
  "admin-disputes": "mk-order-ops", "cancel-buyer-order": "mk-order-ops",

  // mk-fulfill: Disputes, Chat, Hub PRO, Inspection, Laudo, Auto-payout
  "open-dispute": "mk-fulfill", "resolve-dispute": "mk-fulfill",
  "chat-messages": "mk-fulfill", "send-message": "mk-fulfill",
  "hub-orders": "mk-fulfill", "hub-update-status": "mk-fulfill", "hub-inspect": "mk-fulfill",
  "laudo-lookup": "mk-fulfill", "check-auto-payout": "mk-fulfill",

  // mk-seller: Onboarding, Tier, Leaderboard, Strikes
  "seller-onboarding": "mk-seller", "seller-onboarding-status": "mk-seller",
  "seller-tier-info": "mk-seller", "recalc-seller-tier": "mk-seller",
  "seller-leaderboard": "mk-seller", "my-strikes": "mk-seller", "appeal-strike": "mk-seller",

  // mk-seller-data: Analytics, Price Drop
  "seller-analytics": "mk-seller-data", "price-drop-suggestions": "mk-seller-data",

  // mk-store: Coupons, Boosts, Storefront, KYC, Snapshot
  "my-coupons": "mk-store", "create-coupon": "mk-store",
  "update-coupon": "mk-store", "delete-coupon": "mk-store", "validate-coupon": "mk-store",
  "use-coupon": "mk-store", "boost-activate": "mk-store", "boost-deactivate": "mk-store",
  "my-boosts": "mk-store", "update-storefront": "mk-store", "my-storefront": "mk-store",
  "review-kyc": "mk-store", "snapshot-prices": "mk-store",

  // mk-social: Collections, Follow, Badges, Loyalty
  "my-collections": "mk-social", "create-collection": "mk-social",
  "update-collection": "mk-social", "delete-collection": "mk-social",
  "toggle-follow": "mk-social", "is-following": "mk-social", "my-follows": "mk-social",
  "loyalty-balance": "mk-social", "check-badges": "mk-social",
};

export async function marketplaceRequest(
  _cpf: string,
  action: string,
  method: string = "GET",
  body?: any,
  extraParams?: Record<string, string>
) {
  const fnName = ACTION_TO_FUNCTION[action] || "mk-hub";
  const params = new URLSearchParams({ action, ...extraParams });
  const url = `${FUNCTION_BASE}/${fnName}?${params}`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

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
