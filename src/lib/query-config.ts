/**
 * Estratégias de cache centralizadas para React Query.
 *
 * Convenção:
 * ┌─────────────────────┬───────────┬─────────────────────────────────────────────┐
 * │ Categoria           │ staleTime │ Exemplos                                    │
 * ├─────────────────────┼───────────┼─────────────────────────────────────────────┤
 * │ REALTIME            │ 0         │ Pedidos, status de pagamento, notificações  │
 * │ SEMI_STATIC         │ 5 min     │ Catálogo, ofertas, reviews, busca           │
 * │ STATIC              │ 30 min    │ FAQs, planos, tiers, configurações          │
 * └─────────────────────┴───────────┴─────────────────────────────────────────────┘
 *
 * Uso em useQuery:
 * ```ts
 * import { STALE } from "@/lib/query-config";
 * useQuery({ queryKey: ["orders"], queryFn: ..., staleTime: STALE.REALTIME });
 * useQuery({ queryKey: ["catalog"], queryFn: ..., staleTime: STALE.SEMI_STATIC });
 * useQuery({ queryKey: ["plans"],   queryFn: ..., staleTime: STALE.STATIC });
 * ```
 *
 * O default global do QueryClient é SEMI_STATIC (5 min).
 */

const MINUTE = 60_000;

export const STALE = {
  /** Dados que mudam em tempo real — sempre refetch */
  REALTIME: 0,
  /** Dados que mudam com frequência moderada (catálogo, ofertas) */
  SEMI_STATIC: 5 * MINUTE,
  /** Dados raramente alterados (config, tiers, FAQs) */
  STATIC: 30 * MINUTE,
} as const;

export const GC_TIME = {
  DEFAULT: 10 * MINUTE,
  LONG: 60 * MINUTE,
} as const;
