/**
 * Generic rate limiter for edge functions.
 * Uses the `rate_limit_entries` table for persistence.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitConfig {
  /** Unique key for this limiter (e.g. "client-auth:request_code") */
  key: string;
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in minutes */
  windowMinutes: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Check and record a rate-limited action.
 * Returns { allowed, remaining, retryAfterSeconds }.
 */
export async function checkRateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const windowStart = new Date(
    Date.now() - config.windowMinutes * 60 * 1000
  ).toISOString();

  // Count recent attempts
  const { count } = await sb
    .from("rate_limit_entries")
    .select("*", { count: "exact", head: true })
    .eq("key", config.key)
    .eq("ip_address", ip)
    .gte("created_at", windowStart);

  const current = count ?? 0;

  if (current >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: config.windowMinutes * 60,
    };
  }

  // Record this attempt
  await sb.from("rate_limit_entries").insert({
    key: config.key,
    ip_address: ip,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - current - 1,
  };
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitResponse(
  retryAfterSeconds: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Muitas requisições. Aguarde alguns minutos e tente novamente.",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/** Extract client IP from common headers. */
function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
