/**
 * Deno tests for _shared/idempotency.ts
 *
 * Run via: supabase--test_edge_functions
 *
 * Covers: success path, duplicate detection, failure+retry, stale lock cleanup, race condition.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkIdempotency,
  setIdempotencyResult,
  markIdempotencyFailed,
  releaseIdempotencyKey,
} from "../_shared/idempotency.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

function sb() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

function testKey(suffix: string) {
  return `test-idemp-${Date.now()}-${suffix}`;
}

// ── Cleanup helper ──
async function cleanup(key: string) {
  await sb().from("idempotency_keys").delete().eq("key", key);
}

// ═══════════════════════════════════════
// 1. Success path: lock → complete → cached result
// ═══════════════════════════════════════
Deno.test("idempotency: success path returns cached result on duplicate", async () => {
  const key = testKey("success");
  try {
    const check1 = await checkIdempotency(sb(), key, 5);
    assertEquals(check1.isDuplicate, false, "First call should NOT be duplicate");

    await setIdempotencyResult(sb(), key, { order_id: "ORD-123", amount: 99.90 });

    const check2 = await checkIdempotency(sb(), key, 5);
    assertEquals(check2.isDuplicate, true, "Second call SHOULD be duplicate");
    assertExists(check2.cachedResult, "Should have cached result");
    assertEquals((check2.cachedResult as any).order_id, "ORD-123");
  } finally {
    await cleanup(key);
  }
});

// ═══════════════════════════════════════
// 2. Duplicate while processing: returns processing status
// ═══════════════════════════════════════
Deno.test("idempotency: concurrent request returns processing status", async () => {
  const key = testKey("concurrent");
  try {
    const check1 = await checkIdempotency(sb(), key, 5);
    assertEquals(check1.isDuplicate, false);

    // Second call while still processing
    const check2 = await checkIdempotency(sb(), key, 5);
    assertEquals(check2.isDuplicate, true, "Should detect as duplicate while processing");
    assertEquals((check2.cachedResult as any)?.status, "processing");
  } finally {
    await cleanup(key);
  }
});

// ═══════════════════════════════════════
// 3. Failure path: mark failed → allows retry
// ═══════════════════════════════════════
Deno.test("idempotency: failed key allows retry on next check", async () => {
  const key = testKey("failure");
  try {
    const check1 = await checkIdempotency(sb(), key, 5);
    assertEquals(check1.isDuplicate, false);

    await markIdempotencyFailed(sb(), key, "Payment gateway timeout");

    // Next check should allow retry (failed keys are cleared)
    const check2 = await checkIdempotency(sb(), key, 5);
    assertEquals(check2.isDuplicate, false, "Failed key should allow retry");
  } finally {
    await cleanup(key);
  }
});

// ═══════════════════════════════════════
// 4. Expired key: allows reprocessing
// ═══════════════════════════════════════
Deno.test("idempotency: expired key allows reprocessing", async () => {
  const key = testKey("expired");
  try {
    // Insert an already-expired key directly
    await sb().from("idempotency_keys").insert({
      key,
      status: "completed",
      expires_at: new Date(Date.now() - 60000).toISOString(), // expired 1 min ago
      cached_result: { old: true },
    });

    const check = await checkIdempotency(sb(), key, 5);
    assertEquals(check.isDuplicate, false, "Expired key should allow reprocessing");
  } finally {
    await cleanup(key);
  }
});

// ═══════════════════════════════════════
// 5. Release key: immediate cleanup
// ═══════════════════════════════════════
Deno.test("idempotency: releaseIdempotencyKey deletes the key", async () => {
  const key = testKey("release");
  try {
    await checkIdempotency(sb(), key, 5);
    await releaseIdempotencyKey(sb(), key);

    const { data } = await sb()
      .from("idempotency_keys")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    assertEquals(data, null, "Key should be deleted after release");
  } finally {
    await cleanup(key);
  }
});
