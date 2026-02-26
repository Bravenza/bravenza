# Guia de Contribuição — BRAVENZA

> Padrões de código, workflow de desenvolvimento e guidelines para colaboradores.

---

## 📋 Índice

- [Setup do Ambiente](#setup-do-ambiente)
- [Estrutura de Branches](#estrutura-de-branches)
- [Padrões de Código](#padrões-de-código)
- [Convenções de Componentes](#convenções-de-componentes)
- [Convenções de Edge Functions](#convenções-de-edge-functions)
- [Banco de Dados](#banco-de-dados)
- [Checklist de PR](#checklist-de-pr)

---

## Setup do Ambiente

```bash
# Clone e instale
git clone <URL>
cd bravenza
npm install

# Desenvolvimento
npm run dev       # http://localhost:8080

# Testes
npm run test      # Vitest
```

### Requisitos
- Node.js ≥ 18
- Editor com suporte a TypeScript + Tailwind CSS IntelliSense
- Extensão ESLint ativa

---

## Estrutura de Branches

| Branch | Propósito |
|--------|----------|
| `main` | Produção — deploys automáticos |
| `feature/*` | Novas funcionalidades |
| `fix/*` | Correções de bugs |
| `refactor/*` | Refatorações sem mudança de comportamento |

---

## Padrões de Código

### TypeScript

- **Strict mode** habilitado
- Evite `any` — use tipos explícitos ou `unknown`
- Prefira interfaces sobre types para objetos
- Exporte tipos junto com os componentes

```typescript
// ✅ Correto
interface OrderCardProps {
  order: Order;
  onSelect: (id: string) => void;
}

export function OrderCard({ order, onSelect }: OrderCardProps) { ... }

// ❌ Evite
export function OrderCard({ order, onSelect }: any) { ... }
```

### Tailwind CSS

- **Nunca** use cores diretas (`text-white`, `bg-black`)
- **Sempre** use tokens semânticos do design system (`text-foreground`, `bg-background`, `text-primary`)
- Cores definidas em `index.css` como HSL custom properties

```tsx
// ✅ Correto
<div className="bg-background text-foreground border-border">

// ❌ Evite
<div className="bg-[#1f1f1f] text-white border-gray-700">
```

### Imports

Ordem padronizada:
1. React e bibliotecas externas
2. i18n (`react-i18next`)
3. Componentes UI (`@/components/ui/`)
4. Componentes do domínio (`@/components/marketplace/`)
5. Hooks (`@/hooks/`)
6. Utilitários (`@/lib/`)
7. Tipos

```typescript
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/client/OrderCard";

import { useClientAuth } from "@/hooks/useClientAuth";
import { formatPriceBR } from "@/lib/budget-calculator";

import type { Order } from "@/types";
```

---

## Convenções de Componentes

### Criação

- Um componente por arquivo
- Nome do arquivo = nome do componente (PascalCase)
- Componentes pesados devem ser `lazy()`
- Use `memo()` para componentes que recebem props estáveis

```typescript
// Componente com memo (para listas, layouts estáticos)
const OrderCardComponent = ({ order }: OrderCardProps) => { ... };
export const OrderCard = memo(OrderCardComponent);

// Componente com lazy loading (para páginas e modais pesados)
const OrderDetails = lazy(() => import("@/components/OrderDetails"));
```

### Loading States

- Use `Skeleton` para loading de conteúdo
- Use `LoadingButton` para ações que fazem requests
- Nunca deixe a tela em branco durante carregamento

### Error Handling

- Use `SectionErrorBoundary` para isolar falhas em seções da página
- Use `ErrorBoundary` global no `App.tsx`
- Toast para erros de ação do usuário (não use `alert()`)

### Responsividade

- Mobile-first: escreva classes mobile, depois `md:` e `lg:`
- Tab bar bottom: considere `pb-[49px]` em containers com scroll
- Safe areas: use `env(safe-area-inset-*)` em elementos fixed

---

## Convenções de Edge Functions

### Estrutura

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Parse action
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // 3. Route to handler
  switch (action) {
    case "list": return handleList(req);
    case "create": return handleCreate(req);
    default:
      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
  }
});
```

### Autenticação

```typescript
// Sempre resolva o usuário via JWT — nunca confie em headers do cliente
const authHeader = req.headers.get("Authorization");
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace("Bearer ", "")
);
```

### Respostas

- Sempre retorne JSON com `Content-Type: application/json`
- Use status codes HTTP corretos (200, 201, 400, 401, 403, 404, 500)
- Inclua CORS headers em todas as respostas

---

## Banco de Dados

### Migrações

- Use a ferramenta de migração do Lovable Cloud (nunca edite SQL manualmente no banco)
- Toda tabela nova **deve** ter RLS habilitado
- Toda tabela com dados de usuário **deve** ter política de owner-only

### Naming Conventions

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Tabelas | snake_case, plural | `marketplace_products` |
| Colunas | snake_case | `created_at`, `user_id` |
| Índices | `idx_<tabela>_<colunas>` | `idx_mo_product_status_price` |
| Políticas RLS | Frase descritiva | `"Users can view their own orders"` |
| Views | `<domínio>_public` | `reviews_public` |

### RLS — Regras

```sql
-- Owner-only (padrão para dados privados)
CREATE POLICY "Users see own data"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Public read (catálogo, FAQs)
CREATE POLICY "Everyone can read products"
  ON public.marketplace_products FOR SELECT
  USING (is_active = true);

-- Service-only (backend apenas)
CREATE POLICY "Service role only"
  ON public.activity_logs FOR INSERT
  USING (auth.role() = 'service_role');
```

---

## Checklist de PR

Antes de submeter um Pull Request, verifique:

### Funcionalidade
- [ ] A feature funciona no mobile (390px) e desktop (1920px)
- [ ] Loading states implementados (Skeleton ou Spinner)
- [ ] Erros tratados com toast ou error boundary
- [ ] Fluxo testado com dados reais e dados vazios

### Código
- [ ] Sem `any` no TypeScript
- [ ] Sem cores hardcoded no Tailwind (usar tokens)
- [ ] Componentes pesados com `lazy()` + `Suspense`
- [ ] Imports organizados na ordem padrão

### Internacionalização (i18n)
- [ ] Strings de UI em páginas públicas usam `t("chave")` via `useTranslation`
- [ ] Novas chaves adicionadas em `src/locales/pt-BR.json`
- [ ] Chaves organizadas por domínio (`modulo.subchave`)
- [ ] SEO metadata usa chaves i18n (`metaTitle`, `metaDescription`)

### Segurança
- [ ] Novas tabelas com RLS habilitado
- [ ] Dados do usuário protegidos por política owner-only
- [ ] Inputs sanitizados se renderizam HTML
- [ ] Sem chaves privadas no código
- [ ] Formulários sensíveis com reCAPTCHA v3

### Notificações
- [ ] Ações relevantes disparam notificação (in-app e/ou push)
- [ ] Toast para feedback imediato ao usuário

### Acessibilidade
- [ ] Botões e links com `aria-label` quando sem texto visível
- [ ] Formulários com labels associados
- [ ] Alvos de toque ≥ 44px no mobile
- [ ] Funciona com `prefers-reduced-motion: reduce`

### Performance
- [ ] Imagens com `loading="lazy"` ou componente `OptimizedImage`
- [ ] Novas rotas com code-splitting (`lazy()`)
- [ ] Queries com `staleTime` adequado
- [ ] Sem re-renders desnecessários (verificar com React DevTools)

---

## Dúvidas?

Consulte a documentação complementar:
- [README.md](./README.md) — Visão geral e setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitetura técnica detalhada
