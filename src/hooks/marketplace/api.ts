import { supabase } from "@/integrations/supabase/client";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const ACTION_TO_FUNCTION: Record<string, string> = {
  // mk-hub: Listings CRUD, Favorites, Seller Profiles, Offers/Negotiation
  "listings": "mk-hub", "listing-detail": "mk-hub", "my-listings": "mk-hub",
  "create-listing": "mk-hub", "update-listing": "mk-hub", "delete-listing": "mk-hub",
  "toggle-favorite": "mk-hub", "seller-profile": "mk-hub", "seller-public-profile": "mk-hub",
  "make-offer": "mk-hub", "listing-offers": "mk-hub", "my-offers": "mk-hub", "respond-offer": "mk-hub",
  "accept-counter": "mk-hub", "reject-counter": "mk-hub",
  "bundle-offer": "mk-hub", "negotiation-timeline": "mk-hub", "expire-offers": "mk-hub",

  // mk-catalog: Catalog, Watchlist, Comments, Reviews, Analytics, Freight, Activity, Recommendations, Saved Searches, Drop Reminders, Admin Moderation
  "catalog-products": "mk-catalog", "catalog-product": "mk-catalog", "catalog-offers": "mk-catalog",
  "catalog-search": "mk-catalog", "catalog-create-product": "mk-catalog", "catalog-create-offer": "mk-catalog",
  "watchlist-check": "mk-catalog", "watchlist-toggle": "mk-catalog",
  "product-comments": "mk-catalog", "product-comment": "mk-catalog",
  "product-reviews": "mk-catalog", "product-review": "mk-catalog",
  "check-purchase": "mk-catalog", "product-analytics": "mk-catalog", "freight-quote": "mk-catalog",
  "admin-flag-listing": "mk-catalog",
  "activity-feed": "mk-catalog", "log-activity": "mk-catalog",
  "price-history": "mk-catalog", "recommendations": "mk-catalog",
  "saved-searches": "mk-catalog", "save-search": "mk-catalog", "delete-saved-search": "mk-catalog",
  "drop-reminders": "mk-catalog", "toggle-drop-reminder": "mk-catalog",
  "admin-pending-offers": "mk-catalog", "admin-moderate-offer": "mk-catalog",
  "product-coupons": "mk-catalog",

  // mk-orders: Core Orders, Payments, Status, Rate, Admin, Wallet, Buyer Cancel
  "create-order": "mk-orders", "confirm-payment": "mk-orders", "my-orders": "mk-orders",
  "my-sales": "mk-orders", "update-order-status": "mk-orders",
  "rate-seller": "mk-orders", "admin-orders": "mk-orders", "admin-disputes": "mk-orders",
  "cancel-buyer-order": "mk-orders",
  "wallet-balance": "mk-orders", "wallet-transactions": "mk-orders",

  // mk-fulfill: Disputes, Chat, Hub PRO, Inspection, Laudo, Auto-payout
  "open-dispute": "mk-fulfill", "resolve-dispute": "mk-fulfill",
  "chat-messages": "mk-fulfill", "send-message": "mk-fulfill",
  "hub-orders": "mk-fulfill", "hub-update-status": "mk-fulfill", "hub-inspect": "mk-fulfill",
  "laudo-lookup": "mk-fulfill", "check-auto-payout": "mk-fulfill",

  // mk-seller: Onboarding, Tier, Analytics, Price Drop, Strikes, Leaderboard
  "seller-onboarding": "mk-seller", "seller-onboarding-status": "mk-seller",
  "seller-tier-info": "mk-seller", "recalc-seller-tier": "mk-seller",
  "seller-analytics": "mk-seller", "price-drop-suggestions": "mk-seller",
  "seller-leaderboard": "mk-seller",
  "my-strikes": "mk-seller", "appeal-strike": "mk-seller",

  // mk-store: Coupons, Boosts, Collections, Social, Badges, Storefront, KYC, Snapshot, Loyalty
  "my-coupons": "mk-store", "create-coupon": "mk-store",
  "update-coupon": "mk-store", "delete-coupon": "mk-store", "validate-coupon": "mk-store",
  "use-coupon": "mk-store",
  "update-storefront": "mk-store", "my-storefront": "mk-store", "snapshot-prices": "mk-store",
  "boost-activate": "mk-store", "boost-deactivate": "mk-store", "my-boosts": "mk-store",
  "my-collections": "mk-store", "create-collection": "mk-store",
  "update-collection": "mk-store", "delete-collection": "mk-store",
  "toggle-follow": "mk-store", "is-following": "mk-store", "my-follows": "mk-store",
  "loyalty-balance": "mk-store", "check-badges": "mk-store",
  "review-kyc": "mk-store",
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
