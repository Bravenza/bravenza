# BRAVENZA — Plataforma Premium de Sneakers

> Marketplace autenticado de sneakers com curadoria sob demanda, verificação de autenticidade em 6 etapas e programa de fidelidade (Vault Club).

![Status](https://img.shields.io/badge/status-production-brightgreen) ![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase-blue) ![PWA](https://img.shields.io/badge/PWA-ready-orange) ![Apple HIG](https://img.shields.io/badge/Apple%20HIG-compliant-black)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração Local](#configuração-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Módulos do Sistema](#módulos-do-sistema)
- [Edge Functions](#edge-functions)
- [Padrões de Qualidade](#padrões-de-qualidade)
- [Documentação Complementar](#documentação-complementar)

---

## Visão Geral

A BRAVENZA é uma plataforma B2C/C2C de sneakers que opera em três eixos:

1. **Curadoria Sob Demanda** — O cliente solicita um modelo; a equipe localiza, autentica e entrega.
2. **Marketplace P2P** — Vendedores cadastrados anunciam pares autenticados com inspeção obrigatória.
3. **Vault Club** — Programa de membros com coleção digital, wishlist, drops, ranking e comunidade.

### Personas

| Persona | Área | Descrição |
|---------|------|-----------|
| Cliente Final | `/app`, `/marketplace` | Compra, rastreia pedidos, gerencia coleção |
| Vendedor (Seller) | `/app` (aba Closet/Loja) | Lista produtos, gerencia vendas e payouts |
| Administrador | `/admin` | Gerencia pedidos, moderação, inspeções, finanças |

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilização** | Tailwind CSS + shadcn/ui + Framer Motion |
| **i18n** | react-i18next + i18next (fallback: pt-BR) |
| **Estado** | TanStack React Query (cache + invalidation) |
| **Backend** | Supabase (Postgres + Auth + Storage + Edge Functions) |
| **PWA** | vite-plugin-pwa + Workbox (cache estratificado) |
| **SEO** | react-helmet-async + JSON-LD + Open Graph |
| **PDF** | jsPDF + jspdf-autotable |
| **Pagamento** | Stripe (cartão) + PIX (MercadoPago) |
| **Frete** | SuperFrete API |

---

## Estrutura do Projeto

```
src/
├── assets/           # Imagens e assets estáticos
├── i18n.ts           # Configuração react-i18next
├── locales/
│   └── pt-BR.json    # Dicionário de traduções (pt-BR)
├── components/
│   ├── a11y/         # Acessibilidade (SkipToContent)
│   ├── admin/        # Componentes do painel administrativo
│   ├── auth/         # Formulários de login/registro
│   ├── client/       # Dashboard do cliente (BottomTabBar, OrdersTab, etc.)
│   ├── home/         # Landing page (Header, Hero, Footer)
│   ├── layouts/      # Layouts reutilizáveis (PublicLayout, AdminLayout)
│   ├── marketplace/  # Catálogo, PDP, checkout, ofertas
│   ├── payment/      # Fluxo de pagamento e contratos
│   ├── seo/          # Schemas JSON-LD
│   ├── skeletons/    # Loading states contextuais
│   ├── ui/           # shadcn/ui components
│   └── vault/        # Vault Club (coleção, wishlist, drops)
├── hooks/            # Custom hooks (auth, marketplace, PWA, realtime)
├── integrations/     # Cliente Supabase (auto-gerado)
├── lib/              # Utilitários (formatação, cálculos, sanitização)
├── pages/            # Páginas por módulo
│   ├── admin/        # 33+ rotas administrativas
│   ├── app/          # App logado (marketplace, mais)
│   ├── marketplace/  # PDP, checkout, storefront
│   └── vault/        # Vault Club pages
├── routes/           # Definições de rotas (code-split)
└── test/             # Testes unitários

supabase/
├── functions/        # 55+ Edge Functions (Deno)
│   ├── _shared/      # Helpers compartilhados (auth, email, CORS)
│   ├── mk-*/         # Módulos do Marketplace (v1)
│   ├── mkv2-*/       # Módulos do Marketplace (v2)
│   └── vault-*/      # Módulos do Vault Club
├── migrations/       # Migrações SQL (versionadas)
└── config.toml       # Configuração do projeto Supabase
```

---

## Configuração Local

### Pré-requisitos

- Node.js ≥ 18 (recomendado: via [nvm](https://github.com/nvm-sh/nvm))
- npm ou bun

### Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITÓRIO>
cd bravenza

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:8080`.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção otimizado |
| `npm run preview` | Preview do build de produção |
| `npm run test` | Executa testes com Vitest |

---

## Variáveis de Ambiente

As variáveis são gerenciadas automaticamente pelo Lovable Cloud:

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon key) |

> ⚠️ **Nunca** armazene chaves privadas no código. Use Lovable Cloud Secrets para chaves sensíveis (Stripe, MercadoPago, SuperFrete).

---

## Módulos do Sistema

### 1. Curadoria (Pedidos Sob Demanda)

Fluxo: Solicitação → Orçamento → Aprovação → Pagamento (Sinal + Saldo) → Sourcing → Autenticação → Entrega.

- Tabelas: `orders`, `order_history`, `order_costs`
- Edge Functions: `send-budget-email`, `generate-pix`, `process-card-payment`

### 2. Marketplace P2P

Fluxo: Cadastro de Produto → Listagem com Ofertas → Compra → Inspeção no Hub → Envio → Avaliação.

- Tabelas: `marketplace_products`, `marketplace_offers`, `marketplace_inspections`
- Edge Functions: `mk-catalog`, `mk-checkout`, `mk-fulfill`, `mk-offers`

### 3. Vault Club

Programa de fidelidade com tiers (Bronze → Obsidian), pontos, coleção digital, wishlist e comunidade.

- Tabelas: `vault_members`, `vault_collection_items`, `marketplace_loyalty_points`
- Edge Functions: `vault-tier-check`, `vault-certificate`, `vault-semester-reset`

### 4. Administração

Painel completo com gestão de pedidos, moderação de anúncios, inspeções, finanças e analytics.

- 33+ rotas com code-splitting total
- Realtime via Supabase Channels para notificações

---

## Edge Functions

As Edge Functions rodam em Deno e seguem o padrão de roteamento por ação via query params:

```
GET /mk-catalog?action=search&q=jordan
POST /mk-offers?action=create
```

### Convenções

- **Autenticação**: JWT via `Authorization: Bearer <token>` — CPF resolvido server-side
- **CORS**: Gerenciado pelo helper `_shared/cors.ts`
- **Validação**: Proprietários verificados via `assert_caller_owns_cpf()`
- **Rate Limiting**: Implementado em endpoints sensíveis (verify-authenticity)

---

## Padrões de Qualidade

### Segurança
- ✅ RLS (Row Level Security) em **todas** as tabelas
- ✅ Autenticação JWT com resolução de CPF server-side
- ✅ Sanitização XSS via `DOMPurify` em conteúdo dinâmico
- ✅ MFA/TOTP obrigatório para administradores
- ✅ Views públicas com mascaramento de PII
- ✅ CSP (Content Security Policy) configurada

### Internacionalização (i18n)
- ✅ react-i18next configurado com fallback `pt-BR`
- ✅ Todas as páginas públicas utilizam chaves de tradução (`useTranslation`)
- ✅ Dicionário centralizado em `src/locales/pt-BR.json` (~400 chaves)
- ✅ SEO metadata (títulos e descrições) gerenciado via i18n

### Performance
- ✅ Code-splitting em todas as rotas (lazy + Suspense)
- ✅ Cache PWA estratificado (CacheFirst para assets, NetworkFirst para API)
- ✅ Índices compostos e parciais no banco de dados
- ✅ Manual chunks no Vite (vendor-react, vendor-ui, vendor-charts)
- ✅ Debounce de 400ms em buscas globais

### Acessibilidade (WCAG 2.1 AA)
- ✅ Skip to Content funcional
- ✅ `aria-labels` e `aria-current` em navegação
- ✅ `prefers-reduced-motion` respeitado
- ✅ `prefers-contrast: more` com bordas reforçadas
- ✅ Alvos de toque ≥ 44px (Apple HIG)
- ✅ Inputs com `font-size: 16px` (previne zoom no iOS)

### Apple HIG Compliance
- ✅ Nav Bar 44pt + Tab Bar 49pt
- ✅ Safe Areas (Dynamic Island + Home Indicator)
- ✅ Dynamic Type support
- ✅ Hairline separators (0.5px)
- ✅ PWA standalone optimizations
- ✅ LGPD consent banner

---

## Documentação Complementar

| Documento | Descrição |
|-----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura detalhada, fluxo de dados e modelo de segurança |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guia de contribuição, padrões de código e workflow de PRs |

---

## Licença

Proprietário — BRAVENZA LTDA. Todos os direitos reservados.
