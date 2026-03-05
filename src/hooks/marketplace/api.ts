import { supabase } from "@/integrations/supabase/client";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const ACTION_TO_FUNCTION: Record<string, string> = {
  // mkv2-listings: Listings CRUD, Favorites, Seller Profiles
  "listings": "mkv2-listings", "listing-detail": "mkv2-listings", "my-listings": "mkv2-listings",
  "create-listing": "mkv2-listings", "update-listing": "mkv2-listings", "delete-listing": "mkv2-listings",
  "toggle-favorite": "mkv2-listings", "seller-profile": "mkv2-listings", "seller-public-profile": "mkv2-listings",

  // mkv2-offers: Offers, Negotiation, Bundle
  "make-offer": "mkv2-offers", "listing-offers": "mkv2-offers", "my-offers": "mkv2-offers",
  "respond-offer": "mkv2-offers", "accept-counter": "mkv2-offers", "reject-counter": "mkv2-offers",
  "bundle-offer": "mkv2-offers", "negotiation-timeline": "mkv2-offers", "expire-offers": "mkv2-offers",

  // mkv2-catalog: Catalog CRUD, Watchlist
  "catalog-products": "mkv2-catalog", "catalog-product": "mkv2-catalog", "catalog-offers": "mkv2-catalog",
  "catalog-search": "mkv2-catalog", "catalog-create-product": "mkv2-catalog", "catalog-create-offer": "mkv2-catalog",
  "watchlist-check": "mkv2-catalog", "watchlist-toggle": "mkv2-catalog",

  // mkv2-engage: Comments, Reviews, Product Analytics
  "product-comments": "mkv2-engage", "product-comment": "mkv2-engage",
  "product-reviews": "mkv2-engage", "product-review": "mkv2-engage",
  "check-purchase": "mkv2-engage", "product-analytics": "mkv2-engage",

  // mkv2-discover: Freight, Activity, Price History, Recs, Searches, Drops, Admin Mod, Coupons
  "freight-quote": "mkv2-discover", "activity-feed": "mkv2-discover", "log-activity": "mkv2-discover",
  "price-history": "mkv2-discover", "recommendations": "mkv2-discover",
  "saved-searches": "mkv2-discover", "save-search": "mkv2-discover", "delete-saved-search": "mkv2-discover",
  "drop-reminders": "mkv2-discover", "toggle-drop-reminder": "mkv2-discover",
  "admin-flag-listing": "mkv2-discover", "admin-pending-offers": "mkv2-discover", "admin-moderate-offer": "mkv2-discover",
  "product-coupons": "mkv2-discover",

  // mkv2-orders: Create, Payment, My Orders/Sales, Rate, Wallet, Checkout
  "create-order": "mkv2-orders", "confirm-payment": "mkv2-orders", "my-orders": "mkv2-orders",
  "my-sales": "mkv2-orders", "rate-seller": "mkv2-orders",
  "wallet-balance": "mkv2-orders", "wallet-transactions": "mkv2-orders",
  "seller-balance": "mkv2-wallet", "request-payout": "mkv2-wallet",
  "pix-accounts": "mkv2-wallet", "save-pix": "mkv2-wallet", "delete-pix": "mkv2-wallet",
  "checkout": "mkv2-checkout",

  // mkv2-subscription: Seller subscription management
  "subscription-status": "mkv2-subscription", "subscription-create": "mkv2-subscription",
  "subscription-cancel": "mkv2-subscription",

  // mkv2-order-ops: Status Updates, Admin Orders, Disputes, Cancel
  "update-order-status": "mkv2-order-ops", "admin-orders": "mkv2-order-ops",
  "admin-disputes": "mkv2-order-ops", "cancel-buyer-order": "mkv2-order-ops",

  // mkv2-fulfill: Disputes, Chat, Hub PRO, Inspection, Laudo, Auto-payout
  "open-dispute": "mkv2-fulfill", "resolve-dispute": "mkv2-fulfill",
  "chat-messages": "mkv2-fulfill", "send-message": "mkv2-fulfill",
  "hub-orders": "mkv2-fulfill", "hub-update-status": "mkv2-fulfill", "hub-inspect": "mkv2-fulfill",
  "laudo-lookup": "mkv2-fulfill", "check-auto-payout": "mkv2-fulfill",

  // mkv2-seller: Onboarding, Tier, Leaderboard, Strikes
  "seller-onboarding": "mkv2-seller", "seller-onboarding-status": "mkv2-seller",
  "seller-tier-info": "mkv2-seller", "recalc-seller-tier": "mkv2-seller",
  "seller-leaderboard": "mkv2-seller", "my-strikes": "mkv2-seller", "appeal-strike": "mkv2-seller",

  // mkv2-seller-data: Analytics, Price Drop
  "seller-analytics": "mkv2-seller-data", "price-drop-suggestions": "mkv2-seller-data",

  // mkv2-store: Coupons, Boosts, Storefront, KYC, Snapshot
  "my-coupons": "mkv2-store", "create-coupon": "mkv2-store",
  "update-coupon": "mkv2-store", "delete-coupon": "mkv2-store", "validate-coupon": "mkv2-store",
  "use-coupon": "mkv2-store", "boost-activate": "mkv2-store", "boost-deactivate": "mkv2-store",
  "my-boosts": "mkv2-store", "update-storefront": "mkv2-store", "my-storefront": "mkv2-store",
  "review-kyc": "mkv2-store", "snapshot-prices": "mkv2-store",

  // mkv2-social: Collections, Follow, Badges, Loyalty
  "my-collections": "mkv2-social", "create-collection": "mkv2-social",
  "update-collection": "mkv2-social", "delete-collection": "mkv2-social",
  "toggle-follow": "mkv2-social", "is-following": "mkv2-social", "my-follows": "mkv2-social",
  "loyalty-balance": "mkv2-social", "check-badges": "mkv2-social",

  // mkv2-favorites: Favorite Lists v2
  "favorite-lists:list": "mkv2-favorites", "favorite-lists:create": "mkv2-favorites",
  "favorite-lists:rename": "mkv2-favorites", "favorite-lists:delete": "mkv2-favorites",
  "favorite-lists:add-item": "mkv2-favorites", "favorite-lists:remove-item": "mkv2-favorites",
  "favorite-lists:move-items": "mkv2-favorites",

  // mkv2-alerts: Alerts v2
  "alerts:list": "mkv2-alerts", "alerts:upsert": "mkv2-alerts", "alerts:delete": "mkv2-alerts",

  // mkv2-orders (new): Order Detail v2
  "order-detail": "mkv2-orders",
  "confirm-delivery": "mkv2-orders",

  // mkv2-seller-data (new): Seller Dashboard aggregator
  "seller-dashboard": "mkv2-seller-data",
};

export async function marketplaceRequest(
  _cpf: string,
  action: string,
  method: string = "GET",
  body?: any,
  extraParams?: Record<string, string>
) {
  const fnName = ACTION_TO_FUNCTION[action] || "mkv2-listings";
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