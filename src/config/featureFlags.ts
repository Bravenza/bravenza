/**
 * Bravenza Feature Flags
 * 
 * All flags default to false (safe for production).
 * Flip to true to enable new functionality incrementally.
 */

export const FEATURE_FLAGS = {
  enable_price_history_v2: false,
  enable_alerts_v2: false,
  enable_favorites_lists: false,
  enable_order_detail_v2: true,
  enable_seller_dashboard_v2: false,
  enable_catalog_required_for_new_listings: false,
  enable_seo_ssr_v2: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
