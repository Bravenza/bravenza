/**
 * auth-smoke-test — Programmatic auth guard verification
 *
 * SERVICE — Only callable by admin (requireAdmin).
 * Tests auth-guard behavior for 3 scenarios:
 *   1. No token → should get 401
 *   2. Invalid token → should get 401
 *   3. Valid non-admin token → should get 403 on requireAdmin
 *
 * Returns structured JSON with pass/fail for each scenario.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  requireAuth,
  requireAdmin,
  optionalAuth,
  AuthError,
} from "../_shared/auth-guard.ts";
import { corsHeaders, jsonResponse } from "../_shared/mk-helpers.ts";

interface TestResult {
  scenario: string;
  expected: string;
  actual: string;
  pass: boolean;
}

/** Build a fake Request with a specific Authorization header */
function fakeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new Request("https://localhost/test", { headers });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // This function itself requires admin
  try {
    await requireAdmin(req, sb);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    throw error;
  }

  const results: TestResult[] = [];

  // ── Test 1: No token → requireAuth should throw 401 ──
  try {
    await requireAuth(fakeRequest(), sb);
    results.push({
      scenario: "requireAuth — no token",
      expected: "AuthError 401",
      actual: "No error thrown",
      pass: false,
    });
  } catch (e) {
    const isCorrect = e instanceof AuthError && e.status === 401;
    results.push({
      scenario: "requireAuth — no token",
      expected: "AuthError 401",
      actual: e instanceof AuthError ? `AuthError ${e.status}: ${e.message}` : `${e}`,
      pass: isCorrect,
    });
  }

  // ── Test 2: Invalid token → requireAuth should throw 401 ──
  try {
    await requireAuth(fakeRequest("Bearer totally-invalid-jwt-token"), sb);
    results.push({
      scenario: "requireAuth — invalid token",
      expected: "AuthError 401",
      actual: "No error thrown",
      pass: false,
    });
  } catch (e) {
    const isCorrect = e instanceof AuthError && e.status === 401;
    results.push({
      scenario: "requireAuth — invalid token",
      expected: "AuthError 401",
      actual: e instanceof AuthError ? `AuthError ${e.status}: ${e.message}` : `${e}`,
      pass: isCorrect,
    });
  }

  // ── Test 3: No token → requireAdmin should throw 401 ──
  try {
    await requireAdmin(fakeRequest(), sb);
    results.push({
      scenario: "requireAdmin — no token",
      expected: "AuthError 401",
      actual: "No error thrown",
      pass: false,
    });
  } catch (e) {
    const isCorrect = e instanceof AuthError && e.status === 401;
    results.push({
      scenario: "requireAdmin — no token",
      expected: "AuthError 401",
      actual: e instanceof AuthError ? `AuthError ${e.status}: ${e.message}` : `${e}`,
      pass: isCorrect,
    });
  }

  // ── Test 4: Invalid token → requireAdmin should throw 401 ──
  try {
    await requireAdmin(fakeRequest("Bearer garbage-token-12345"), sb);
    results.push({
      scenario: "requireAdmin — invalid token",
      expected: "AuthError 401",
      actual: "No error thrown",
      pass: false,
    });
  } catch (e) {
    const isCorrect = e instanceof AuthError && e.status === 401;
    results.push({
      scenario: "requireAdmin — invalid token",
      expected: "AuthError 401",
      actual: e instanceof AuthError ? `AuthError ${e.status}: ${e.message}` : `${e}`,
      pass: isCorrect,
    });
  }

  // ── Test 5: No token → optionalAuth should return null (not throw) ──
  try {
    const result = await optionalAuth(fakeRequest(), sb);
    results.push({
      scenario: "optionalAuth — no token",
      expected: "null (no throw)",
      actual: result === null ? "null" : JSON.stringify(result),
      pass: result === null,
    });
  } catch (e) {
    results.push({
      scenario: "optionalAuth — no token",
      expected: "null (no throw)",
      actual: `Threw: ${e}`,
      pass: false,
    });
  }

  // ── Test 6: Invalid token → optionalAuth should return null (not throw) ──
  try {
    const result = await optionalAuth(fakeRequest("Bearer bad-token"), sb);
    results.push({
      scenario: "optionalAuth — invalid token",
      expected: "null (no throw)",
      actual: result === null ? "null" : JSON.stringify(result),
      pass: result === null,
    });
  } catch (e) {
    results.push({
      scenario: "optionalAuth — invalid token",
      expected: "null (no throw)",
      actual: `Threw: ${e}`,
      pass: false,
    });
  }

  const allPass = results.every((r) => r.pass);
  const passCount = results.filter((r) => r.pass).length;

  return jsonResponse({
    summary: `${passCount}/${results.length} passed`,
    all_pass: allPass,
    results,
  });
});
