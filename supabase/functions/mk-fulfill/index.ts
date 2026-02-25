// mk-fulfill: Disputes, Chat, Hub PRO, Inspection, Laudo, Auto-payout
import {
  corsHeaders, jsonResponse, createSupabaseClient,
  notify, getMemberEmail, sendMarketplaceEmail, sendMarketplaceWhatsApp,
} from "../_shared/mk-helpers.ts";

const j = jsonResponse;
const nt = notify;
const ge = getMemberEmail;
const em = sendMarketplaceEmail;
const wa = sendMarketplaceWhatsApp;

const PUBLIC_ACTIONS = new Set(["laudo-lookup", "check-auto-payout"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createSupabaseClient();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mk-fulfill", a, mt);

  // Inline auth resolution
  let cpf: string | null = "visitor";
  const isPublic = PUBLIC_ACTIONS.has(a || "");
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await sb.auth.getUser(token);
    if (!authErr && userData?.user) {
      const { data: prof } = await sb.from("client_profiles").select("cpf").eq("user_id", userData.user.id).single();
      if (prof?.cpf) cpf = prof.cpf;
    }
  }
  if (!isPublic && cpf === "visitor") {
    return j({ error: "Autenticação obrigatória" }, 401);
  }

  try {
    // ==================== OPEN DISPUTE ====================
    if (mt === "POST" && a === "open-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({ dispute_status: "open", admin_notes: b.reason || "Disputa aberta" }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      const { data: disputeOrder } = await sb.from("vault_marketplace_orders").select(`order_code, buyer_cpf, buyer_name, seller_id, listing:vault_marketplace_listings(title)`).eq("id", b.order_id).single();
      if (disputeOrder) {
        const { data: sellerData } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf, client_name)").eq("id", disputeOrder.seller_id).single();
        if (sellerData?.member?.client_cpf) {
          const sellerEmail = await ge(sb, sellerData.member.client_cpf);
          if (sellerEmail) { em("mk_dispute_opened", { recipient_name: sellerEmail.name, recipient_email: sellerEmail.email, order_code: disputeOrder.order_code, dispute_reason: b.reason, dispute_opened_by: disputeOrder.buyer_name || "Comprador" }); if (sellerEmail.phone) wa("mk_dispute_opened", { recipient_phone: sellerEmail.phone, recipient_name: sellerEmail.name, order_code: disputeOrder.order_code, dispute_reason: b.reason }); }
        }
        const buyerEmail = await ge(sb, cpf);
        if (buyerEmail) { em("mk_dispute_opened", { recipient_name: buyerEmail.name, recipient_email: buyerEmail.email, order_code: disputeOrder.order_code, dispute_reason: b.reason, dispute_opened_by: "Você" }); if (buyerEmail.phone) wa("mk_dispute_opened", { recipient_phone: buyerEmail.phone, recipient_name: buyerEmail.name, order_code: disputeOrder.order_code, dispute_reason: b.reason }); }
      }
      return j({ success: true });
    }

    // ==================== RESOLVE DISPUTE ====================
    if (mt === "PUT" && a === "resolve-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({ dispute_status: b.resolution, admin_notes: b.admin_notes || null, status: b.new_status || "dispute_resolved" }).eq("id", b.order_id);
      if (error) throw error;
      const { data: drOrder } = await sb.from("vault_marketplace_orders").select(`order_code, buyer_cpf, seller_id`).eq("id", b.order_id).single();
      if (drOrder) {
        const buyerDrEmail = await ge(sb, drOrder.buyer_cpf);
        if (buyerDrEmail) { em("mk_dispute_resolved", { recipient_name: buyerDrEmail.name, recipient_email: buyerDrEmail.email, order_code: drOrder.order_code, dispute_resolution: b.admin_notes || b.resolution }); if (buyerDrEmail.phone) wa("mk_dispute_resolved", { recipient_phone: buyerDrEmail.phone, recipient_name: buyerDrEmail.name, order_code: drOrder.order_code }); }
        const { data: slDr } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", drOrder.seller_id).single();
        if (slDr?.member?.client_cpf) { const sellerDrEmail = await ge(sb, slDr.member.client_cpf); if (sellerDrEmail) { em("mk_dispute_resolved", { recipient_name: sellerDrEmail.name, recipient_email: sellerDrEmail.email, order_code: drOrder.order_code, dispute_resolution: b.admin_notes || b.resolution }); if (sellerDrEmail.phone) wa("mk_dispute_resolved", { recipient_phone: sellerDrEmail.phone, recipient_name: sellerDrEmail.name, order_code: drOrder.order_code }); } }
      }
      return j({ success: true });
    }

    // ==================== CHAT ====================
    if (mt === "GET" && a === "chat-messages") {
      const oi = url.searchParams.get("order_id"), li = url.searchParams.get("listing_id");
      let q = sb.from("vault_marketplace_messages").select("*").order("created_at", { ascending: true });
      if (oi) q = q.eq("order_id", oi);
      else if (li) q = q.eq("listing_id", li);
      else throw new Error("order_id ou listing_id obrigatório");
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length > 0) {
        const ur = data.filter((m: any) => m.sender_cpf !== cpf && !m.read_at).map((m: any) => m.id);
        if (ur.length > 0) await sb.from("vault_marketplace_messages").update({ read_at: new Date().toISOString() }).in("id", ur);
      }
      return j({ messages: data || [] });
    }

    if (mt === "POST" && a === "send-message") {
      const b = await req.json();
      const { data: mg, error } = await sb.from("vault_marketplace_messages").insert({
        order_id: b.order_id || null, listing_id: b.listing_id || null,
        sender_cpf: cpf, sender_name: b.sender_name, message: b.message, is_admin: b.is_admin || false,
      }).select().single();
      if (error) throw error;
      if (b.order_id) {
        const { data: od } = await sb.from("vault_marketplace_orders").select(`buyer_cpf, listing:vault_marketplace_listings(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", b.order_id).single();
        if (od) {
          const to = cpf === od.buyer_cpf ? od.seller?.member?.client_cpf : od.buyer_cpf;
          if (to) await nt(sb, "💬 Nova mensagem", `Mensagem sobre "${od.listing?.title}".`, to, b.order_id, "marketplace_chat");
        }
      }
      return j({ success: true, message: mg });
    }

    // ==================== HUB PRO ====================
    if (mt === "GET" && a === "hub-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings(title, brand, model, size, photos, condition)`).eq("shipping_mode", "bravenza").order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }

    if (mt === "PUT" && a === "hub-update-status") {
      const b = await req.json();
      const u: Record<string, any> = { status: b.status };
      if (b.status === "hub_received") { u.hub_received_at = new Date().toISOString(); u.status = "hub_received"; }
      else if (b.status === "in_transit_to_hub") { u.hub_tracking_code = b.hub_tracking_code || null; }
      else if (b.status === "in_transit_to_buyer") { u.hub_tracking_to_buyer = b.hub_tracking_to_buyer || null; u.hub_shipped_at = new Date().toISOString(); }
      else if (b.status === "cancelled" && b.refund_amount) {
        u.refund_amount = b.refund_amount; u.refund_at = new Date().toISOString();
        const { data: od } = await sb.from("vault_marketplace_orders").select("listing_id, buyer_cpf").eq("id", b.order_id).single();
        if (od?.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", od.listing_id);
        if (od?.buyer_cpf) await nt(sb, "💰 Reembolso processado", `Pedido cancelado — inspeção reprovada. Reembolso de R$ ${b.refund_amount.toFixed(2)}.`, od.buyer_cpf, b.order_id, "marketplace_refund");
      }
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;
      if (["hub_received", "in_transit_to_buyer"].includes(b.status)) {
        const { data: od } = await sb.from("vault_marketplace_orders").select("buyer_cpf, order_code").eq("id", b.order_id).single();
        if (od?.buyer_cpf) {
          const msgs: Record<string, string> = { hub_received: `Pedido ${od.order_code} recebido no Hub Bravenza para inspeção.`, in_transit_to_buyer: `Pedido ${od.order_code} aprovado e enviado para você!` };
          await nt(sb, "📦 Atualização do pedido", msgs[b.status] || "Status atualizado.", od.buyer_cpf, b.order_id, "marketplace_order");
          const buyerHubEmail = await ge(sb, od.buyer_cpf);
          if (buyerHubEmail) {
            if (b.status === "hub_received") { em("mk_hub_received", { recipient_name: buyerHubEmail.name, recipient_email: buyerHubEmail.email, order_code: od.order_code }); if (buyerHubEmail.phone) wa("mk_hub_received", { recipient_phone: buyerHubEmail.phone, recipient_name: buyerHubEmail.name, order_code: od.order_code }); }
            else { em("mk_hub_shipped_to_buyer", { recipient_name: buyerHubEmail.name, recipient_email: buyerHubEmail.email, order_code: od.order_code, tracking_code: b.hub_tracking_to_buyer || null }); if (buyerHubEmail.phone) wa("mk_hub_shipped_to_buyer", { recipient_phone: buyerHubEmail.phone, recipient_name: buyerHubEmail.name, order_code: od.order_code, tracking_code: b.hub_tracking_to_buyer || null }); }
          }
        }
      }
      return j({ success: true });
    }

    // ==================== HUB INSPECT ====================
    if (mt === "POST" && a === "hub-inspect") {
      const b = await req.json();
      if (!b.order_id || !b.result) throw new Error("order_id e result obrigatórios");
      let laudoId: string | null = null;
      let laudoQrUrl: string | null = null;
      if (b.result === "approved") {
        laudoId = `BRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const baseUrl = Deno.env.get("SITE_URL") || "https://bravenza.lovable.app";
        laudoQrUrl = `${baseUrl}/autenticidade?laudo=${laudoId}`;
      }
      const { data: insp, error: ie } = await sb.from("marketplace_inspections").insert({
        order_id: b.order_id, status: b.result === "approved" ? "inspection_approved" : "inspection_rejected",
        result: b.result, checklist: b.checklist || null, notes: b.notes || null,
        rejection_reason: b.rejection_reason || null, inspection_photos: b.inspection_photos || null,
        inspected_at: new Date().toISOString(), laudo_id: laudoId, laudo_qr_url: laudoQrUrl,
      }).select().single();
      if (ie) throw ie;
      const newStatus = b.result === "approved" ? "inspection_approved" : "inspection_rejected";
      await sb.from("vault_marketplace_orders").update({ status: newStatus, inspection_id: insp.id, inspection_result: b.result }).eq("id", b.order_id);
      const { data: od } = await sb.from("vault_marketplace_orders").select("buyer_cpf, order_code, seller_id").eq("id", b.order_id).single();
      if (od?.buyer_cpf) {
        if (b.result === "approved") { await nt(sb, "✅ Inspeção aprovada!", `Pedido ${od.order_code} autenticado! Laudo: ${laudoId}`, od.buyer_cpf, b.order_id, "marketplace_inspection"); }
        else {
          await nt(sb, "❌ Inspeção reprovada", `Pedido ${od.order_code} não passou na inspeção. Motivo: ${b.rejection_reason || "Veja detalhes"}`, od.buyer_cpf, b.order_id, "marketplace_inspection");
          const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", od.seller_id).single();
          if (sl?.member?.client_cpf) await nt(sb, "❌ Item reprovado na inspeção", `Pedido ${od.order_code}: ${b.rejection_reason || "Não passou na autenticação"}.`, sl.member.client_cpf, b.order_id, "marketplace_inspection");
        }
        const buyerEmail = await ge(sb, od.buyer_cpf);
        if (buyerEmail) {
          em("mk_inspection_result", { recipient_name: buyerEmail.name, recipient_email: buyerEmail.email, order_code: od.order_code, inspection_result: b.result, rejection_reason: b.rejection_reason || null });
          if (buyerEmail.phone) wa("mk_inspection_result", { recipient_phone: buyerEmail.phone, recipient_name: buyerEmail.name, order_code: od.order_code, inspection_result: b.result, rejection_reason: b.rejection_reason || null });
        }
        if (b.result !== "approved" && od.seller_id) {
          const { data: slInsp } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", od.seller_id).single();
          if (slInsp?.member?.client_cpf) { const sellerInspInfo = await ge(sb, slInsp.member.client_cpf); if (sellerInspInfo?.phone) wa("mk_inspection_result", { recipient_phone: sellerInspInfo.phone, recipient_name: sellerInspInfo.name, order_code: od.order_code, inspection_result: "rejected", rejection_reason: b.rejection_reason || "Item reprovado na inspeção" }); }
        }
      }
      return j({ success: true, inspection: insp, laudo_id: laudoId, laudo_qr_url: laudoQrUrl });
    }

    // ==================== LAUDO LOOKUP ====================
    if (mt === "GET" && a === "laudo-lookup") {
      const laudoId = url.searchParams.get("laudo_id");
      if (!laudoId) throw new Error("laudo_id obrigatório");
      const { data: insp } = await sb.from("marketplace_inspections").select(`*, order:vault_marketplace_orders!inner(order_code, buyer_name, sale_price, listing:vault_marketplace_listings(title, brand, model, size, photos, condition))`).eq("laudo_id", laudoId).eq("result", "approved").maybeSingle();
      if (!insp) return j({ found: false });
      return j({ found: true, laudo: { laudo_id: insp.laudo_id, inspected_at: insp.inspected_at, checklist: insp.checklist, notes: insp.notes, inspection_photos: insp.inspection_photos, order_code: insp.order?.order_code, product: { title: insp.order?.listing?.title, brand: insp.order?.listing?.brand, model: insp.order?.listing?.model, size: insp.order?.listing?.size, condition: insp.order?.listing?.condition, photos: insp.order?.listing?.photos } } });
    }

    // ==================== AUTO PAYOUT CHECK ====================
    if (mt === "GET" && a === "check-auto-payout") {
      const { data: orders, error } = await sb.from("vault_marketplace_orders").select("id, order_code, seller_id, seller_payout, protection_ends_at").eq("status", "delivered").is("payout_released_at", null).is("dispute_status", null);
      if (error) throw error;
      const now = new Date();
      const eligible = (orders || []).filter((o: any) => o.protection_ends_at && new Date(o.protection_ends_at) < now);
      for (const o of eligible) {
        await sb.from("vault_marketplace_orders").update({ status: "payout_pending" }).eq("id", o.id);
        const { data: sl } = await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id", o.seller_id).single();
        if (sl?.member?.client_cpf) await nt(sb, "💰 Pagamento liberado!", `Pedido ${o.order_code} — R$ ${o.seller_payout.toFixed(2)} será transferido.`, sl.member.client_cpf, o.id, "marketplace_payout");
      }
      return j({ checked: (orders || []).length, eligible: eligible.length });
    }

    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mk-fulfill error:", e);
    return j({ error: e.message }, 500);
  }
});
