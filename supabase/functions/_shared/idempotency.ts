/**
 * Idempotency helper for Edge Functions
 * 
 * Prevents duplicate processing of payments, webhooks, and critical operations.
 * Uses the `idempotency_keys` table with automatic TTL-based expiration.
 * 
 * Usage:
 *   const check = await checkIdempotency(sb, key, 15);
 *   if (check.isDuplicate) return jsonResponse(check.cachedResult);
 *   // ... process ...
 *   await setIdempotencyResult(sb, key, result);
 */

export interface IdempotencyCheck {
  isDuplicate: boolean;
  cachedResult: Record<string, unknown> | null;
}

/**
 * Check if a key has already been processed.
 * If not, locks the key with status "processing" to prevent concurrent duplicates.
 * 
 * @param sb - Supabase client (service role)
 * @param key - Deterministic idempotency key (e.g., `webhook-payment-12345`)
 * @param ttlMinutes - How long to remember this key (default: 15 min)
 */
export async function checkIdempotency(
  sb: any,
  key: string,
  ttlMinutes = 15
): Promise<IdempotencyCheck> {
  // Check for existing key
  const { data: existing } = await sb
    .from("idempotency_keys")
    .select("id, status, cached_result, expires_at")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    // Check if expired
    if (new Date(existing.expires_at) < new Date()) {
      // Expired — delete and allow re-processing
      await sb.from("idempotency_keys").delete().eq("id", existing.id);
    } else if (existing.status === "completed" && existing.cached_result) {
      // Already processed — return cached result
      return { isDuplicate: true, cachedResult: existing.cached_result };
    } else if (existing.status === "processing") {
      // Currently being processed by another request — treat as duplicate
      return { isDuplicate: true, cachedResult: { status: "processing", message: "Requisição em andamento" } };
    }
  }

  // Lock the key
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const { error } = await sb
    .from("idempotency_keys")
    .upsert(
      { key, status: "processing", expires_at: expiresAt },
      { onConflict: "key" }
    );

  if (error) {
    // If upsert fails due to race condition, treat as duplicate
    console.warn("[idempotency] Lock contention for key:", key, error.message);
    return { isDuplicate: true, cachedResult: { status: "processing", message: "Requisição em andamento" } };
  }

  return { isDuplicate: false, cachedResult: null };
}

/**
 * Mark an idempotency key as completed with cached result.
 */
export async function setIdempotencyResult(
  sb: any,
  key: string,
  result: Record<string, unknown>
): Promise<void> {
  await sb
    .from("idempotency_keys")
    .update({ status: "completed", cached_result: result })
    .eq("key", key);
}

/**
 * Release an idempotency lock on error (allows retry).
 */
export async function releaseIdempotencyKey(
  sb: any,
  key: string
): Promise<void> {
  await sb.from("idempotency_keys").delete().eq("key", key);
}
