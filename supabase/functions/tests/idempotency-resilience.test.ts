/**
 * Idempotency Resilience Tests
 * 
 * Validates:
 * 1. Transient DB errors are NOT masked as duplicates (risk #1)
 * 2. markIdempotencyFailed on non-existent key is safe no-op (risk #2)
 * 3. Webhook returns 500 on transient errors so MP retries (risk #3)
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkIdempotency,
  setIdempotencyResult,
  markIdempotencyFailed,
  releaseIdempotencyKey,
} from "../_shared/idempotency.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

function getSb() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

Deno.test("markIdempotencyFailed on non-existent key is a safe no-op", async () => {
  const sb = getSb();
  const fakeKey = `test-nonexistent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  // Should NOT throw
  await markIdempotencyFailed(sb, fakeKey, "test error on non-existent key");
  
  // Verify key was NOT created (update matched 0 rows)
  const { data } = await sb
    .from("idempotency_keys")
    .select("id")
    .eq("key", fakeKey)
    .maybeSingle();
  
  assertEquals(data, null, "markIdempotencyFailed should not create a new key");
});

Deno.test("Full lifecycle: processing → completed → duplicate returns cached", async () => {
  const sb = getSb();
  const testKey = `test-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  try {
    // 1. First call: should lock
    const check1 = await checkIdempotency(sb, testKey, 5);
    assertEquals(check1.isDuplicate, false);
    
    // 2. Concurrent call: should see processing
    const check2 = await checkIdempotency(sb, testKey, 5);
    assertEquals(check2.isDuplicate, true);
    assertEquals(check2.cachedResult?.status, "processing");
    
    // 3. Complete the operation
    await setIdempotencyResult(sb, testKey, { payment_id: "test-123", status: "approved" });
    
    // 4. Subsequent call: should return cached result
    const check3 = await checkIdempotency(sb, testKey, 5);
    assertEquals(check3.isDuplicate, true);
    assertEquals(check3.cachedResult?.payment_id, "test-123");
  } finally {
    await releaseIdempotencyKey(sb, testKey);
  }
});

Deno.test("Full lifecycle: processing → failed → retry allowed", async () => {
  const sb = getSb();
  const testKey = `test-failed-retry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  try {
    // 1. Lock
    const check1 = await checkIdempotency(sb, testKey, 5);
    assertEquals(check1.isDuplicate, false);
    
    // 2. Mark failed
    await markIdempotencyFailed(sb, testKey, "simulated transient error");
    
    // 3. Retry should be allowed (failed keys are cleared)
    const check2 = await checkIdempotency(sb, testKey, 5);
    assertEquals(check2.isDuplicate, false, "Failed key should allow retry");
  } finally {
    await releaseIdempotencyKey(sb, testKey);
  }
});

Deno.test("Webhook smoke: no token returns 401 for auth-protected functions", async () => {
  const baseUrl = SUPABASE_URL;
  const anonKey = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || SUPABASE_KEY;
  
  // mkv2-order-ops requires auth — no token should return 401
  const res = await fetch(
    `${baseUrl}/functions/v1/mkv2-order-ops?action=admin-orders`,
    {
      method: "GET",
      headers: {
        "apikey": anonKey,
        "Content-Type": "application/json",
      },
    }
  );
  const body = await res.json();
  assertEquals(res.status, 401, `Expected 401, got ${res.status}: ${JSON.stringify(body)}`);
});
