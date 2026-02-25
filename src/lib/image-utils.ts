/**
 * Supabase Storage image transformation utilities.
 *
 * Usage:
 *   optimizeImageUrl(url, { width: 400, height: 300, quality: 75 })
 *
 * Only transforms URLs from Supabase Storage (/storage/v1/object/).
 * External URLs are returned as-is.
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

const SUPABASE_STORAGE_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

export function optimizeImageUrl(
  url: string | undefined | null,
  opts: ImageTransformOptions = {}
): string {
  if (!url) return "";

  // Only transform Supabase storage URLs
  if (!url.includes(SUPABASE_STORAGE_PATH)) return url;

  const transformed = url.replace(SUPABASE_STORAGE_PATH, SUPABASE_RENDER_PATH);

  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.quality) params.set("quality", String(opts.quality));
  if (opts.resize) params.set("resize", opts.resize);

  const qs = params.toString();
  return qs ? `${transformed}?${qs}` : transformed;
}

/** Placeholder SVG for broken images */
export const FALLBACK_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f4f4f5'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a1a1aa' font-size='14'%3ESem imagem%3C/text%3E%3C/svg%3E";
