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
│                    + Service Worker (Push)                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (JWT Auth)
┌────────────────────▼────────────────────────────────────┐
│                  SUPABASE (Backend)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Postgres │ │  Auth    │ │ Storage  │ │   Edge     │  │
│  │  + RLS   │ │  (JWT)   │ │ (Files)  │ │ Functions  │  │
│  │  (80+    │ │  + MFA   │ │          │ │  (60+)     │  │
│  │  tables) │ │          │ │          │ │            │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              SERVIÇOS EXTERNOS                           │
│  Stripe · MercadoPago · SuperFrete · WhatsApp API        │
│  Google reCAPTCHA · Web Push (VAPID)                     │
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
- **Animações**: Framer Motion com respeito a `prefers-reduced-motion`

---

## 3. Internacionalização (i18n)

| Item | Detalhe |
|------|---------|
| **Biblioteca** | `i18next` + `react-i18next` |
| **Locale padrão / fallback** | `pt-BR` |
| **Dicionário** | `src/locales/pt-BR.json` (~400 chaves) |
| **Escopo atual** | Todas as páginas públicas (Home, FAQ, Autenticidade, Instalar, Solicitação, Termos, Privacidade, Devoluções, Status, Rastreio) |
| **Componentes compartilhados** | Header, Footer, HeroSection, CTASection e demais seções da landing |
| **Expansão futura** | Admin, App logado e Vault Club (incremental) |

### Convenções

- Chaves organizadas por domínio: `header.*`, `hero.*`, `faq.*`, `orderRequest.*`, etc.
- SEO metadata gerenciado via chaves `*.metaTitle` / `*.metaDescription`
- Componentes usam `const { t } = useTranslation()` — sem `useSuspense`
- Configuração em `src/i18n.ts`, importado no `App.tsx`

---

## 4. Modelo de Dados

### 4.1 Tabelas Principais

| Domínio | Tabelas | Descrição |
|---------|---------|-----------|
| **Identidade** | `client_profiles`, `admin_profiles`, `profiles`, `client_addresses`, `client_preferences` | Dados de usuários e preferências |
| **Pedidos** | `orders`, `order_history`, `order_costs`, `order_requests` | Fluxo de curadoria |
| **Marketplace** | `marketplace_products`, `marketplace_offers`, `marketplace_inspections` | Catálogo e ofertas |
| **Marketplace (Social)** | `marketplace_product_reviews`, `marketplace_product_comments`, `marketplace_seller_follows`, `marketplace_seller_badges` | Interações sociais |
| **Marketplace (Financeiro)** | `marketplace_subscriptions`, `marketplace_plans`, `marketplace_fee_tiers`, `marketplace_coupons`, `marketplace_autocut_rules` | Planos, cupons e monetização |
| **Marketplace (Avançado)** | `marketplace_consignments`, `marketplace_negotiation_events`, `marketplace_watchlist`, `marketplace_saved_searches`, `marketplace_price_history` | Consignação, negociação, watchlist, histórico de preços |
| **Marketplace (Engagement)** | `marketplace_activity_feed`, `marketplace_drop_reminders`, `abandoned_carts` | Feed de atividades, lembretes de drops, carrinho abandonado |
| **Vault Club** | `vault_members`, `vault_collection_items`, `vault_community_posts` | Programa de fidelidade e comunidade |
| **Notificações** | `notifications`, `push_subscriptions` | Sistema unificado + Web Push |
| **Auditoria** | `activity_logs`, `cron_execution_logs` | Logs de ações |
| **Auth** | `client_auth_tokens`, `client_sessions`, `client_documents` | Tokens, sessões e documentos |

### 4.2 Estratégia de Indexação

Índices compostos e parciais em tabelas críticas:

- `marketplace_offers(product_id, status, price)` WHERE `status = 'active'`
- `notifications(target_user_id, read, created_at DESC)` WHERE `read = false`
- `orders(client_cpf, current_status, created_at DESC)`
- `marketplace_products(slug)` WHERE `is_active = true`
- `push_subscriptions(user_cpf, endpoint)` UNIQUE
- `abandoned_carts(user_cpf)` para upsert

---

## 5. Modelo de Segurança

### 5.1 Autenticação

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

### 5.2 Row Level Security (RLS)

**Todas as 80+ tabelas** possuem RLS habilitado. Política padrão: deny-all.

| Padrão | Exemplo | Descrição |
|--------|---------|-----------|
| Owner-only | `auth.uid() = user_id` | Usuário vê apenas seus dados |
| Public read | `true` (SELECT) | Dados públicos (produtos, FAQs) |
| Masked PII | Views (`reviews_public`) | CPF mascarado em dados públicos |
| Service-only | `auth.role() = 'service_role'` | Apenas backend (Edge Functions) |

### 5.3 Proteções Adicionais

- **reCAPTCHA v3**: Verificação server-side via `verify-captcha` Edge Function (score ≥ 0.5)
- **XSS**: Sanitização via `DOMPurify` em todo conteúdo dinâmico
- **CSRF**: JWT em headers (não cookies)
- **Rate Limiting**: 10 tentativas/15min em verificação de autenticidade
- **CSP**: Content Security Policy restritiva no `index.html`
- **Permissions-Policy**: camera, microphone, geolocation desabilitados

---

## 6. Edge Functions — Arquitetura

### 6.1 Padrão de Roteamento

Cada Edge Function é um micro-serviço com roteamento por `action`:

```typescript
// mkv2-catalog/index.ts
switch (action) {
  case "search":     return handleSearch(req);
  case "product":    return handleProduct(req);
  case "trending":   return handleTrending(req);
}
```

### 6.2 Módulos (60+ funções)

| Prefixo | Responsabilidade |
|---------|-----------------|
| `mkv2-*` | Marketplace v2 (catálogo, ofertas, pedidos, seller, social, store, discover, fulfill, listings) |
| `mk-*` | Marketplace v1 (legado, em migração) |
| `vault-*` | Vault Club (tiers, certificados, SLA, reset semestral, resgatar convite) |
| `send-*` | Notificações (email pedido, email marketplace, email orçamento, WhatsApp) |
| `push-*` / `send-push` | Web Push (subscribe, VAPID key, envio via Web Push Protocol) |
| `process-*` | Pagamentos (cartão Stripe, reminders) |
| `generate-*` | Geração de documentos (PDF, PIX QR) |
| `cart-recovery` | Recuperação de carrinho abandonado |
| `health-check` | Monitoramento de todos os serviços |
| `verify-captcha` | Verificação reCAPTCHA v3 |
| `verify-authenticity` | Verificação de autenticidade com rate limiting |

### 6.3 Shared Helpers (`_shared/`)

- `cors.ts` — Headers CORS padronizados
- `supabase-client.ts` — Cliente com service_role
- `auth-helpers.ts` — Resolução de JWT → CPF
- `email-templates/` — Templates de email (React Email)

---

## 7. Notificações — Arquitetura Multicanal

### 7.1 Web Push

```
Browser → requestPermission() → PushManager.subscribe(VAPID)
                                        ↓
push-subscribe (Edge Function) → push_subscriptions (DB)
                                        ↓
send-push (Edge Function) → Web Push Protocol (RFC 8030)
                                        ↓
                              sw-push.js (Service Worker) → showNotification()
```

- **VAPID**: Chaves gerenciadas via Cloud Secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
- **Service Worker**: `sw-push.js` customizado para push events
- **Hooks**: `usePushNotifications()` gerencia estado, permissão e assinatura
- **UI**: `PushNotificationPrompt` com variantes `banner` e `card`

### 7.2 Cart Recovery

```
Checkout Page → useCartAbandonment() → beforeunload/unmount
                                              ↓
                    cart-recovery?action=record → abandoned_carts (DB)
                                              ↓
              (Cron/manual) cart-recovery?action=process → send-marketplace-email + send-push
```

- Detecção via `beforeunload` + cleanup no unmount do React
- `sendBeacon` para confiabilidade durante page unload
- Processamento após 1 hora de abandono
- Multicanal: email + push notification

### 7.3 Realtime

- Supabase Channels para notificações in-app em tempo real
- `subscribeToRealtimeNotifications()` escuta INSERTs na tabela `notifications`
- Notificações admin via `useRealtimeAdmin()`

---

## 8. Marketplace P2P — Funcionalidades Avançadas

### 8.1 Consignação

Fluxo: Solicitação → Envio ao Hub → Recebimento → Inspeção → Fotografia → Listagem → Venda → Payout.

- Tabela: `marketplace_consignments` com 20+ campos de estado
- Fee configurável por seller (`fee_percent`)

### 8.2 Cupons & Auto-cut

- **Cupons**: Sellers criam códigos com desconto fixo ou percentual, limite de usos e validade
- **Auto-cut**: Redução automática de preço em intervalos (ex: -R$10 a cada 24h até mín.)
- Tabelas: `marketplace_coupons`, `marketplace_autocut_rules`

### 8.3 Negociação & Disputas

- Timeline de eventos (oferta, contraproposta, aceitação, rejeição)
- Mediação administrativa com notas internas
- Tabela: `marketplace_negotiation_events`

### 8.4 Analytics & Wallet

- Dashboard do seller com métricas de views, vendas, conversão
- Painel de wallet com histórico de payouts
- Componentes: `SellerAnalyticsDashboard`, `WalletPanel`

---

## 9. Vault Club — Gamificação & Comunidade

### 9.1 Comunidade

Rede social interna para membros:

| Funcionalidade | Componente | Descrição |
|----------------|------------|-----------|
| Feed | `CommunityFeedTabs` | Tabs com feed global e seguidos |
| Posts | `CommunityNewPost` + `RichTextEditor` | Criação com rich text e mídia |
| Reações | `ReactionPicker` + `ReactionSummary` | Reações com emojis |
| Comentários | `InlineComments` + `CommunityComments` | Comentários inline e thread |
| Perfis | `CommunityProfile` + `CommunityProfileEdit` | Perfil público e edição |
| Conexões | `CommunityConnectionsList` | Lista de seguidores/seguindo |
| Trending | `CommunityTrending` | Posts em alta |
| Report | `ReportPostDialog` | Denúncia de conteúdo |
| Mídia | `MediaGallery` | Galeria de fotos/vídeos |
| Online | `CommunityOnlineUsers` | Membros online |

### 9.2 Drops & Intel

- **Stories**: Carrossel tipo Instagram com auto-play (`DropsStories` + `DropsStoryViewer`)
- **Hero Card**: Destaque editorial com imagem full-width (`DropsHeroCard`)
- **Editorial**: Cards de conteúdo curado (`DropsEditorialCard`)
- **Filtros**: Por categoria e marca (`DropsFilters`)

### 9.3 Gamificação

- **Streak**: Login diário com milestones (7, 14, 30, 60, 90 dias) e animação de flame
- **Ranking**: Leaderboard de membros por pontos
- **Onboarding Tour**: Tour guiado com 5 etapas (Wishlist, Coleção, Drops, Marketplace, Comunidade)

---

## 10. PWA & Performance

### 10.1 Cache Strategy (Workbox)

| Recurso | Estratégia | TTL |
|---------|-----------|-----|
| Google Fonts | CacheFirst | 365 dias |
| Imagens estáticas | CacheFirst | 30 dias |
| Supabase Storage | StaleWhileRevalidate | 7 dias |
| API REST | NetworkFirst (10s timeout) | 5 min |
| Edge Functions | NetworkFirst (8s timeout) | 2 min |
| App Shell | NetworkFirst (5s timeout) | 24h |

### 10.2 Bundle Strategy

```
vendor-react     → React, ReactDOM, React Router
vendor-ui        → Radix UI primitives
vendor-motion    → Framer Motion
vendor-query     → TanStack React Query
vendor-supabase  → Supabase JS client
vendor-charts    → Recharts (lazy)
vendor-pdf       → jsPDF (lazy)
```

### 10.3 UX Enhancements

- **Scroll Restoration**: `useScrollRestoration()` preserva posição entre rotas
- **Success Sound**: `useSuccessSound()` feedback sonoro em ações concluídas
- **PWA Optimizations**: `usePWAOptimizations()` otimizações de cache e preload

### 10.4 Apple HIG Compliance

- Nav Bar: 44pt + `env(safe-area-inset-top)`
- Tab Bar: 49pt + `env(safe-area-inset-bottom)`
- Touch targets: ≥ 44px
- Hairline separators: 0.5px
- Dynamic Type: `clamp()` responsive sizing
- `prefers-reduced-motion`: animações desabilitadas
- `prefers-contrast: more`: bordas reforçadas

---

## 11. Monitoramento

### 11.1 Health Check

Edge Function `health-check` verifica todos os serviços em paralelo:

| Serviço | Verificação |
|---------|-------------|
| Database | SELECT em tabela `faqs` |
| Auth | GET `/auth/v1/settings` |
| Storage | GET `/storage/v1/bucket` |
| Stripe | GET `/v1/balance` |
| MercadoPago | GET `/v1/payment_methods` |
| SuperFrete | POST `/api/v0/calculator` |

Retorna status global: `operational`, `degraded` ou `down` com latência individual.

### 11.2 Logs

- **Auditoria**: `activity_logs` para ações administrativas
- **Cron**: `cron_execution_logs` para jobs programados
- **Verificação de Autenticidade**: `verification_attempts` com IP logging
- **Realtime**: Supabase Channels para notificações admin em tempo real

---

## 12. Testes

| Tipo | Ferramenta | Cobertura |
|------|-----------|-----------|
| Unitários | Vitest | Utilitários e hooks |
| Edge Functions | Deno Test | Endpoints críticos |
| E2E | Manual / Browser Tools | Fluxos completos |

---

## 13. Compliance

| Requisito | Status | Detalhes |
|-----------|--------|---------|
| LGPD | ✅ | Banner de consentimento, política de privacidade, mascaramento de PII |
| WCAG 2.1 AA | ✅ | Skip-to-content, aria-labels, contrast ratios, reduced-motion |
| Apple HIG | ✅ | Safe areas, touch targets, Dynamic Type, tab/nav bar standards |
| CSP | ✅ | Content Security Policy restritiva |
| Termos de Uso | ✅ | Contrato eletrônico obrigatório antes de pagamento |
| reCAPTCHA | ✅ | Verificação anti-bot em formulários sensíveis |
