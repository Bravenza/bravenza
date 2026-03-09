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

**Auth-required (auth-guard.ts → requireAuth):**
- `mkv2-order-ops` ✅ Sprint 1 — migrated from mk-helpers `resolveAuthCpf` to auth-guard `requireAuth`
- `mkv2-wallet`, `mkv2-offers`, `mkv2-social`, `mkv2-seller-data`
- `mkv2-orders`, `mkv2-store`, `mkv2-checkout`

**Mixed public/auth (auth-guard.ts → requireAuth + optionalAuth):**
- `mkv2-fulfill` ✅ Sprint 1 — migrated from mk-helpers `resolveCpf` to auth-guard `requireAuth`/`optionalAuth`/`requireAdmin`
- `mkv2-engage` (PUB: product-comments, product-reviews, product-analytics, check-purchase)
- `mkv2-listings` (PUB: listings, listing-detail, seller-public-profile)
- `mkv2-seller` (PUB: seller-tier-info, seller-leaderboard)

**Admin checks within migrated functions (auth-guard.ts → requireAdmin):**
- `mkv2-fulfill` → `requireAdmin` for resolve-dispute, hub-orders, hub-update-status, hub-inspect; try/catch `requireAdmin` for send-message admin name
- `mkv2-order-ops` → `requireAdmin` for admin-orders, admin-disputes, payout_released; try/catch `requireAdmin` for update-order-status RBAC

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

## verify_jwt Governance Matrix (Hardening Fase 3 — Final)

All functions use `verify_jwt = false` in `supabase/config.toml`.
This is **intentional** — JWT validation happens in-code via shared guards.
See "Why `verify_jwt = false`" above for rationale.

### Classification Legend

| Tier | Description | Guard |
|------|-------------|-------|
| PUBLIC | No auth. Public data or external webhooks. | None (rate-limited where applicable) |
| WEBHOOK | External callback validated by signature | HMAC-SHA256 (not JWT) |
| SESSION | CPF-based session_token | `client_sessions` table validation |
| AUTH | JWT required | `requireAuth` / `resolveAuthCpf` / `resolveCpf` |
| ADMIN | JWT + admin role | `requireAdmin` / `requireAdminByToken` |
| SERVICE | Service-role / cron secret / admin fallback | `requireServiceOrAdmin` |
| MIXED | Per-action tier (PUBLIC + AUTH + ADMIN sets) | `resolveCpf` + action sets |
| INTERNAL | Service-to-service calls | Called by other edge functions, not end users |

### Full Function Matrix

| Function | Tier | `verify_jwt` | Auth Guard | Justification |
|----------|------|-------------|------------|---------------|
| `health-check` | PUBLIC | `false` | None | Uptime monitoring, no sensitive data |
| `og-renderer` | PUBLIC | `false` | None | OG meta tags for link previews, read-only |
| `push-vapid-key` | PUBLIC | `false` | None | Returns public VAPID key |
| `verify-captcha` | PUBLIC | `false` | None + rate-limit | reCAPTCHA verification, 20/15min/IP |
| `verify-authenticity` | PUBLIC | `false` | None | Laudo lookup by QR, public read-only |
| `mercadopago-webhook` | WEBHOOK | `false` | HMAC-SHA256 | MP signature validation, not JWT-based |
| `client-auth` | SESSION | `false` | session_token | CPF magic-code flow, not JWT |
| `client-orders` | SESSION | `false` | session_token | Client portal, session-based |
| `submit-review` | SESSION | `false` | session_token | Review submission via client portal |
| `generate-pix` | AUTH | `false` | requireAuth | PIX generation, JWT required |
| `process-card-payment` | AUTH | `false` | requireAuth | Card payment, JWT + idempotency |
| `mkv2-checkout` | AUTH | `false` | resolveAuthCpf | Checkout, JWT + idempotency |
| `mkv2-offers` | AUTH | `false` | resolveAuthCpf | Seller offer CRUD |
| `mkv2-orders` | AUTH | `false` | resolveAuthCpf | Buyer order queries |
| `mkv2-store` | AUTH | `false` | resolveAuthCpf | Storefront management |
| `mkv2-social` | AUTH | `false` | resolveAuthCpf | Follow/share features |
| `mkv2-seller-data` | AUTH | `false` | resolveAuthCpf | Seller dashboard data |
| `mkv2-wallet` | AUTH | `false` | resolveAuthCpf | Wallet & payouts + idempotency |
| `mkv2-subscription` | AUTH | `false` | resolveAuthCpf | Subscription management |
| `mkv2-subscription-downgrade` | AUTH | `false` | resolveAuthCpf | Downgrade flow |
| `mkv2-notifications` | AUTH | `false` | resolveAuthCpf | Notification management |
| `mkv2-favorites` | AUTH | `false` | resolveAuthCpf | Favorite lists |
| `mkv2-alerts` | AUTH | `false` | resolveAuthCpf | Price alerts CRUD |
| `push-subscribe` | AUTH | `false` | JWT header | Push subscription registration |
| `vault-redeem-invite` | AUTH | `false` | requireAuth | Invite redemption |
| `vault-tier-check` | AUTH | `false` | requireAuth | Tier eligibility |
| `vault-certificate` | AUTH | `false` | requireAuth | Certificate + ownership |
| `vault-community` | AUTH | `false` | requireAuth | Community features |
| `mkv2-listings` | MIXED | `false` | resolveCpf + PUB set | listings/detail = PUBLIC; others = AUTH |
| `mkv2-engage` | MIXED | `false` | resolveCpf + PUB set | comments/reviews = PUBLIC; writes = AUTH |
| `mkv2-seller` | MIXED | `false` | resolveCpf + PUB set | tier-info/leaderboard = PUBLIC; dash = AUTH |
| `mkv2-fulfill` | MIXED | `false` | resolveCpf + ADMIN set | laudo = PUBLIC; shipping = AUTH; hub = ADMIN |
| `mkv2-order-ops` | MIXED | `false` | resolveCpf + ADMIN set | update-status = AUTH+RBAC; admin-* = ADMIN |
| `mkv2-discover` | MIXED | `false` | optionalAuth | Browse = PUBLIC; personalized = AUTH |
| `mkv2-catalog` | MIXED | `false` | resolveCpf | Browse = PUBLIC; manage = AUTH/ADMIN |
| `mkv2-releases` | MIXED | `false` | optionalAuth | Calendar = PUBLIC; reminders = AUTH |
| `create-admin` | ADMIN | `false` | requireAdmin | Admin creation, admin-only |
| `enrich-descriptions` | ADMIN | `false` | requireAdmin | AI enrichment, admin-only |
| `generate-pdf` | ADMIN | `false` | requireAdmin | PDF generation, admin-only |
| `admin-orders` | ADMIN | `false` | requireAdmin | Admin order management |
| `catalog-sync` | SERVICE | `false` | requireServiceOrAdmin | External catalog sync |
| `catalog-seed-500` | SERVICE | `false` | requireAdmin | Catalog seeding tool |
| `catalog-translate-missing` | SERVICE | `false` | requireServiceOrAdmin | Translation batch |
| `catalog-multisource` | SERVICE | `false` | requireServiceOrAdmin | Multi-source aggregation |
| `mkv2-cron-tasks` | SERVICE | `false` | requireServiceOrAdmin | Scheduled maintenance |
| `mkv2-auto-payout` | SERVICE | `false` | requireServiceOrAdmin | Auto payouts + idempotency |
| `sync-droper-images` | SERVICE | `false` | requireServiceOrAdmin | Image sync from Droper |
| `vault-semester-reset` | SERVICE | `false` | requireServiceOrAdmin | Semester tier reset |
| `vault-sla-monitor` | SERVICE | `false` | requireServiceOrAdmin | SLA monitoring |
| `process-reminders` | SERVICE | `false` | requireServiceOrAdmin | Reminder processing |
| `schedule-reminder` | SERVICE | `false` | requireServiceOrAdmin | Reminder scheduling |
| `cart-recovery` | SERVICE | `false` | requireServiceOrAdmin | Abandoned cart recovery |
| `send-budget-email` | SERVICE | `false` | requireServiceOrAdmin | Email dispatch |
| `send-order-email` | SERVICE | `false` | requireServiceOrAdmin | Email dispatch |
| `send-marketplace-email` | SERVICE | `false` | requireServiceOrAdmin | Email dispatch |
| `send-whatsapp` | SERVICE | `false` | requireServiceOrAdmin | WhatsApp dispatch |
| `send-push` | SERVICE | `false` | requireServiceOrAdmin | Push dispatch |
| `create-notification` | SERVICE | `false` | requireServiceOrAdmin | Notification creation |
| `superfrete` | SERVICE | `false` | requireServiceOrAdmin | Shipping API proxy |

### Residual Risks & Mitigation Plan

| Risk | Severity | Status |
|------|----------|--------|
| ~~INTERNAL functions callable by anyone with anon key~~ | ~~Medium~~ | ✅ **Resolved P2** — All now use `requireServiceOrAdmin` |
| ~~`push-subscribe` inline JWT check~~ | ~~Low~~ | ✅ **Resolved P2** — Migrated to `requireAuth` |
| ~~`push-subscribe` CPF ownership not verified~~ | ~~Medium~~ | ✅ **Resolved P4** — Now validates `authResult.cpf === submitted cpf` |
| ~~`vault-semester-reset`, `vault-sla-monitor` auth unverified~~ | ~~Medium~~ | ✅ **Resolved P2** — Both use `requireServiceOrAdmin` |
| ~~`schedule-reminder`, `process-reminders` auth unverified~~ | ~~Medium~~ | ✅ **Resolved P2** — Both use `requireServiceOrAdmin` |
| ~~`generate-pdf` no auth~~ | ~~Medium~~ | ✅ **Resolved P3** — `requireAdmin` from shared guard |
| ~~`enrich-descriptions` ad-hoc auth~~ | ~~Low~~ | ✅ **Resolved P3** — Migrated to `requireAdmin` shared guard |
| ~~`cart-recovery` no auth~~ | ~~Medium~~ | ✅ **Resolved P3** — `requireServiceOrAdmin` added |
| ~~Structured logging created but not integrated~~ | ~~Low~~ | ✅ **Resolved P4** — `createLogger` integrated in `generate-pix`, `process-card-payment`, `mkv2-auto-payout` |
| ~~No audit trail for payment events~~ | ~~Medium~~ | ✅ **Resolved P4** — `audit_events` logged for pix/card initiated/completed/failed + auto-payout |

### Governance Policy

1. **New functions MUST** use shared guards from `_shared/auth-guard.ts`.
2. **All functions keep** `verify_jwt = false` — JWT validation is done in-code.
3. **Every function entry** in `config.toml` MUST have an inline comment with tier classification.
4. **No function with side-effects** may be invocable without auth.
5. **This matrix** is the single source of truth and must be updated on every new function addition.

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
