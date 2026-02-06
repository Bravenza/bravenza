import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ch = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...ch, "Content-Type": "application/json" } });
}

async function nt(sb: any, t: string, m: string, c: string, ri?: string, rt?: string) {
  try { await sb.from("notifications").insert({ title: t, message: m, target: "client", target_client_cpf: c, type: "info", reference_id: ri || null, reference_type: rt || "marketplace" }); } catch (_) {}
}

async function gm(sb: any, c: string) { const { data } = await sb.from("vault_members").select("id").eq("client_cpf", c).single(); return data; }
async function gs(sb: any, m: string) { const { data } = await sb.from("vault_seller_profiles").select("*").eq("member_id", m).maybeSingle(); return data; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF não informado" }, 401);
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;
  try {
    if (mt === "POST" && a === "create-order") {
      const b = await req.json();
      const { data: li, error: le } = await sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`).eq("id", b.listing_id).eq("status", "active").single();
      if (le || !li) throw new Error("Anúncio não encontrado ou já vendido");
      if (li.seller.member.client_cpf === cpf) throw new Error("Não pode comprar próprio anúncio");
      const sp = li.price + (li.shipping_cost_estimate || 0), fp = li.seller.current_fee_percent;
      const fa = Math.round(li.price * (fp / 100) * 100) / 100, po = li.price - fa;
      const { data: od, error: oe } = await sb.from("vault_marketplace_orders").insert({ listing_id: b.listing_id, buyer_cpf: cpf, buyer_name: b.buyer_name, buyer_email: b.buyer_email || null, buyer_phone: b.buyer_phone || null, buyer_address: b.buyer_address || null, seller_id: li.seller.id, sale_price: sp, fee_percent: fp, fee_amount: fa, seller_payout: po, shipping_mode: li.shipping_mode, shipping_cost: li.shipping_cost_estimate || 0, status: "pending_payment", payment_method: b.payment_method || null }).select().single();
      if (oe) throw oe;
      await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", b.listing_id);
      await nt(sb, "🛒 Nova venda!", `${b.buyer_name} quer comprar "${li.title}".`, li.seller.member.client_cpf, od.id, "marketplace_order");
      return j({ success: true, order: od });
    }
    if (mt === "PUT" && a === "confirm-payment") {
      const b = await req.json();
      const { data: od } = await sb.from("vault_marketplace_orders").select(`id, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", b.order_id).eq("buyer_cpf", cpf).single();
      const { error } = await sb.from("vault_marketplace_orders").update({ status: "paid", payment_method: b.payment_method, paid_at: new Date().toISOString() }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      if (od) await nt(sb, "💰 Pagamento confirmado!", `Pagamento de "${od.listing?.title}" confirmado.`, od.seller?.member?.client_cpf, b.order_id, "marketplace_order");
      return j({ success: true });
    }
    if (mt === "GET" && a === "my-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`).eq("buyer_cpf", cpf).order("created_at", { ascending: false }); if (error) throw error;
      return j({ orders: data || [] });
    }
    if (mt === "GET" && a === "my-sales") {
      const mb = await gm(sb, cpf); if (!mb) return j({ orders: [] });
      const sl = await gs(sb, mb.id); if (!sl) return j({ orders: [] });
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`).eq("seller_id", sl.id).order("created_at", { ascending: false }); if (error) throw error;
      return j({ orders: data || [] });
    }
    if (mt === "PUT" && a === "update-order-status") {
      const b = await req.json(); const oid = b.order_id, ns = b.status;
      const { data: od } = await sb.from("vault_marketplace_orders").select(`id, buyer_cpf, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", oid).single();
      const u: Record<string, any> = { status: ns };
      if (ns === "shipped") { u.shipped_at = new Date().toISOString(); u.tracking_code = b.tracking_code || null; if (od) await nt(sb, "📦 Enviado!", `"${od.listing?.title}" enviado.`, od.buyer_cpf, oid, "marketplace_order"); }
      else if (ns === "delivered") { u.delivered_at = new Date().toISOString(); try { const { data: pd } = await sb.rpc("calculate_protection_end", { delivery_date: new Date().toISOString() }); if (pd) u.protection_ends_at = pd; } catch(_){} if (od) { await nt(sb, "✅ Entregue!", `"${od.listing?.title}" entregue.`, od.buyer_cpf, oid, "marketplace_order"); } }
      else if (ns === "completed") { u.payout_released_at = new Date().toISOString(); u.payout_method = b.payout_method || "pix"; }
      else if (ns === "cancelled") { u.cancelled_at = new Date().toISOString(); const { data: co } = await sb.from("vault_marketplace_orders").select("listing_id").eq("id", oid).single(); if (co) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", co.listing_id); }
      else if (ns === "disputed") { u.dispute_status = "open"; u.dispute_reason = b.reason || null; u.dispute_opened_at = new Date().toISOString(); }
      if (b.admin_notes) u.admin_notes = b.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", oid); if (error) throw error; return j({ success: true });
    }
    if (mt === "PUT" && a === "resolve-dispute") {
      const b = await req.json(); const oid = b.order_id;
      const { data: od } = await sb.from("vault_marketplace_orders").select(`id, buyer_cpf, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", oid).single();
      const u: Record<string, any> = { dispute_status: "resolved", dispute_resolved_at: new Date().toISOString(), dispute_resolution: b.resolution, admin_notes: b.admin_notes || null };
      if (b.resolution === "refund_buyer") { u.status = "cancelled"; u.cancelled_at = new Date().toISOString(); const { data: lo } = await sb.from("vault_marketplace_orders").select("listing_id").eq("id", oid).single(); if (lo) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", lo.listing_id); }
      else if (b.resolution === "favor_seller") { u.status = "completed"; u.payout_released_at = new Date().toISOString(); u.payout_method = "pix"; }
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", oid); if (error) throw error;
      if (od) { await nt(sb, "📋 Disputa resolvida", `"${od.listing?.title}" resolvida.`, od.buyer_cpf, oid, "marketplace_order"); }
      return j({ success: true });
    }
    if (mt === "POST" && a === "rate-seller") {
      const b = await req.json();
      const { data: od, error: oe } = await sb.from("vault_marketplace_orders").select("id, seller_id, status").eq("id", b.order_id).eq("buyer_cpf", cpf).single(); if (oe || !od) throw new Error("Pedido não encontrado");
      if (!["delivered", "completed"].includes(od.status)) throw new Error("Avalie após entrega");
      await sb.from("vault_marketplace_orders").update({ buyer_rating: b.rating, buyer_review: b.review || null }).eq("id", b.order_id);
      const { data: al } = await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id", od.seller_id).not("buyer_rating", "is", null);
      if (al && al.length > 0) { const av = al.reduce((s: number, r: any) => s + r.buyer_rating, 0) / al.length; await sb.from("vault_seller_profiles").update({ average_rating: Math.round(av * 10) / 10, ratings_count: al.length }).eq("id", od.seller_id); }
      return j({ success: true });
    }
    if (mt === "GET" && a === "admin-orders") {
      const st = url.searchParams.get("status");
      let q = sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`).order("created_at", { ascending: false }).limit(100);
      if (st && st !== "all") q = q.eq("status", st);
      const { data, error } = await q; if (error) throw error; return j({ orders: data || [] });
    }
    if (mt === "POST" && a === "open-dispute") {
      const b = await req.json();
      const { data: od, error: oe } = await sb.from("vault_marketplace_orders").select(`id, status, protection_ends_at, buyer_name, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", b.order_id).eq("buyer_cpf", cpf).single(); if (oe || !od) throw new Error("Pedido não encontrado");
      if (od.status !== "delivered") throw new Error("Disputas só após entrega");
      if (od.protection_ends_at && new Date(od.protection_ends_at) < new Date()) throw new Error("Proteção expirada");
      await sb.from("vault_marketplace_orders").update({ status: "disputed", dispute_status: "open", dispute_reason: b.reason, dispute_opened_at: new Date().toISOString() }).eq("id", b.order_id);
      if (od.seller?.member?.client_cpf) await nt(sb, "⚠️ Disputa", `${od.buyer_name} abriu disputa.`, od.seller.member.client_cpf, b.order_id, "marketplace_order");
      return j({ success: true });
    }
    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("Orders error:", e);
    return j({ error: e.message }, 500);
  }
});
