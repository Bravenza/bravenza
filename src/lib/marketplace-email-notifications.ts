import { supabase } from "@/integrations/supabase/client";

type MarketplaceEmailType =
  | "mk_purchase_confirmed"
  | "mk_new_sale"
  | "mk_seller_shipped"
  | "mk_delivery_confirmed"
  | "mk_inspection_result"
  | "mk_payout_released"
  | "mk_dispute_opened"
  | "mk_watchlist_match"
  | "community_welcome"
  | "community_post_reported";

interface MarketplaceEmailData {
  type: MarketplaceEmailType;
  recipient_name: string;
  recipient_email: string;
  order_code?: string;
  product_name?: string;
  price?: number;
  size?: string;
  condition?: string;
  seller_name?: string;
  buyer_name?: string;
  tracking_code?: string;
  carrier?: string;
  shipping_mode?: string;
  inspection_result?: "approved" | "rejected";
  rejection_reason?: string;
  payout_amount?: number;
  payout_method?: string;
  dispute_reason?: string;
  dispute_opened_by?: string;
  watchlist_product_name?: string;
  watchlist_price?: number;
  watchlist_size?: string;
  post_title?: string;
  report_reason?: string;
  reporter_name?: string;
}

export async function sendMarketplaceEmail(
  data: MarketplaceEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!data.recipient_email) return { success: true };

  try {
    const { error } = await supabase.functions.invoke("send-marketplace-email", {
      body: data,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
