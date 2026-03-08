/**
 * mkv2-order-ops — Order operations (status updates, admin views, buyer cancellation)
 *
 * Auth model: Supabase JWT via shared auth-guard.ts
 *
 * Action tiers:
 *   PUBLIC_ACTIONS  → (none)
 *   AUTH_ACTIONS    → update-order-status (seller RBAC), cancel-buyer-order
 *   ADMIN_ACTIONS   → admin-orders, admin-disputes, update-order-status (full), payout_released
 *
 * All actions require authentication. Admin actions additionally require admin role.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  requireAuth,
  requireAdmin,
  authErrorResponse,
  AuthError,
} from "../_shared/auth-guard.ts";
import {
  corsHeaders,
  jsonResponse,
  getMemberEmail,
  sendMarketplaceEmail,
  sendMarketplaceWhatsApp,
  notify,
} from "../_shared/mk-helpers.ts";

// ── Action tier constants ──
const PUBLIC_ACTIONS = new Set<string>([]); // None — all actions require auth
const AUTH_ACTIONS = new Set(["update-order-status", "cancel-buyer-order"]);
const ADMIN_ACTIONS = new Set(["admin-orders", "admin-disputes"]);
// update-order-status uses RBAC: admin can set any status, seller limited set
// cancel-buyer-order is auth (buyer must own the order)
// payout_released within update-order-status is admin-only (checked inline)

const sc = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

const refundMP = async (mpPaymentId: string, orderId: string) => {
  const tk = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!tk) {
    console.error(`[mkv2-order-ops] MERCADO_PAGO_ACCESS_TOKEN not set. Cannot refund order ${orderId}.`);
    return;
  }
  try {
    const r = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tk}`,
          "X-Idempotency-Key": `refund-${orderId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );
    if (!r.ok) {
      const t = await r.text();
      console.error(`[mkv2-order-ops] MP refund failed order=${orderId} payment=${mpPaymentId}: ${r.status} ${t}`);
    } else {
      console.log(`[mkv2-order-ops] MP refund initiated order=${orderId} payment=${mpPaymentId}`);
    }
  } catch (e) {
    console.error(`[mkv2-order-ops] MP refund exception order=${orderId}:`, e);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = sc();
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const method = req.method;

  try {
    // ── All actions require authentication via shared guard ──
    const auth = await requireAuth(req, sb);
    const cpf = auth.cpf;

    if (!cpf) {
      return jsonResponse({ error: "Perfil de cliente não encontrado" }, 403);
    }

    // ── Admin-only actions: validate via shared guard ──
    if (ADMIN_ACTIONS.has(action || "")) {
      await requireAdmin(req, sb);
    }

    // ═══════════════════════════════════════════════
    // ADMIN: admin-orders
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "admin-orders") {
      const st = url.searchParams.get("status");
      const search = url.searchParams.get("search");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const pg = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
      const ps = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20")));
      const fr = (pg - 1) * ps;
      const to = fr + ps - 1;

      let q = sb
        .from("vault_marketplace_orders")
        .select(
          `*,listing:vault_marketplace_listings(title,brand,model,size,photos,condition)`,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (st && st !== "all") q = q.eq("status", st);
      if (search) q = q.or(`order_code.ilike.%${search}%,buyer_name.ilike.%${search}%`);
      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo) q = q.lte("created_at", dateTo);
      q = q.range(fr, to);

      const { data, error, count } = await q;
      if (error) throw error;
      return jsonResponse({ orders: data || [], total: count || 0, page: pg, pageSize: ps });
    }

    // ═══════════════════════════════════════════════
    // ADMIN: admin-disputes
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "admin-disputes") {
      const disputeStatus = url.searchParams.get("status");
      const openedBefore = url.searchParams.get("opened_before");
      const pg = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
      const ps = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50")));
      const fr = (pg - 1) * ps;
      const to = fr + ps - 1;

      let q = sb
        .from("vault_marketplace_orders")
        .select(
          `*,listing:vault_marketplace_listings(title,brand,model,size,photos,condition)`,
          { count: "exact" }
        )
        .not("dispute_status", "is", null)
        .order("dispute_opened_at", { ascending: false });

      if (disputeStatus === "open") q = q.eq("dispute_status", "open");
      else if (disputeStatus === "resolved") q = q.eq("dispute_status", "resolved");
      if (openedBefore) q = q.lt("dispute_opened_at", openedBefore);
      q = q.range(fr, to);

      const { data, error, count } = await q;
      if (error) throw error;
      return jsonResponse({ disputes: data || [], total: count || 0, page: pg, pageSize: ps });
    }

    // ═══════════════════════════════════════════════
    // AUTH (RBAC): update-order-status
    // Admin → any status; Seller → limited set
    // ═══════════════════════════════════════════════
    if (method === "PUT" && action === "update-order-status") {
      const b = await req.json();

      // Check if caller is admin (no throw — just a boolean check)
      let isAdmin = false;
      try {
        await requireAdmin(req, sb);
        isAdmin = true;
      } catch (_) {
        // Not admin — that's fine for seller-allowed statuses
      }

      const sellerAllowedStatuses = ["shipped", "in_transit_to_hub"];

      if (!isAdmin) {
        // Verify caller is the seller of this order
        const { data: od2 } = await sb
          .from("vault_marketplace_orders")
          .select("seller_id")
          .eq("id", b.order_id)
          .single();
        if (!od2) return jsonResponse({ error: "Pedido não encontrado" }, 404);

        const { data: sp2 } = await sb
          .from("vault_seller_profiles")
          .select("member:vault_members!inner(client_cpf)")
          .eq("id", od2.seller_id)
          .single();
        if (!sp2 || sp2.member?.client_cpf !== cpf)
          return jsonResponse({ error: "Acesso negado" }, 403);
        if (!sellerAllowedStatuses.includes(b.status))
          return jsonResponse({ error: `Vendedor não pode definir status "${b.status}"` }, 403);
      }

      const u: any = { status: b.status };

      if (b.status === "shipped") {
        u.shipped_at = new Date().toISOString();
        u.tracking_code = b.tracking_code || null;
      } else if (b.status === "delivered") {
        u.delivered_at = new Date().toISOString();
      } else if (b.status === "cancelled") {
        u.cancelled_at = new Date().toISOString();
        if (b.listing_id)
          await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", b.listing_id);
        const { data: rfd } = await sb
          .from("vault_marketplace_orders")
          .select("mp_payment_id,status")
          .eq("id", b.order_id)
          .single();
        if (rfd?.mp_payment_id && ["paid", "in_transit_to_hub", "shipped"].includes(rfd.status))
          await refundMP(rfd.mp_payment_id, b.order_id);
      } else if (b.status === "payout_released") {
        // payout_released is admin-only — enforce via shared guard
        await requireAdmin(req, sb);
        u.payout_released_at = new Date().toISOString();
        u.payout_method = b.payout_method || "pix";
        u.payout_proof_url = b.payout_proof_url || null;

        const { data: od } = await sb
          .from("vault_marketplace_orders")
          .select("listing_id,sale_price,seller_id")
          .eq("id", b.order_id)
          .single();

        if (od?.listing_id) {
          const { data: li } = await sb
            .from("vault_marketplace_listings")
            .select("product_id")
            .eq("id", od.listing_id)
            .maybeSingle();
          if (li?.product_id) {
            await sb
              .from("marketplace_offers")
              .update({ status: "sold", sold_at: new Date().toISOString() })
              .eq("listing_id", od.listing_id)
              .eq("status", "active");
            const { data: ao } = await sb
              .from("marketplace_offers")
              .select("price")
              .eq("product_id", li.product_id)
              .eq("status", "active");
            const prices = (ao || []).map((o: any) => o.price);
            await sb
              .from("marketplace_products")
              .update({
                lowest_price: prices.length > 0 ? Math.min(...prices) : null,
                total_offers: prices.length,
              })
              .eq("id", li.product_id);
          }
        }

        if (od?.seller_id) {
          const { data: sl } = await sb
            .from("vault_seller_profiles")
            .select("member:vault_members!inner(client_cpf)")
            .eq("id", od.seller_id)
            .single();
          if (sl?.member?.client_cpf) {
            const { data: oi } = await sb
              .from("vault_marketplace_orders")
              .select("order_code,seller_payout")
              .eq("id", b.order_id)
              .single();
            await notify(sb, "💸 Repasse realizado!", `Pedido ${oi?.order_code} — R$ ${oi?.seller_payout?.toFixed(2)} transferido.`, sl.member.client_cpf, b.order_id, "marketplace_payout");
            const se = await getMemberEmail(sb, sl.member.client_cpf);
            if (se) {
              sendMarketplaceEmail("mk_payout_released", {
                recipient_name: se.name, recipient_email: se.email,
                order_code: oi?.order_code, payout_amount: oi?.seller_payout,
                payout_method: b.payout_method || "pix",
              });
              if (se.phone)
                sendMarketplaceWhatsApp("mk_payout_released", {
                  recipient_phone: se.phone, recipient_name: se.name,
                  order_code: oi?.order_code, payout_amount: oi?.seller_payout,
                });
            }
          }
        }
      } else if (b.status === "in_transit_to_hub") {
        u.hub_tracking_code = b.hub_tracking_code || null;
      }

      if (b.admin_notes) u.admin_notes = b.admin_notes;

      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;

      // Send notifications for key status changes
      if (["shipped", "delivered", "cancelled"].includes(b.status)) {
        const { data: od } = await sb
          .from("vault_marketplace_orders")
          .select(
            `order_code,buyer_cpf,buyer_name,seller_id,shipping_mode,tracking_code,sale_price,
             listing:vault_marketplace_listings(title,size,condition)`
          )
          .eq("id", b.order_id)
          .single();

        if (od) {
          const pn = od.listing?.title || "Sneaker";
          const { data: si } = await sb
            .from("vault_seller_profiles")
            .select("member:vault_members!inner(client_cpf)")
            .eq("id", od.seller_id)
            .single();
          const sellerCpf = si?.member?.client_cpf;

          if (b.status === "cancelled") {
            const be = await getMemberEmail(sb, od.buyer_cpf);
            if (be) {
              sendMarketplaceEmail("mk_order_cancelled", {
                recipient_name: be.name, recipient_email: be.email,
                order_code: od.order_code, product_name: pn,
                cancel_reason: b.admin_notes || "Cancelado",
              });
              if (be.phone)
                sendMarketplaceWhatsApp("mk_order_cancelled", {
                  recipient_phone: be.phone, recipient_name: be.name,
                  order_code: od.order_code, product_name: pn,
                  cancel_reason: b.admin_notes || "Cancelado",
                });
            }
            if (sellerCpf) {
              const se = await getMemberEmail(sb, sellerCpf);
              if (se)
                sendMarketplaceEmail("mk_order_cancelled", {
                  recipient_name: se.name, recipient_email: se.email,
                  order_code: od.order_code, product_name: pn,
                  cancel_reason: b.admin_notes || "Cancelado",
                });
            }
          } else if (b.status === "shipped") {
            const be = await getMemberEmail(sb, od.buyer_cpf);
            if (be) {
              sendMarketplaceEmail("mk_seller_shipped", {
                recipient_name: be.name, recipient_email: be.email,
                order_code: od.order_code, product_name: pn,
                tracking_code: od.tracking_code || b.tracking_code,
                shipping_mode: od.shipping_mode,
              });
              if (be.phone)
                sendMarketplaceWhatsApp("mk_seller_shipped", {
                  recipient_phone: be.phone, recipient_name: be.name,
                  order_code: od.order_code, product_name: pn,
                  tracking_code: od.tracking_code || b.tracking_code,
                  shipping_mode: od.shipping_mode,
                });
            }
          } else if (b.status === "delivered") {
            const be = await getMemberEmail(sb, od.buyer_cpf);
            if (be) {
              sendMarketplaceEmail("mk_delivery_confirmed", {
                recipient_name: be.name, recipient_email: be.email,
                order_code: od.order_code, product_name: pn,
              });
              if (be.phone)
                sendMarketplaceWhatsApp("mk_delivery_confirmed", {
                  recipient_phone: be.phone, recipient_name: be.name,
                  order_code: od.order_code, product_name: pn,
                });
            }
          }
        }
      }

      return jsonResponse({ success: true });
    }

    // ═══════════════════════════════════════════════
    // AUTH: cancel-buyer-order (buyer must own order)
    // ═══════════════════════════════════════════════
    if (method === "PUT" && action === "cancel-buyer-order") {
      const b = await req.json();
      const { data: od, error: fe } = await sb
        .from("vault_marketplace_orders")
        .select("id,status,cancellation_window_ends_at,listing_id,order_code,seller_id,sale_price,mp_payment_id")
        .eq("id", b.order_id)
        .eq("buyer_cpf", cpf)
        .single();

      if (fe || !od) throw new Error("Pedido não encontrado");
      if (od.status !== "paid") throw new Error("Cancelamento só para pedidos pagos");
      if (!od.cancellation_window_ends_at || new Date(od.cancellation_window_ends_at) < new Date())
        throw new Error("Janela de cancelamento expirada");

      await sb
        .from("vault_marketplace_orders")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: b.reason || "Cancelado pelo comprador",
        })
        .eq("id", od.id);

      if (od.mp_payment_id) await refundMP(od.mp_payment_id, od.id);
      if (od.listing_id)
        await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", od.listing_id);

      const { data: si } = await sb
        .from("vault_seller_profiles")
        .select("member:vault_members!inner(client_cpf,client_name)")
        .eq("id", od.seller_id)
        .single();

      if (si?.member?.client_cpf) {
        await notify(sb, "❌ Compra cancelada", `Pedido ${od.order_code} cancelado pelo comprador.`, si.member.client_cpf, od.id, "marketplace_order");
        const se = await getMemberEmail(sb, si.member.client_cpf);
        if (se)
          sendMarketplaceEmail("mk_order_cancelled", {
            recipient_name: se.name, recipient_email: se.email,
            order_code: od.order_code, product_name: `Pedido ${od.order_code}`,
            cancel_reason: b.reason || "Cancelado pelo comprador",
          });
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    if (e instanceof AuthError) return authErrorResponse(e);
    console.error("mkv2-order-ops error:", e);
    return jsonResponse({ error: e.message }, 500);
  }
});
