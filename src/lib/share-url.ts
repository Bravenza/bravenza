/**
 * Generates a share URL that goes through the OG renderer edge function.
 * Social crawlers get rich HTML with OG tags; real users are redirected to the SPA.
 */

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "snfqxejtmauyspyhqvop";
const OG_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/og-renderer`;

/** Share URL for a product page (by slug) */
export function getProductShareUrl(slug: string): string {
  return `${OG_BASE}?slug=${encodeURIComponent(slug)}`;
}

/** Share URL for a generic page path */
export function getPageShareUrl(path: string): string {
  return `${OG_BASE}?path=${encodeURIComponent(path)}`;
}
