export interface MarketplaceListing {
  id: string;
  seller_id: string;
  vault_item_id: string | null;
  title: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  colorway: string | null;
  size: string | null;
  condition: string;
  photos: string[];
  price: number;
  original_purchase_price: number | null;
  shipping_mode: string;
  shipping_cost_estimate: number;
  is_vault_certified: boolean;
  status: string;
  views_count: number;
  favorites_count: number;
  published_at: string | null;
  created_at: string;
  is_favorited?: boolean;
  seller?: {
    id: string;
    average_rating: number | null;
    total_sales_count: number;
    current_fee_percent: number;
    bio: string | null;
    member: {
      client_name: string;
      tier: string;
    };
  };
}

export interface MarketplaceOrder {
  id: string;
  order_code: string;
  listing_id: string;
  buyer_cpf: string;
  buyer_name: string;
  seller_id: string;
  sale_price: number;
  fee_percent: number;
  fee_amount: number;
  seller_payout: number;
  shipping_mode: string;
  shipping_cost: number;
  tracking_code: string | null;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  protection_ends_at: string | null;
  cancellation_window_ends_at: string | null;
  payout_released_at: string | null;
  payout_method: string | null;
  buyer_rating: number | null;
  buyer_review: string | null;
  created_at: string;
  admin_notes: string | null;
  dispute_status: string | null;
  hub_tracking_code: string | null;
  hub_received_at: string | null;
  hub_shipped_at: string | null;
  hub_tracking_to_buyer: string | null;
  inspection_id: string | null;
  inspection_result: string | null;
  listing?: {
    title: string;
    brand: string | null;
    model: string | null;
    size: string | null;
    photos: string[];
    condition: string;
    is_vault_certified?: boolean;
  };
}

export interface SellerProfile {
  id: string;
  member_id: string;
  total_sales_count: number;
  total_sales_value: number;
  current_fee_percent: number;
  average_rating: number | null;
  ratings_count: number;
  bio: string | null;
  is_active: boolean;
}
