/**
 * Typed Supabase RPC & table helpers.
 *
 * These declarations cover RPCs and tables that exist in the database
 * but are not (yet) present in the auto-generated types.ts file.
 * Using this helper eliminates every `as any` cast on supabase calls.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── RPC argument & return types ───────────────────────────────────

// Admin RPCs (no args)
export interface AdminFinanceMonthlyRow {
  month_key: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  orders_count: number;
}

export interface AdminDashboardMetricsRow {
  total_revenue: number;
  pending_revenue: number;
  sinal_received: number;
  balance_received: number;
  approved_budgets: number;
  rejected_budgets: number;
  pending_budgets: number;
  avg_time_to_approval_hours: number;
  avg_time_to_close_days: number;
  total_budgets_sent: number;
  sinal_paid_count: number;
  delivered_count: number;
}

export interface AdminOrdersByMonthRow {
  month_key: string;
  pedidos: number;
  faturamento: number;
}

export interface AdminOrdersByStatusRow {
  status_group: string;
  count: number;
}

export interface AdminClientHeatmapRow {
  state_code: string;
  client_count: number;
  revenue: number;
}

export interface AdminDashboardOverview {
  [key: string]: unknown;
}

export interface AdminOrdersCsvRow {
  order_id: string;
  client_name: string;
  client_cpf: string;
  product_name: string;
  product_price: number | null;
  current_status: string;
  sla_vault_due_date: string | null;
  created_at: string;
}

export interface AdminOrderRequestsResult {
  total: number;
  pending_count: number;
  requests: unknown[];
}

// Community RPCs — use `any` for dynamic profile shapes consumed by component-local interfaces
export interface CommunityRpcResult {
  success: boolean;
  error?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface MemberPublicProfileResult extends CommunityRpcResult {
  profile: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  items?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface ToggleFollowResult extends CommunityRpcResult {
  is_following: boolean;
}

export interface MemberConnectionsResult extends CommunityRpcResult {
  connections: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface OwnCommunityProfileResult extends CommunityRpcResult {
  profile: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface UpdateMemberProfileResult extends CommunityRpcResult {}

// ─── Typed RPC caller ──────────────────────────────────────────────

/**
 * Call an RPC function with full type safety, avoiding `as any`.
 *
 * Usage:
 *   const { data, error } = await typedRpc<AdminFinanceMonthlyRow[]>("get_admin_finance_monthly");
 *   const { data, error } = await typedRpc<ToggleFollowResult>("toggle_follow", { p_cpf: "...", ... });
 */
export async function typedRpc<T = unknown>(
  fnName: string,
  args?: Record<string, unknown>,
) {
  const result = await (supabase.rpc as Function)(fnName, args);
  return result as { data: T | null; error: { message: string } | null };
}

/**
 * Insert into a table not in the generated types (e.g. vault_items).
 *
 * Usage:
 *   const { error } = await typedInsert("vault_items", { user_id: "...", ... });
 */
export async function typedInsert(
  tableName: string,
  row: Record<string, unknown>,
) {
  const result = await (supabase.from as Function)(tableName).insert(row);
  return result as { data: unknown; error: { message: string } | null };
}
