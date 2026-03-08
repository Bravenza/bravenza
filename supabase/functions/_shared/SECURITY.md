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

**Admin functions (auth-guard.ts → requireAdmin):**
- `admin-orders`, `create-admin`, `catalog-sync`

**Auth-required (mk-helpers.ts → resolveAuthCpf):**
- `mkv2-wallet`, `mkv2-offers`, `mkv2-social`, `mkv2-seller-data`
- `mkv2-orders`, `mkv2-store`, `mkv2-order-ops`, `mkv2-checkout`

**Mixed public/auth (mk-helpers.ts → resolveCpf + PUB set):**
- `mkv2-engage` (PUB: product-comments, product-reviews, product-analytics, check-purchase)
- `mkv2-listings` (PUB: listings, listing-detail, seller-public-profile)
- `mkv2-seller` (PUB: seller-tier-info, seller-leaderboard)
- `mkv2-fulfill` (PUB: laudo-lookup, check-auto-payout)

**Admin checks within mixed functions (auth-guard.ts):**
- `mkv2-fulfill` → `requireAdminByToken` for resolve-dispute, `isAdminByToken` for send-message
- `mkv2-order-ops` → `isAdminByToken` for update-order-status RBAC

**Standalone auth (vault-community → requireAuth):**
- `vault-community`

### Public Endpoints (No Auth Required)
These are intentionally public and contain no sensitive data:
- `health-check` — uptime monitoring
- `og-renderer` — Open Graph meta tags
- `push-vapid-key` — public VAPID key
- `verify-captcha` — CAPTCHA validation
- `mercadopago-webhook` — validates via HMAC signature, not JWT

## Idempotency Protection

Critical payment functions use the `_shared/idempotency.ts` helper:
- **Lock acquired** before processing (`status: "processing"`)
- **Marked failed** on error with `markIdempotencyFailed()` (records error, allows retry on next request)
- **Completed** on success with `setIdempotencyResult()` (prevents duplicate)
- **TTL-based expiration** as safety net (default 5-15 min)
- **Failed status** is auto-cleared on next `checkIdempotency()` call

### Functions using idempotency:
- `process-card-payment` → `card-{orderId}-{type}`
- `generate-pix` → `pix-{orderId}-{type}`
- `mkv2-checkout` → `mkt-checkout-{ids}-{method}`
- `mkv2-auto-payout` → `auto-payout-{date}`

## Admin Role Validation
All admin checks use `user_roles` table (not `admin_profiles`).
This prevents privilege escalation via profile manipulation.
