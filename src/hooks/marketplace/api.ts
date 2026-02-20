import { supabase } from "@/integrations/supabase/client";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const ACTION_TO_FUNCTION: Record<string, string> = {
  "listings": "mk-hub", "listing-detail": "mk-hub", "my-listings": "mk-hub",
  "create-listing": "mk-hub", "update-listing": "mk-hub", "delete-listing": "mk-hub",
  "toggle-favorite": "mk-hub", "seller-profile": "mk-hub", "seller-public-profile": "mk-hub",
  "create-order": "mk-hub", "confirm-payment": "mk-hub", "my-orders": "mk-hub",
  "my-sales": "mk-hub", "update-order-status": "mk-hub", "resolve-dispute": "mk-hub",
  "rate-seller": "mk-hub", "admin-orders": "mk-hub", "open-dispute": "mk-hub",
  "chat-messages": "mk-hub", "send-message": "mk-hub",
  "make-offer": "mk-hub", "listing-offers": "mk-hub", "my-offers": "mk-hub", "respond-offer": "mk-hub",
  "seller-onboarding": "mk-hub", "seller-onboarding-status": "mk-hub",
  "price-drop-suggestions": "mk-hub",
  "seller-analytics": "mk-hub", "my-coupons": "mk-hub", "create-coupon": "mk-hub",
  "update-coupon": "mk-hub", "delete-coupon": "mk-hub", "validate-coupon": "mk-hub",
  "use-coupon": "mk-hub", "activity-feed": "mk-hub", "log-activity": "mk-hub",
  "price-history": "mk-hub", "recommendations": "mk-hub",
  "saved-searches": "mk-hub", "save-search": "mk-hub", "delete-saved-search": "mk-hub",
  "update-storefront": "mk-hub", "snapshot-prices": "mk-hub",
  "drop-reminders": "mk-hub", "toggle-drop-reminder": "mk-hub",
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
