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
| `requireAuth(req, sb)` | User-facing functions | JWT → user_id → client_profiles |
| `requireAdmin(req, sb)` | Admin panel functions | JWT → user_id → user_roles(admin) |
| `requireAdminByToken(sb, header)` | Compact/minified functions | Same as above, accepts raw header |
| `resolveAuthCpf(req, sb)` | Marketplace functions | JWT → user_id → cpf resolution |
| Webhook signature | mercadopago-webhook | HMAC-SHA256 signature validation |
| No auth (public) | og-renderer, health-check | Public endpoints, no sensitive data |

### Functions Using Shared Auth Guard (`_shared/auth-guard.ts`)
- `admin-orders` → `requireAdmin`
- `create-admin` → `requireAdmin`
- `catalog-sync` → `requireAdmin`
- `vault-community` → `requireAuth`
- `mkv2-fulfill` → `requireAdminByToken` + `isAdminByToken`
- `mkv2-order-ops` → `requireAdminByToken` + `isAdminByToken`

### Public Endpoints (No Auth Required)
These are intentionally public and contain no sensitive data:
- `health-check` — uptime monitoring
- `og-renderer` — Open Graph meta tags
- `push-vapid-key` — public VAPID key
- `verify-captcha` — CAPTCHA validation
- `mercadopago-webhook` — validates via HMAC signature, not JWT

### Idempotency Protection
Critical payment functions use the `_shared/idempotency.ts` helper:
- Lock acquired before processing
- Lock released on error (allows retry)
- Lock completed on success (prevents duplicate)
- TTL-based expiration as safety net

## Admin Role Validation
All admin checks use `user_roles` table (not `admin_profiles`).
This prevents privilege escalation via profile manipulation.
