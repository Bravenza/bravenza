# Release Checklist — Backend Hardening (Sprints 1 & 2)

> Last updated: 2026-03-08

---

## 1. Pre-Deploy Validation

### 1.1 Auth Governance
- [x] `mkv2-discover` admin actions migrated to `requireAdmin` (was: zero auth on `admin-flag-listing`)
- [x] `mk-helpers.ts` `resolveAuthCpf` delegates to `auth-guard.ts` `requireAuth` (single source of truth)
- [x] All 42 functions classified in `supabase/config.toml` with explicit justification
- [x] `auth-smoke-test` edge function: **6/6 scenarios passed**

### 1.2 Idempotency Lifecycle
- [x] `_shared/idempotency.ts` supports: `processing → completed | failed`
- [x] Stale lock detection: auto-clears locks older than 2× TTL
- [x] `failed` status auto-cleared on next `checkIdempotency()` call (allows retry)
- [x] All 6 critical functions verified:

| Function | `checkIdempotency` | `setIdempotencyResult` | `markIdempotencyFailed` | TTL |
|---|---|---|---|---|
| `generate-pix` | ✅ | ✅ | ✅ | 15 min |
| `process-card-payment` | ✅ | ✅ | ✅ | 5 min |
| `mkv2-checkout` | ✅ | ✅ | ✅ | 5 min |
| `mkv2-wallet` (request-payout) | ✅ | ✅ | ✅ | 5 min |
| `mkv2-auto-payout` (per order) | ✅ | ✅ | ✅ | 120 min |
| `mercadopago-webhook` | ✅ | ✅ | ✅ | 60 min |

### 1.3 Edge Functions Deployed
- [x] `mkv2-discover` — admin auth fix
- [x] `mkv2-listings` — unified auth delegation
- [x] `mkv2-engage` — unified auth delegation
- [x] `mkv2-seller` — unified auth delegation
- [x] `mkv2-catalog` — unified auth delegation
- [x] `auth-smoke-test` — new (test utility)

---

## 2. Smoke Tests

### 2.1 Auth Enforcement (via `auth-smoke-test`)
```
GET /functions/v1/auth-smoke-test
→ 6/6 passed:
  - requireAuth (no token) → 401 ✅
  - requireAuth (invalid token) → 401 ✅
  - requireAdmin (no token) → 401 ✅
  - requireAdmin (invalid token) → 401 ✅
  - optionalAuth (no token) → null ✅
  - optionalAuth (invalid token) → null ✅
```

### 2.2 Public Endpoints (regression)
```
GET /functions/v1/mkv2-listings?action=listings → 200 (3 listings) ✅
GET /functions/v1/mkv2-engage?action=product-reviews&product_id=test → 200 ✅
GET /functions/v1/mkv2-catalog?action=catalog-products → 200 (products) ✅
GET /functions/v1/mkv2-discover?action=activity-feed → 200 (events) ✅
```

### 2.3 Payment Smoke Tests (manual — pre-deploy)
- [ ] PIX: Create payment → verify `idempotency_keys` row → retry same key → confirm cached result
- [ ] Card: Create payment → verify `idempotency_keys` row → retry same key → confirm cached result
- [ ] Checkout: Consolidated order → PIX + Card paths → verify no duplicate `vault_marketplace_orders` updates
- [ ] Webhook: Send duplicate MP notification → verify order not double-updated

### 2.4 Cron / Auto-Payout
- [ ] Trigger `mkv2-auto-payout` twice within 2h → verify second run skips already-processed orders
- [ ] Verify `cron_execution_logs` entry created with `status: success`

---

## 3. Rollback Plan

### If auth issues detected:
1. **Immediate**: Revert `mkv2-discover/index.ts` to previous version (pre-admin guard)
2. **Fallback**: The `resolveCpf` helper in mk-helpers is backward-compatible; reverting the `resolveAuthCpf` change is safe

### If idempotency issues detected:
1. `idempotency_keys` table can be truncated without data loss (it's a cache)
2. Individual stuck keys: `DELETE FROM idempotency_keys WHERE key = '<key>'`
3. All functions gracefully handle missing idempotency rows (creates new lock)

### If edge function deploy fails:
1. Delete `deno.lock` and retry
2. Check `esm.sh` imports for version drift
3. Fallback: previous deployed version remains active until explicitly overwritten

---

## 4. Post-Deploy Monitoring (72h)

### Metrics to Watch
| Metric | Alert Threshold | Check Method |
|---|---|---|
| 401 errors on public actions | Any occurrence | Edge function logs |
| 403 errors on auth actions (legit users) | >5 in 1h | Edge function logs |
| `idempotency_keys` with `status=processing` >30min | Any | SQL query |
| Duplicate `vault_marketplace_orders` status updates | Any | SQL: `COUNT(*) GROUP BY mp_payment_id HAVING COUNT > 1` |
| Webhook 500 errors | >3 in 1h | Edge function logs |
| `cron_execution_logs` with `status=error` | Any | SQL query |

### Monitoring Queries
```sql
-- Stuck idempotency locks (>30 min in processing)
SELECT key, status, updated_at, last_error
FROM idempotency_keys
WHERE status = 'processing'
  AND updated_at < NOW() - INTERVAL '30 minutes';

-- Duplicate payment processing
SELECT mp_payment_id, COUNT(*) as updates
FROM vault_marketplace_orders
WHERE mp_payment_id IS NOT NULL
GROUP BY mp_payment_id
HAVING COUNT(*) > 1;

-- Recent cron failures
SELECT job_name, started_at, error_message
FROM cron_execution_logs
WHERE status = 'error'
  AND started_at > NOW() - INTERVAL '72 hours'
ORDER BY started_at DESC;

-- Failed idempotency keys (should auto-clear on retry)
SELECT key, last_error, updated_at
FROM idempotency_keys
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 5. Files Changed (Sprint 1 + 2)

| File | Change | Sprint |
|---|---|---|
| `supabase/functions/_shared/mk-helpers.ts` | `resolveAuthCpf` delegates to `auth-guard.requireAuth` | 1 |
| `supabase/functions/mkv2-discover/index.ts` | Rewritten: admin actions use `requireAdmin`, explicit tier sets | 1 |
| `supabase/functions/auth-smoke-test/index.ts` | New: programmatic auth guard test | 1 |
| `supabase/config.toml` | Added `auth-smoke-test` entry | 1 |
| `RELEASE-CHECKLIST.md` | New: this file | 2 |

---

## 6. Go/No-Go

| Criteria | Status |
|---|---|
| Auth governance matrix complete | ✅ |
| No ad-hoc auth in critical functions | ✅ |
| Idempotency lifecycle (processing/completed/failed) | ✅ |
| Auth smoke test 6/6 | ✅ |
| Public endpoint regression 4/4 | ✅ |
| Payment smoke tests (manual) | ⏳ Pending |
| Monitoring queries ready | ✅ |
| Rollback plan documented | ✅ |

**Decision**: **GO** for deploy, pending manual payment smoke tests.
