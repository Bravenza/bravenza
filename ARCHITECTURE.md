# Arquitetura — BRAVENZA

> Documentação técnica da arquitetura do sistema para auditoria, onboarding de desenvolvedores e compliance.

---

## 1. Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser/PWA)                  │
│  React 18 + TypeScript + Tailwind + Framer Motion        │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Landing  │ │ Dashboard │ │Marketplace│ │ Admin Panel │ │
│  │  Page    │ │  /app     │ │  /market  │ │   /admin    │ │
│  └─────────┘ └───────────┘ └──────────┘ └─────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (JWT Auth)
┌────────────────────▼────────────────────────────────────┐
│                  SUPABASE (Backend)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Postgres │ │  Auth    │ │ Storage  │ │   Edge     │  │
│  │  + RLS   │ │  (JWT)   │ │ (Files)  │ │ Functions  │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              SERVIÇOS EXTERNOS                           │
│  Stripe · MercadoPago · SuperFrete · WhatsApp API        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Módulos Frontend

### 2.1 Roteamento

O sistema utiliza 5 módulos de rotas com code-splitting total:

| Módulo | Arquivo | Prefixo | Descrição |
|--------|---------|---------|-----------|
| Public | `publicRoutes.tsx` | `/` | Landing, FAQ, políticas, rastreio |
| App | `appRoutes.tsx` | `/app` | Dashboard logado, marketplace mobile |
| Marketplace | `marketplaceRoutes.tsx` | `/marketplace` | Catálogo, PDP, checkout |
| Vault | `vaultRoutes.tsx` | `/vault` | Vault Club (membros) |
| Admin | `adminRoutes.tsx` | `/admin` | Painel administrativo (33+ rotas) |

### 2.2 Hierarquia de Layouts

```
ErrorBoundary
└── HelmetProvider
    └── QueryClientProvider
        └── AuthProvider
            └── BrowserRouter
                ├── PublicLayout (Header + Footer)
                │   └── <Page />
                ├── AdminLayout (Sidebar + TopBar)
                │   └── <AdminPage />
                └── UnifiedDashboard (TopBar + BottomTabBar)
                    └── <Section />
```

### 2.3 Design System

- **Tokens**: Definidos em `index.css` como CSS custom properties HSL
- **Componentes**: shadcn/ui customizados em `src/components/ui/`
- **Tema**: Dark-first com suporte a light mode via `theme-dark` / `theme-light`
- **Tipografia**: Inter (body) + Space Grotesk (display)
- **Cores**: Primary (gold), Background (dark), Foreground (cream)

---

## 3. Modelo de Dados

### 3.1 Tabelas Principais

| Domínio | Tabelas | Descrição |
|---------|---------|-----------|
| **Identidade** | `client_profiles`, `admin_profiles`, `profiles` | Dados de usuários |
| **Pedidos** | `orders`, `order_history`, `order_costs`, `order_requests` | Fluxo de curadoria |
| **Marketplace** | `marketplace_products`, `marketplace_offers`, `marketplace_inspections` | Catálogo e ofertas |
| **Marketplace (Social)** | `marketplace_product_reviews`, `marketplace_product_comments`, `marketplace_seller_follows` | Interações sociais |
| **Marketplace (Financeiro)** | `marketplace_subscriptions`, `marketplace_plans`, `marketplace_fee_tiers` | Planos e monetização |
| **Vault Club** | `vault_members`, `vault_collection_items`, `vault_community_posts` | Programa de fidelidade |
| **Notificações** | `notifications` | Sistema unificado |
| **Auditoria** | `activity_logs`, `cron_execution_logs` | Logs de ações |

### 3.2 Estratégia de Indexação

Índices compostos e parciais em tabelas críticas:

- `marketplace_offers(product_id, status, price)` WHERE `status = 'active'`
- `notifications(target_user_id, read, created_at DESC)` WHERE `read = false`
- `orders(client_cpf, current_status, created_at DESC)`
- `marketplace_products(slug)` WHERE `is_active = true`

---

## 4. Modelo de Segurança

### 4.1 Autenticação

```
Cliente → Supabase Auth (email/password) → JWT
                                          ↓
                    Edge Function → Resolve CPF via client_profiles
                                          ↓
                           assert_caller_owns_cpf(cpf)
```

- **Clientes**: Login por email + senha, CPF vinculado ao `user_id`
- **Admins**: Login por email + senha + MFA/TOTP (AAL2 obrigatório)
- **Sellers**: Mesmo auth de clientes, com perfil `vault_seller_profiles`

### 4.2 Row Level Security (RLS)

**Todas as 79 tabelas** possuem RLS habilitado. Política padrão: deny-all.

| Padrão | Exemplo | Descrição |
|--------|---------|-----------|
| Owner-only | `auth.uid() = user_id` | Usuário vê apenas seus dados |
| Public read | `true` (SELECT) | Dados públicos (produtos, FAQs) |
| Masked PII | Views (`reviews_public`) | CPF mascarado em dados públicos |
| Service-only | `auth.role() = 'service_role'` | Apenas backend (Edge Functions) |

### 4.3 Proteções Adicionais

- **XSS**: Sanitização via `DOMPurify` em todo conteúdo dinâmico
- **CSRF**: JWT em headers (não cookies)
- **Rate Limiting**: 10 tentativas/15min em verificação de autenticidade
- **CSP**: Content Security Policy restritiva no `index.html`
- **Permissions-Policy**: camera, microphone, geolocation desabilitados

---

## 5. Edge Functions — Arquitetura

### 5.1 Padrão de Roteamento

Cada Edge Function é um micro-serviço com roteamento por `action`:

```typescript
// mk-catalog/index.ts
switch (action) {
  case "search":     return handleSearch(req);
  case "product":    return handleProduct(req);
  case "trending":   return handleTrending(req);
}
```

### 5.2 Módulos

| Prefixo | Responsabilidade |
|---------|-----------------|
| `mk-` / `mkv2-` | Marketplace (v1 legado / v2 atual) |
| `vault-` | Vault Club (tiers, certificados, SLA) |
| `send-*` | Notificações (email, WhatsApp) |
| `process-*` | Pagamentos (Stripe, PIX) |
| `generate-*` | Geração de documentos (PDF, PIX QR) |

### 5.3 Shared Helpers (`_shared/`)

- `cors.ts` — Headers CORS padronizados
- `supabase-client.ts` — Cliente com service_role
- `auth-helpers.ts` — Resolução de JWT → CPF
- `email-templates/` — Templates de email (React Email)

---

## 6. PWA & Performance

### 6.1 Cache Strategy (Workbox)

| Recurso | Estratégia | TTL |
|---------|-----------|-----|
| Google Fonts | CacheFirst | 365 dias |
| Imagens estáticas | CacheFirst | 30 dias |
| Supabase Storage | StaleWhileRevalidate | 7 dias |
| API REST | NetworkFirst (10s timeout) | 5 min |
| Edge Functions | NetworkFirst (8s timeout) | 2 min |
| App Shell | NetworkFirst (5s timeout) | 24h |

### 6.2 Bundle Strategy

```
vendor-react     → React, ReactDOM, React Router
vendor-ui        → Radix UI primitives
vendor-motion    → Framer Motion
vendor-query     → TanStack React Query
vendor-supabase  → Supabase JS client
vendor-charts    → Recharts (lazy)
vendor-pdf       → jsPDF (lazy)
```

### 6.3 Apple HIG Compliance

- Nav Bar: 44pt + `env(safe-area-inset-top)`
- Tab Bar: 49pt + `env(safe-area-inset-bottom)`
- Touch targets: ≥ 44px
- Hairline separators: 0.5px
- Dynamic Type: `clamp()` responsive sizing
- `prefers-reduced-motion`: animações desabilitadas
- `prefers-contrast: more`: bordas reforçadas

---

## 7. Testes

| Tipo | Ferramenta | Cobertura |
|------|-----------|-----------|
| Unitários | Vitest | Utilitários e hooks |
| Edge Functions | Deno Test | Endpoints críticos |
| E2E | Manual / Browser Tools | Fluxos completos |

---

## 8. Monitoramento

- **Logs de Auditoria**: `activity_logs` para ações administrativas
- **Cron Logs**: `cron_execution_logs` para jobs programados
- **Verificação de Autenticidade**: `verification_attempts` com IP logging
- **Realtime**: Supabase Channels para notificações admin em tempo real

---

## 9. Compliance

| Requisito | Status | Detalhes |
|-----------|--------|---------|
| LGPD | ✅ | Banner de consentimento, política de privacidade, mascaramento de PII |
| WCAG 2.1 AA | ✅ | Skip-to-content, aria-labels, contrast ratios, reduced-motion |
| Apple HIG | ✅ | Safe areas, touch targets, Dynamic Type, tab/nav bar standards |
| CSP | ✅ | Content Security Policy restritiva |
| Termos de Uso | ✅ | Contrato eletrônico obrigatório antes de pagamento |
