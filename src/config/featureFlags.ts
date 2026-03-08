/**
 * Bravenza Feature Flags
 * 
 * Static defaults / fallbacks.
 * When PostHog is available, useFeatureFlag() will override these
 * with remote values. Otherwise these values are used as-is.
 */

export const FEATURE_FLAGS = {
  enable_price_history_v2: true,
  enable_alerts_v2: true,
  enable_favorites_lists: true,
  enable_order_detail_v2: true,
  enable_seller_dashboard_v2: false,
  enable_catalog_required_for_new_listings: true,
  enable_seo_ssr_v2: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
