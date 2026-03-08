/**
 * Idempotency helper for Edge Functions
 * 
 * Prevents duplicate processing of payments, webhooks, and critical operations.
 * Uses the `idempotency_keys` table with automatic TTL-based expiration.
 *
 * Status lifecycle:
 *   processing → completed  (success path)
 *   processing → failed     (error path — allows retry on next request)
 *   processing → (stale)    (stuck >2x TTL — auto-cleared on next check)
 *
 * Retry policy:
 *   - `completed` + cached_result → return cached (true duplicate)
 *   - `processing` + fresh → return "em processamento" (concurrent request)
 *   - `processing` + stale (>2x TTL) → delete and allow retry
 *   - `failed` → delete and allow retry
 *   - expired → delete and allow retry
 *
 * Usage:
 *   const check = await checkIdempotency(sb, key, 15);
 *   if (check.isDuplicate) return jsonResponse(check.cachedResult);
 *   try {
 *     // ... process ...
 *     await setIdempotencyResult(sb, key, result);
 *   } catch (e) {
 *     await markIdempotencyFailed(sb, key, e.message);
 *     throw e;
 *   }
 *
 * Error semantics:
 *   - Unique violation (23505) on upsert → treated as concurrent duplicate (safe)
 *   - Any other DB error on upsert → throws Error (NOT masked as duplicate)
 *   - Callers should catch and handle the thrown error appropriately
 */

export interface IdempotencyCheck {
  isDuplicate: boolean;
  cachedResult: Record<string, unknown> | null;
}

/**
 * Check if a key has already been processed.
 * If not, locks the key with status "processing" to prevent concurrent duplicates.
 *
 * Stale processing detection: if a key has been "processing" for longer than
 * 2x the TTL, it's considered stuck and will be cleared for retry.
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
  const now = new Date();

  // Check for existing key
  const { data: existing } = await sb
    .from("idempotency_keys")
    .select("id, status, cached_result, expires_at, updated_at")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    const expiresAt = new Date(existing.expires_at);
    const updatedAt = existing.updated_at ? new Date(existing.updated_at) : new Date(0);
    const staleCutoff = ttlMinutes * 2 * 60 * 1000; // 2x TTL

    // Expired — clear and allow re-processing
    if (expiresAt < now) {
      await sb.from("idempotency_keys").delete().eq("id", existing.id);
    }
    // Failed — clear and allow retry
    else if (existing.status === "failed") {
      await sb.from("idempotency_keys").delete().eq("id", existing.id);
    }
    // Completed with cached result — true duplicate
    else if (existing.status === "completed" && existing.cached_result) {
      return { isDuplicate: true, cachedResult: existing.cached_result };
    }
    // Processing but stale (stuck) — clear and allow retry
    else if (existing.status === "processing" && (now.getTime() - updatedAt.getTime()) > staleCutoff) {
      console.warn(`[idempotency] Stale processing lock cleared for key: ${key} (age: ${Math.round((now.getTime() - updatedAt.getTime()) / 1000)}s)`);
      await sb.from("idempotency_keys").delete().eq("id", existing.id);
    }
    // Processing and fresh — concurrent request
    else if (existing.status === "processing") {
      return { isDuplicate: true, cachedResult: { status: "processing", message: "Requisição em andamento" } };
    }
  }

  // Lock the key
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();
  const { error } = await sb
    .from("idempotency_keys")
    .upsert(
      { key, status: "processing", expires_at: expiresAt, updated_at: now.toISOString(), last_error: null },
      { onConflict: "key" }
    );

  if (error) {
    // Distinguish unique-violation (true race) from transient DB errors
    if (error.code === "23505") {
      // Unique constraint — another request locked the key concurrently
      console.warn("[idempotency] Lock contention (unique violation) for key:", key);
      return { isDuplicate: true, cachedResult: { status: "processing", message: "Requisição em andamento" } };
    }
    // Transient/unexpected DB error — do NOT mask as duplicate; let caller handle
    console.error("[idempotency] DB error acquiring lock for key:", key, error.code, error.message);
    throw new Error(`Idempotency lock failed: ${error.message}`);
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
    .update({ status: "completed", cached_result: result, updated_at: new Date().toISOString(), last_error: null })
    .eq("key", key);
}

/**
 * Mark an idempotency key as failed with error details.
 * Failed keys are automatically cleared on next checkIdempotency() call (allows retry).
 * The error context is preserved in `last_error` and `cached_result` for debugging.
 */
export async function markIdempotencyFailed(
  sb: any,
  key: string,
  errorMessage: string
): Promise<void> {
  await sb
    .from("idempotency_keys")
    .update({
      status: "failed",
      last_error: errorMessage,
      cached_result: { error: errorMessage, failed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);
}

/**
 * Release an idempotency lock immediately (deletes the key).
 * Prefer markIdempotencyFailed() when you want to record the error for debugging.
 * Use this only for non-error cases (e.g., skipping a webhook that doesn't need processing).
 */
export async function releaseIdempotencyKey(
  sb: any,
  key: string
): Promise<void> {
  await sb.from("idempotency_keys").delete().eq("key", key);
}
