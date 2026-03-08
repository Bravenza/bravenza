# Edge Functions Security Architecture

## Why `verify_jwt = false` in config.toml

All Edge Functions have `verify_jwt = false` in `supabase/config.toml`.
This is **intentional and secure** — here's why:

### The Problem with `verify_jwt = true`
Supabase's built-in `verify_jwt` uses a signing-keys system that doesn't work
reliably with the modern key rotation approach. Setting it to `true` can cause
intermittent 401 errors for valid tokens.

### Our In-Code Validation Strategy
Instead, **every function validates auth in code** using one of these patterns:

| Pattern | Where Used | How |
|---------|-----------|-----|
| `resolveAuthCpf(req, sb)` | Auth-required functions | JWT → user_id → client_profiles.cpf |
| `resolveCpf(req, sb, PUB, action)` | Mixed public/auth functions | Same + PUB set bypass |
| `requireAdmin(req, sb)` | Admin panel functions | JWT → user_id → user_roles(admin) |
| `requireAdminByToken(sb, header)` | Admin checks in mixed functions | Same, accepts raw header |
| `isAdminByToken(sb, header)` | RBAC checks (seller vs admin) | Boolean admin check, no throw |
| Session token | client-orders, client-auth | client_sessions table validation |
| Webhook signature | mercadopago-webhook | HMAC-SHA256 signature validation |
| No auth (public) | og-renderer, health-check | Public endpoints, no sensitive data |

## Action Contract Pattern

All `mkv2-*` functions classify their actions into three tiers:

```
PUBLIC_ACTIONS   → PUB set (e.g., listings, product-reviews) → visitor allowed
AUTH_REQUIRED    → Default for any action not in PUB          → JWT + CPF required
ADMIN_REQUIRED   → requireAdminByToken / isAdminByToken      → JWT + user_roles(admin)
```

Resolved via `resolveCpf(req, sb, PUB, action)` from `_shared/mk-helpers.ts`.
Auth-only functions use `resolveAuthCpf(req, sb)` directly.

### Functions Using Shared Auth (`_shared/mk-helpers.ts` + `_shared/auth-guard.ts`)

**Admin functions (auth-guard.ts → requireAdmin / requireServiceOrAdmin):**
- `create-admin`, `catalog-sync`, `catalog-seed-500`
- `mkv2-auto-payout`, `mkv2-cron-tasks`, `sync-droper-images`

**Auth-required (mk-helpers.ts → resolveAuthCpf):**
- `mkv2-wallet`, `mkv2-offers`, `mkv2-social`, `mkv2-seller-data`
- `mkv2-orders`, `mkv2-store`, `mkv2-order-ops`, `mkv2-checkout`

**Mixed public/auth (mk-helpers.ts → resolveCpf + PUB set):**
- `mkv2-engage` (PUB: product-comments, product-reviews, product-analytics, check-purchase)
- `mkv2-listings` (PUB: listings, listing-detail, seller-public-profile)
- `mkv2-seller` (PUB: seller-tier-info, seller-leaderboard)
- `mkv2-fulfill` (PUB: laudo-lookup, check-auto-payout)

**Admin checks within mixed functions (auth-guard.ts):**
- `mkv2-fulfill` → `requireAdminByToken` for resolve-dispute, hub-orders, hub-update-status, hub-inspect; `isAdminByToken` for send-message
- `mkv2-order-ops` → `requireAdminByToken` for admin-orders, admin-disputes, payout_released; `isAdminByToken` for update-order-status RBAC

**Session-based auth (client portal, not JWT):**
- `client-orders` → session_token via client_sessions table
- `client-auth` → session_token + CPF code verification

### Public Endpoints (No Auth Required)
These are intentionally public and contain no sensitive data:
- `health-check` — uptime monitoring
- `og-renderer` — Open Graph meta tags
- `push-vapid-key` — public VAPID key
- `verify-captcha` — CAPTCHA validation
- `mercadopago-webhook` — validates via HMAC signature, not JWT

## Idempotency Protection

Critical payment functions use the `_shared/idempotency.ts` helper:

### Status lifecycle
```
processing → completed   (success: result cached, duplicates return cache)
processing → failed      (error: recorded with context, next request retries)
processing → (stale)     (stuck >2× TTL: auto-cleared on next check)
expired    → (cleared)   (past expires_at: deleted on next check)
```

### Schema (`idempotency_keys` table)
| Column | Type | Purpose |
|--------|------|---------|
| `key` | text (unique) | Deterministic key e.g. `card-{orderId}-{type}` |
| `status` | text | `processing` / `completed` / `failed` |
| `cached_result` | jsonb | Stored response for completed keys |
| `last_error` | text | Error message for failed keys |
| `expires_at` | timestamptz | TTL-based expiration |
| `updated_at` | timestamptz | Tracks last status change (stale detection) |

### Lock placement policy
Lock is acquired **AFTER** input validation and ownership checks, **BEFORE** external API calls:
1. Parse + validate request body
2. Verify order ownership / payment status
3. **→ checkIdempotency() ←** (lock point)
4. Call external API (MercadoPago, etc.)
5. Update database
6. setIdempotencyResult() on success / markIdempotencyFailed() on error

### Scenario → Response matrix
| Scenario | Status | Response | HTTP |
|----------|--------|----------|------|
| First request | `processing` → `completed` | Payment result | 200 |
| Duplicate (completed) | `completed` | Cached result | 200 |
| Concurrent request | `processing` (fresh) | `{"status":"processing","message":"..."}` | 200 |
| Retry after failure | `failed` → cleared → `processing` | New attempt | 200 |
| Retry after stale lock | `processing` (>2×TTL) → cleared → `processing` | New attempt | 200 |
| Retry after expiry | expired → cleared → `processing` | New attempt | 200 |

### Functions using idempotency:
| Function | Key pattern | TTL | Lock point |
|----------|-------------|-----|------------|
| `process-card-payment` | `card-{orderId}-{type}` | 5 min | After order validation |
| `generate-pix` | `pix-{orderId}-{type}` | 15 min | After payment status check |
| `mkv2-checkout` | `mkt-checkout-{ids}-{method}` | 5 min | After ownership + status validation |
| `mercadopago-webhook` | `webhook-mp-{paymentId}-{action}` | 60 min | After signature validation |
| `mkv2-wallet` (request-payout) | `wallet-payout-{sellerId}-{amount}` | 5 min | After balance validation |
| `mkv2-auto-payout` | `auto-payout-{orderId}` | 120 min | Per-order within batch |

## Admin Role Validation
All admin checks use `user_roles` table (not `admin_profiles`).
This prevents privilege escalation via profile manipulation.

---

## P0 Migration Status (Hardening Fase 3)

| Function | Before | After | Status |
|----------|--------|-------|--------|
| `mkv2-order-ops` | ad-hoc `isAdminByToken` inline, minified | Explicit `ADMIN_ACTIONS` set, `requireAdminByToken` at gate, `AuthError` catch | ✅ Migrated |
| `mkv2-fulfill` | ad-hoc `requireAdminByToken` per-action, minified | Explicit `PUBLIC_ACTIONS` + `ADMIN_ACTIONS` sets, gate-level admin check, `AuthError` catch | ✅ Migrated |
| `client-orders` | ad-hoc CORS headers + inline response builders | Shared `corsHeaders` + `jsonResponse` from mk-helpers, 401 for missing/invalid session | ✅ Migrated |
| `create-admin` | Already using `requireAdmin` from auth-guard | No change needed | ✅ Already compliant |

### Compatibility Notes
- `laudo-lookup` and `check-auto-payout` remain PUBLIC (no auth required)
- `client-orders` uses session_token auth (not JWT) — this is correct for the CPF-based client portal
- `update-order-status` uses RBAC: admin can set any status, sellers limited to `shipped`/`in_transit_to_hub`
- `payout_released` sub-status requires admin even within `update-order-status`

### Acceptance Checklist
- [x] No admin action in P0 functions depends on manual header/token parsing
- [x] All public actions remain public and documented in `PUBLIC_ACTIONS` constant
- [x] All protected actions return consistent errors via `authErrorResponse`
- [x] `verify_jwt=false` justified per function (in-code validation via shared guard)
- [x] Auth error handling uses `AuthError` class with proper HTTP status codes

---

## P1 Migration Status (Hardening Fase 3)

| Function | Before | After | Status |
|----------|--------|-------|--------|
| `catalog-sync` | ad-hoc service-role + cron-key checks + `requireAdmin` fallback | `requireServiceOrAdmin` from shared guard (single call) | ✅ Migrated |
| `catalog-seed-500` | local `CORS`/`json()` helpers, `requireAdmin` already used | Shared `corsHeaders`/`jsonResponse` from mk-helpers | ✅ Migrated |
| `mkv2-cron-tasks` | local `corsHeaders`, `requireServiceOrAdmin` already used | Shared `corsHeaders` from mk-helpers | ✅ Migrated |

### Before/After Action Map

**catalog-sync:**
| Action | Before | After |
|--------|--------|-------|
| `preview` | ad-hoc service-role OR cron-key OR requireAdmin | `requireServiceOrAdmin` (shared) |
| `sync` | same ad-hoc | `requireServiceOrAdmin` (shared) |
| `update-images` | same ad-hoc | `requireServiceOrAdmin` (shared) |

**catalog-seed-500:**
| Action | Before | After |
|--------|--------|-------|
| `test` | `requireAdmin` (shared) | `requireAdmin` (shared) — no change |
| `brands_list` | `requireAdmin` (shared) | `requireAdmin` (shared) — no change |
| `seed_brand` | `requireAdmin` (shared) | `requireAdmin` (shared) — no change |

**mkv2-cron-tasks:**
| Action | Before | After |
|--------|--------|-------|
| all tasks | `requireServiceOrAdmin` (shared) | `requireServiceOrAdmin` (shared) — no change |

### Compatibility Notes
- All three functions are admin/service-only — no public actions
- `catalog-sync` agora usa `requireServiceOrAdmin` (shared guard), que valida `app_config.cron_secret_key`. A key `cron_secret_key` foi criada no banco com o mesmo valor da antiga `catalog_sync_cron_key` para garantir compatibilidade.
- `verify_jwt=false` justified: all three validate auth in-code via shared guard

### P1 Acceptance Checklist
- [x] All actions protected by shared guard (`requireAdmin` or `requireServiceOrAdmin`)
- [x] No ad-hoc service-role/cron-key validation remaining
- [x] No local CORS/response helpers — using shared `corsHeaders`/`jsonResponse`
- [x] Consistent 401/403 error responses via `authErrorResponse`
- [x] `verify_jwt=false` justified per function (in-code validation)
