import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, authErrorResponse } from "../_shared/auth-guard.ts";
import { corsHeaders, jsonResponse } from "../_shared/mk-helpers.ts";

const ALLOWED_UPDATE_FIELDS = new Set([
  "client_name", "client_email", "client_phone", "client_address",
  "product_brand", "product_model", "product_name", "product_size",
  "product_color", "product_reference", "product_link",
  "product_cost", "product_price", "shipping_cost", "other_costs",
  "sinal_value", "sinal_paid", "balance_value", "balance_paid",
  "international_tracking", "international_carrier",
  "national_tracking", "national_carrier", "internal_notes",
  "inspection_photos",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let auth;
  try {
    auth = await requireAdmin(req, sb);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── GET ORDER ──
    if (action === "get-order") {
      const { order_id } = body;
      if (!order_id) return jsonResponse({ error: "order_id obrigatório" }, 400);

      const [orderRes, historyRes] = await Promise.all([
        sb.from("orders").select("*").eq("order_id", order_id).single(),
        sb.from("order_history")
          .select("*")
          .eq("order_id", order_id)
          .order("created_at", { ascending: true }),
      ]);

      if (orderRes.error) throw orderRes.error;

      return jsonResponse({
        order: orderRes.data,
        history: historyRes.data || [],
      });
    }

    // ── UPDATE ORDER (editable fields only) ──
    if (action === "update-order") {
      const { order_id, updates } = body;
      if (!order_id || !updates) return jsonResponse({ error: "order_id e updates obrigatórios" }, 400);

      const filtered: Record<string, any> = {};
      for (const key of Object.keys(updates)) {
        if (ALLOWED_UPDATE_FIELDS.has(key)) {
          filtered[key] = updates[key];
        }
      }

      if (Object.keys(filtered).length === 0) {
        return jsonResponse({ error: "Nenhum campo permitido para atualização" }, 400);
      }

      filtered.updated_at = new Date().toISOString();

      const { data, error } = await sb
        .from("orders")
        .update(filtered)
        .eq("order_id", order_id)
        .select("*")
        .single();

      if (error) throw error;
      return jsonResponse({ order: data });
    }

    // ── UPDATE STATUS ──
    if (action === "update-status") {
      const { order_id, current_status, notes, client_cpf, notification } = body;
      if (!order_id || !current_status) {
        return jsonResponse({ error: "order_id e current_status obrigatórios" }, 400);
      }

      const updates: Record<string, any> = {
        current_status,
        updated_at: new Date().toISOString(),
      };

      if (current_status === "ARRIVED_BRAZIL") {
        const balanceDue = new Date();
        balanceDue.setHours(balanceDue.getHours() + 24);
        updates.balance_due_date = balanceDue.toISOString();
      }

      const { error: updateErr } = await sb
        .from("orders")
        .update(updates)
        .eq("order_id", order_id);

      if (updateErr) throw updateErr;

      const { error: histErr } = await sb.from("order_history").insert({
        order_id,
        status: current_status,
        notes: notes || null,
        created_by: auth.userId,
      });

      if (histErr) throw histErr;

      if (client_cpf && notification) {
        try {
          await sb.from("notifications").insert({
            type: "order_status_update",
            target: "client",
            target_client_cpf: client_cpf,
            title: notification.title,
            message: notification.message,
            reference_type: "order",
            reference_id: order_id,
          });
        } catch (e) {
          console.error("Notification insert error:", e);
        }
      }

      return jsonResponse({ success: true, current_status });
    }

    // ── DELETE (mark as LOST) ──
    if (action === "delete-order") {
      const { order_id } = body;
      if (!order_id) return jsonResponse({ error: "order_id obrigatório" }, 400);

      const { error: updateErr } = await sb
        .from("orders")
        .update({ current_status: "LOST", updated_at: new Date().toISOString() })
        .eq("order_id", order_id);

      if (updateErr) throw updateErr;

      await sb.from("order_history").insert({
        order_id,
        status: "LOST",
        notes: "Pedido marcado como perdido pelo administrador",
        created_by: auth.userId,
      });

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (err: any) {
    console.error("admin-orders error:", err);
    return jsonResponse({ error: err.message || "Erro interno" }, 500);
  }
});
