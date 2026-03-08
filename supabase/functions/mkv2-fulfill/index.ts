/**
 * mkv2-fulfill — Fulfillment, inspection, disputes, chat
 *
 * Action tiers:
 *   PUBLIC_ACTIONS  → laudo-lookup, check-auto-payout
 *   AUTH_ACTIONS    → open-dispute, chat-messages, send-message, unread-count
 *   ADMIN_ACTIONS   → resolve-dispute, hub-orders, hub-update-status, hub-inspect
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  requireAdminByToken,
  isAdminByToken,
  authErrorResponse,
  AuthError,
} from "../_shared/auth-guard.ts";
import {
  corsHeaders,
  jsonResponse,
  resolveCpf,
  getMemberEmail,
  sendMarketplaceEmail,
  sendMarketplaceWhatsApp,
  notify,
} from "../_shared/mk-helpers.ts";

// ── Action tier constants ──
const PUBLIC_ACTIONS = new Set(["laudo-lookup", "check-auto-payout"]);
const ADMIN_ACTIONS = new Set(["resolve-dispute", "hub-orders", "hub-update-status", "hub-inspect"]);

const sc = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const refundMP = async (mpPaymentId: string, orderId: string) => {
  const tk = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!tk) {
    console.error(`[mkv2-fulfill] MERCADO_PAGO_ACCESS_TOKEN not set. Cannot refund order ${orderId}.`);
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
      console.error(`[mkv2-fulfill] MP refund failed order=${orderId}: ${r.status} ${t}`);
    } else {
      console.log(`[mkv2-fulfill] MP refund initiated order=${orderId}`);
    }
  } catch (e) {
    console.error(`[mkv2-fulfill] MP refund exception order=${orderId}:`, e);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = sc();
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const method = req.method;
  const authHeader = req.headers.get("authorization") || "";

  // ── Resolve auth: public actions allow visitors, others require JWT ──
  const { cpf: rawCpf, errorResponse } = await resolveCpf(req, sb, PUBLIC_ACTIONS, action);
  if (errorResponse) return errorResponse;
  const cpf = rawCpf!;

  // ── Admin-only actions: validate via shared guard ──
  if (ADMIN_ACTIONS.has(action || "")) {
    try {
      await requireAdminByToken(sb, authHeader);
    } catch (e) {
      return authErrorResponse(e);
    }
  }

  try {
    // ═══════════════════════════════════════════════
    // AUTH: open-dispute
    // ═══════════════════════════════════════════════
    if (method === "POST" && action === "open-dispute") {
      const b = await req.json();
      await sb
        .from("vault_marketplace_orders")
        .update({ dispute_status: "open", admin_notes: b.reason || "Disputa aberta" })
        .eq("id", b.order_id)
        .eq("buyer_cpf", cpf);

      const { data: od } = await sb
        .from("vault_marketplace_orders")
        .select(`order_code,buyer_cpf,buyer_name,seller_id,listing:vault_marketplace_listings(title)`)
        .eq("id", b.order_id)
        .single();

      if (od) {
        const { data: sl } = await sb
          .from("vault_seller_profiles")
          .select("member:vault_members!inner(client_cpf,client_name)")
          .eq("id", od.seller_id)
          .single();
        if (sl?.member?.client_cpf) {
          const se = await getMemberEmail(sb, sl.member.client_cpf);
          if (se) {
            sendMarketplaceEmail("mk_dispute_opened", {
              recipient_name: se.name, recipient_email: se.email,
              order_code: od.order_code, dispute_reason: b.reason,
              dispute_opened_by: od.buyer_name || "Comprador",
            });
            if (se.phone)
              sendMarketplaceWhatsApp("mk_dispute_opened", {
                recipient_phone: se.phone, recipient_name: se.name,
                order_code: od.order_code, dispute_reason: b.reason,
              });
          }
        }
        const be = await getMemberEmail(sb, cpf);
        if (be) {
          sendMarketplaceEmail("mk_dispute_opened", {
            recipient_name: be.name, recipient_email: be.email,
            order_code: od.order_code, dispute_reason: b.reason,
            dispute_opened_by: "Você",
          });
          if (be.phone)
            sendMarketplaceWhatsApp("mk_dispute_opened", {
              recipient_phone: be.phone, recipient_name: be.name,
              order_code: od.order_code, dispute_reason: b.reason,
            });
        }
      }
      return jsonResponse({ success: true });
    }

    // ═══════════════════════════════════════════════
    // ADMIN: resolve-dispute
    // ═══════════════════════════════════════════════
    if (method === "PUT" && action === "resolve-dispute") {
      const b = await req.json();
      await sb
        .from("vault_marketplace_orders")
        .update({
          dispute_status: b.resolution,
          admin_notes: b.admin_notes || null,
          status: b.new_status || "dispute_resolved",
        })
        .eq("id", b.order_id);

      // Auto-refund on buyer-favor resolution
      if (b.new_status === "refunded" || b.resolution === "buyer_favor" || b.resolution === "refund_buyer") {
        const mpTk = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
        if (mpTk) {
          const { data: mpOd } = await sb
            .from("vault_marketplace_orders")
            .select("mp_payment_id,sale_price")
            .eq("id", b.order_id)
            .single();
          if (mpOd?.mp_payment_id) {
            try {
              const mpRes = await fetch(
                `https://api.mercadopago.com/v1/payments/${mpOd.mp_payment_id}/refunds`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${mpTk}`,
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": `dispute-refund-${b.order_id}`,
                  },
                }
              );
              if (!mpRes.ok) {
                console.error(`[mkv2-fulfill] MP dispute refund failed order=${b.order_id}: ${mpRes.status}`);
              } else {
                console.log(`[mkv2-fulfill] MP dispute refund initiated order=${b.order_id}`);
              }
            } catch (mpE) {
              console.error(`[mkv2-fulfill] MP dispute refund exception order=${b.order_id}:`, mpE);
            }
          }
        }
      }

      // Notify both parties
      const { data: od } = await sb
        .from("vault_marketplace_orders")
        .select(`order_code,buyer_cpf,seller_id`)
        .eq("id", b.order_id)
        .single();
      if (od) {
        for (const targetCpf of [od.buyer_cpf]) {
          const be = await getMemberEmail(sb, targetCpf);
          if (be) {
            sendMarketplaceEmail("mk_dispute_resolved", {
              recipient_name: be.name, recipient_email: be.email,
              order_code: od.order_code, dispute_resolution: b.admin_notes || b.resolution,
            });
            if (be.phone)
              sendMarketplaceWhatsApp("mk_dispute_resolved", {
                recipient_phone: be.phone, recipient_name: be.name,
                order_code: od.order_code,
              });
          }
        }
        const { data: sl } = await sb
          .from("vault_seller_profiles")
          .select("member:vault_members!inner(client_cpf)")
          .eq("id", od.seller_id)
          .single();
        if (sl?.member?.client_cpf) {
          const se = await getMemberEmail(sb, sl.member.client_cpf);
          if (se) {
            sendMarketplaceEmail("mk_dispute_resolved", {
              recipient_name: se.name, recipient_email: se.email,
              order_code: od.order_code, dispute_resolution: b.admin_notes || b.resolution,
            });
            if (se.phone)
              sendMarketplaceWhatsApp("mk_dispute_resolved", {
                recipient_phone: se.phone, recipient_name: se.name,
                order_code: od.order_code,
              });
          }
        }
      }
      return jsonResponse({ success: true });
    }

    // ═══════════════════════════════════════════════
    // AUTH: chat-messages
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "chat-messages") {
      const oi = url.searchParams.get("order_id");
      const li = url.searchParams.get("listing_id");
      let q = sb.from("vault_marketplace_messages").select("*").order("created_at", { ascending: true });
      if (oi) q = q.eq("order_id", oi);
      else if (li) q = q.eq("listing_id", li);
      else throw new Error("order_id ou listing_id obrigatório");

      const { data, error } = await q;
      if (error) throw error;

      // Mark unread messages as read
      if (data && data.length > 0) {
        const ur = data.filter((m: any) => m.sender_cpf !== cpf && !m.read_at).map((m: any) => m.id);
        if (ur.length > 0)
          await sb.from("vault_marketplace_messages").update({ read_at: new Date().toISOString() }).in("id", ur);
      }
      return jsonResponse({ messages: data || [] });
    }

    // ═══════════════════════════════════════════════
    // AUTH: send-message (admin check for "Bravenza" name)
    // ═══════════════════════════════════════════════
    if (method === "POST" && action === "send-message") {
      const b = await req.json();
      if (!b.message || b.message.trim().length === 0) throw new Error("Mensagem não pode ser vazia");
      if (b.message.length > 2000) throw new Error("Mensagem muito longa. Máximo 2000 caracteres");

      const isRealAdmin = await isAdminByToken(sb, authHeader);
      const { data: member } = await sb
        .from("vault_members")
        .select("client_name")
        .eq("client_cpf", cpf)
        .maybeSingle();
      const safeName = isRealAdmin ? "Bravenza" : (member?.client_name || "Usuário");

      const { data: mg, error } = await sb
        .from("vault_marketplace_messages")
        .insert({
          order_id: b.order_id || null,
          listing_id: b.listing_id || null,
          sender_cpf: cpf,
          sender_name: safeName,
          message: b.message,
          is_admin: isRealAdmin,
        })
        .select()
        .single();
      if (error) throw error;

      if (b.order_id) {
        const { data: od } = await sb
          .from("vault_marketplace_orders")
          .select(
            `buyer_cpf,listing:vault_marketplace_listings(title),
             seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`
          )
          .eq("id", b.order_id)
          .single();
        if (od) {
          const to = cpf === od.buyer_cpf ? od.seller?.member?.client_cpf : od.buyer_cpf;
          if (to)
            await notify(sb, "💬 Nova mensagem", `Mensagem sobre "${od.listing?.title}".`, to, b.order_id, "marketplace_chat");
        }
      }
      return jsonResponse({ success: true, message: mg });
    }

    // ═══════════════════════════════════════════════
    // ADMIN: hub-orders
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "hub-orders") {
      const { data, error } = await sb
        .from("vault_marketplace_orders")
        .select(`*,listing:vault_marketplace_listings(title,brand,model,size,photos,condition)`)
        .eq("shipping_mode", "bravenza")
        .not("status", "in", "(cancelled,deleted)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ orders: data || [] });
    }

    // ═══════════════════════════════════════════════
    // ADMIN: hub-update-status
    // ═══════════════════════════════════════════════
    if (method === "PUT" && action === "hub-update-status") {
      const b = await req.json();
      const u: any = { status: b.status };

      if (b.status === "hub_received") {
        u.hub_received_at = new Date().toISOString();
      } else if (b.status === "in_transit_to_hub") {
        u.hub_tracking_code = b.hub_tracking_code || null;
      } else if (b.status === "in_transit_to_buyer") {
        u.hub_tracking_to_buyer = b.hub_tracking_to_buyer || null;
        u.hub_shipped_at = new Date().toISOString();
      } else if (b.status === "cancelled" && b.refund_amount) {
        u.refund_amount = b.refund_amount;
        u.refund_at = new Date().toISOString();
        const { data: od } = await sb
          .from("vault_marketplace_orders")
          .select("listing_id,buyer_cpf")
          .eq("id", b.order_id)
          .single();
        if (od?.listing_id)
          await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", od.listing_id);
        if (od?.buyer_cpf)
          await notify(sb, "💰 Reembolso", `Reembolso R$ ${b.refund_amount.toFixed(2)}.`, od.buyer_cpf, b.order_id, "marketplace_refund");
      }

      await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);

      if (["hub_received", "in_transit_to_buyer"].includes(b.status)) {
        const { data: od } = await sb
          .from("vault_marketplace_orders")
          .select("buyer_cpf,order_code")
          .eq("id", b.order_id)
          .single();
        if (od?.buyer_cpf) {
          const msgs: Record<string, string> = {
            hub_received: `Pedido ${od.order_code} recebido no Hub.`,
            in_transit_to_buyer: `Pedido ${od.order_code} aprovado e enviado!`,
          };
          await notify(sb, "📦 Atualização", msgs[b.status] || "Status atualizado.", od.buyer_cpf, b.order_id, "marketplace_order");
          const be = await getMemberEmail(sb, od.buyer_cpf);
          if (be) {
            if (b.status === "hub_received") {
              sendMarketplaceEmail("mk_hub_received", { recipient_name: be.name, recipient_email: be.email, order_code: od.order_code });
              if (be.phone) sendMarketplaceWhatsApp("mk_hub_received", { recipient_phone: be.phone, recipient_name: be.name, order_code: od.order_code });
            } else {
              sendMarketplaceEmail("mk_hub_shipped_to_buyer", { recipient_name: be.name, recipient_email: be.email, order_code: od.order_code, tracking_code: b.hub_tracking_to_buyer || null });
              if (be.phone) sendMarketplaceWhatsApp("mk_hub_shipped_to_buyer", { recipient_phone: be.phone, recipient_name: be.name, order_code: od.order_code, tracking_code: b.hub_tracking_to_buyer || null });
            }
          }
        }
      }
      return jsonResponse({ success: true });
    }

    // ═══════════════════════════════════════════════
    // ADMIN: hub-inspect
    // ═══════════════════════════════════════════════
    if (method === "POST" && action === "hub-inspect") {
      const b = await req.json();
      if (!b.order_id || !b.result) throw new Error("order_id e result obrigatórios");

      let laudoId: string | null = null;
      let laudoQr: string | null = null;
      if (b.result === "approved") {
        laudoId = `BRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        laudoQr = `${Deno.env.get("SITE_URL") || "https://bravenza.lovable.app"}/autenticidade?laudo=${laudoId}`;
      }

      const { data: insp, error: ie } = await sb
        .from("marketplace_inspections")
        .insert({
          order_id: b.order_id,
          status: b.result === "approved" ? "inspection_approved" : "inspection_rejected",
          result: b.result,
          checklist: b.checklist || null,
          notes: b.notes || null,
          rejection_reason: b.rejection_reason || null,
          inspection_photos: b.inspection_photos || null,
          inspected_at: new Date().toISOString(),
          laudo_id: laudoId,
          laudo_qr_url: laudoQr,
        })
        .select()
        .single();
      if (ie) throw ie;

      await sb
        .from("vault_marketplace_orders")
        .update({ status: b.result === "approved" ? "inspection_approved" : "inspection_rejected", inspection_id: insp.id, inspection_result: b.result })
        .eq("id", b.order_id);

      const { data: od } = await sb
        .from("vault_marketplace_orders")
        .select("buyer_cpf,order_code,seller_id")
        .eq("id", b.order_id)
        .single();

      if (od?.buyer_cpf) {
        if (b.result === "approved") {
          await notify(sb, "✅ Inspeção aprovada!", `Pedido ${od.order_code} autenticado! Laudo: ${laudoId}`, od.buyer_cpf, b.order_id, "marketplace_inspection");
        } else {
          await notify(sb, "❌ Inspeção reprovada", `Pedido ${od.order_code} não passou. Motivo: ${b.rejection_reason || "Veja detalhes"}`, od.buyer_cpf, b.order_id, "marketplace_inspection");

          // Notify seller about failed inspection
          const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", od.seller_id).single();
          if (sl?.member?.client_cpf) {
            await notify(sb, "❌ Item reprovado", `Pedido ${od.order_code}: ${b.rejection_reason || "Não passou"}`, sl.member.client_cpf, b.order_id, "marketplace_inspection");
            await notify(sb, "⚠️ Processo de apuração", `O item do pedido ${od.order_code} não passou na inspeção.`, sl.member.client_cpf, b.order_id, "marketplace_inspection");
            const se = await getMemberEmail(sb, sl.member.client_cpf);
            if (se) {
              sendMarketplaceEmail("mk_inspection_failed_seller", { recipient_name: se.name, recipient_email: se.email, order_code: od.order_code, rejection_reason: b.rejection_reason || "Reprovado na inspeção" });
              if (se.phone) sendMarketplaceWhatsApp("mk_inspection_failed_seller", { recipient_phone: se.phone, recipient_name: se.name, order_code: od.order_code, rejection_reason: b.rejection_reason || "Reprovado na inspeção" });
            }
          }

          // Refund + cancel + restore listing on rejection
          const { data: rfd } = await sb.from("vault_marketplace_orders").select("mp_payment_id,status,listing_id").eq("id", b.order_id).single();
          if (rfd?.mp_payment_id && rfd.status !== "pending_payment") await refundMP(rfd.mp_payment_id, b.order_id);
          await sb.from("vault_marketplace_orders").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "inspection_failed" }).eq("id", b.order_id);
          if (rfd?.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", rfd.listing_id);
        }

        const be = await getMemberEmail(sb, od.buyer_cpf);
        if (be) {
          sendMarketplaceEmail("mk_inspection_result", { recipient_name: be.name, recipient_email: be.email, order_code: od.order_code, inspection_result: b.result, rejection_reason: b.rejection_reason || null });
          if (be.phone) sendMarketplaceWhatsApp("mk_inspection_result", { recipient_phone: be.phone, recipient_name: be.name, order_code: od.order_code, inspection_result: b.result, rejection_reason: b.rejection_reason || null });
        }
      }

      return jsonResponse({ success: true, inspection: insp, laudo_id: laudoId, laudo_qr_url: laudoQr });
    }

    // ═══════════════════════════════════════════════
    // PUBLIC: laudo-lookup
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "laudo-lookup") {
      const lid = url.searchParams.get("laudo_id");
      if (!lid) throw new Error("laudo_id obrigatório");
      const { data: insp } = await sb
        .from("marketplace_inspections")
        .select(`*,order:vault_marketplace_orders!inner(order_code,buyer_name,sale_price,listing:vault_marketplace_listings(title,brand,model,size,photos,condition))`)
        .eq("laudo_id", lid)
        .eq("result", "approved")
        .maybeSingle();
      if (!insp) return jsonResponse({ found: false });
      return jsonResponse({
        found: true,
        laudo: {
          laudo_id: insp.laudo_id,
          inspected_at: insp.inspected_at,
          checklist: insp.checklist,
          notes: insp.notes,
          inspection_photos: insp.inspection_photos,
          order_code: insp.order?.order_code,
          product: {
            title: insp.order?.listing?.title,
            brand: insp.order?.listing?.brand,
            model: insp.order?.listing?.model,
            size: insp.order?.listing?.size,
            condition: insp.order?.listing?.condition,
            photos: insp.order?.listing?.photos,
          },
        },
      });
    }

    // ═══════════════════════════════════════════════
    // PUBLIC: check-auto-payout
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "check-auto-payout") {
      const { data: orders, error } = await sb
        .from("vault_marketplace_orders")
        .select("id,order_code,seller_id,seller_payout,protection_ends_at")
        .eq("status", "delivered")
        .is("payout_released_at", null)
        .is("dispute_status", null);
      if (error) throw error;

      const now = new Date();
      const eligible = (orders || []).filter((o: any) => o.protection_ends_at && new Date(o.protection_ends_at) < now);
      for (const o of eligible) {
        await sb.from("vault_marketplace_orders").update({ status: "payout_pending" }).eq("id", o.id);
        const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", o.seller_id).single();
        if (sl?.member?.client_cpf)
          await notify(sb, "💰 Pagamento liberado!", `Pedido ${o.order_code} — R$ ${o.seller_payout.toFixed(2)} será transferido.`, sl.member.client_cpf, o.id, "marketplace_payout");
      }
      return jsonResponse({ checked: (orders || []).length, eligible: eligible.length });
    }

    // ═══════════════════════════════════════════════
    // AUTH: unread-count
    // ═══════════════════════════════════════════════
    if (method === "GET" && action === "unread-count") {
      const { data: msgs, error: ue } = await sb
        .from("vault_marketplace_messages")
        .select("id,listing_id,order_id")
        .neq("sender_cpf", cpf)
        .is("read_at", null);
      if (ue) throw ue;

      const byListing: Record<string, number> = {};
      const byOrder: Record<string, number> = {};
      let total = 0;
      for (const m of msgs || []) {
        total++;
        if (m.listing_id) byListing[m.listing_id] = (byListing[m.listing_id] || 0) + 1;
        if (m.order_id) byOrder[m.order_id] = (byOrder[m.order_id] || 0) + 1;
      }
      return jsonResponse({ total, by_listing: byListing, by_order: byOrder });
    }

    return jsonResponse({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    if (e instanceof AuthError) return authErrorResponse(e);
    console.error("mkv2-fulfill error:", e);
    return jsonResponse({ error: e.message }, 500);
  }
});
