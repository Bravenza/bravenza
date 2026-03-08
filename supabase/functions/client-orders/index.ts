/**
 * client-orders — Client portal order/notification queries
 *
 * Auth model: session_token (CPF-based client portal, not Supabase JWT)
 * All actions require a valid, non-expired session_token from client_sessions.
 *
 * Action tiers:
 *   PUBLIC_ACTIONS  → (none)
 *   AUTH_ACTIONS    → get_notifications, mark_notification_read, mark_all_notifications_read, (default: list orders)
 *   ADMIN_ACTIONS   → (none)
 *
 * Note: This function uses session_token auth (not JWT) because the client portal
 * authenticates via CPF + OTP code, creating sessions in the client_sessions table.
 * This is intentionally separate from Supabase Auth and does not use auth-guard.ts.
 * Session validation is centralized at the top of the handler.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/mk-helpers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { session_token, action, notification_id, notification_ids } = body;

    // ── Session-based auth (all actions require valid session) ──
    if (!session_token) {
      return jsonResponse({ error: "Token de sessão é obrigatório" }, 401);
    }

    const { data: sessions, error: sessionError } = await supabase
      .from("client_sessions")
      .select("cpf")
      .eq("session_token", session_token)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (sessionError) throw sessionError;
    if (!sessions || sessions.length === 0) {
      return jsonResponse({ error: "Sessão inválida ou expirada" }, 401);
    }

    const clientCpf = sessions[0].cpf;

    // ── AUTH: get_notifications ──
    if (action === "get_notifications") {
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("target", "client")
        .eq("target_client_cpf", clientCpf)
        .order("created_at", { ascending: false })
        .limit(50);
      return jsonResponse({ success: true, notifications: notifications || [] });
    }

    // ── AUTH: mark_notification_read ──
    if (action === "mark_notification_read" && notification_id) {
      await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notification_id)
        .eq("target_client_cpf", clientCpf);
      return jsonResponse({ success: true });
    }

    // ── AUTH: mark_all_notifications_read ──
    if (action === "mark_all_notifications_read" && notification_ids) {
      await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .in("id", notification_ids)
        .eq("target_client_cpf", clientCpf);
      return jsonResponse({ success: true });
    }

    // ── AUTH (default): list orders with history ──
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        order_id, order_type, current_status, product_name, product_brand,
        product_model, product_size, product_color, product_price, product_currency,
        payment_mode, sinal_value, sinal_paid, sinal_paid_at, balance_value,
        balance_paid, balance_paid_at, budget_status, budget_approval_token,
        international_tracking, national_tracking, national_carrier,
        inspection_photos, client_email, created_at, updated_at
      `)
      .eq("client_cpf", clientCpf)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    // Get client email from first order or vault member
    let clientEmail: string | null = null;
    if (orders && orders.length > 0 && orders[0].client_email) {
      clientEmail = orders[0].client_email;
    } else {
      const { data: vaultMember } = await supabase
        .from("vault_members")
        .select("client_email")
        .eq("client_cpf", clientCpf)
        .limit(1);
      if (vaultMember && vaultMember.length > 0) {
        clientEmail = vaultMember[0].client_email;
      }
    }

    // Get order history for each order
    const ordersWithHistory = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: history } = await supabase
          .from("order_history")
          .select("status, notes, created_at")
          .eq("order_id", order.order_id)
          .order("created_at", { ascending: true });
        return { ...order, history: history || [] };
      })
    );

    return jsonResponse({
      success: true,
      orders: ordersWithHistory,
      cpf: clientCpf,
      client_email: clientEmail,
    });
  } catch (error: any) {
    console.error("Client orders error:", error);
    return jsonResponse({ error: error.message }, 400);
  }
});
