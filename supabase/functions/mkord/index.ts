// Marketplace Orders Edge Function
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

function gc() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "MKT-";
  for (let i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
  return r;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF obrigatório" }, 401);

  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mkord", a, mt);

  try {
    if (mt === "POST" && a === "create-order") {
      const b = await req.json();
      const { data: li } = await sb.from("vault_marketplace_listings").select(`*, seller:vault_seller_profiles!inner(id, current_fee_percent, member:vault_members!inner(client_cpf, client_name))`).eq("id", b.listing_id).eq("status", "active").single();
      if (!li) throw new Error("Anúncio não encontrado");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode comprar próprio anúncio");
      const fp = li.seller?.current_fee_percent || 14;
      const fa = Math.round(li.price * fp) / 100;
      const sp = li.price - fa;
      const oc = gc();
      const { data: od, error } = await sb.from("vault_marketplace_orders").insert({ order_code: oc, listing_id: li.id, buyer_cpf: cpf, buyer_name: b.buyer_name, seller_id: li.seller.id, sale_price: li.price, fee_percent: fp, fee_amount: fa, seller_payout: sp, shipping_mode: li.shipping_mode, shipping_cost: li.shipping_cost_estimate || 0, status: "pending_payment" }).select().single();
      if (error) throw error;
      await sb.from("vault_marketplace_listings").update({ status: "reserved" }).eq("id", li.id);
      await nt(sb, "🛒 Nova venda!", `${b.buyer_name} comprou "${li.title}".`, li.seller.member.client_cpf, od.id, "marketplace_order");
      return j({ success: true, order: od });
    }
    if (mt === "PUT" && a === "confirm-payment") {
      const b = await req.json();
      const pe = new Date(); pe.setDate(pe.getDate() + 10);
      const { error } = await sb.from("vault_marketplace_orders").update({ status: "paid", payment_method: b.payment_method, paid_at: new Date().toISOString(), protection_ends_at: pe.toISOString() }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }
    if (mt === "GET" && a === "my-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition, is_vault_certified)`).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }
    if (mt === "GET" && a === "my-sales") {
      const { data: mb } = await sb.from("vault_members").select("id").eq("client_cpf", cpf).single();
      if (!mb) return j({ orders: [] });
      const { data: sl } = await sb.from("vault_seller_profiles").select("id").eq("member_id", mb.id).maybeSingle();
      if (!sl) return j({ orders: [] });
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`).eq("seller_id", sl.id).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }
    if (mt === "PUT" && a === "update-order-status") {
      const b = await req.json();
      const u: Record<string, any> = { status: b.status };
      if (b.status === "shipped") { u.shipped_at = new Date().toISOString(); u.tracking_code = b.tracking_code || null; }
      else if (b.status === "delivered") u.delivered_at = new Date().toISOString();
      else if (b.status === "cancelled") { u.cancelled_at = new Date().toISOString(); if (b.listing_id) await sb.from("vault_marketplace_listings").update({ status: "active" }).eq("id", b.listing_id); }
      else if (b.status === "payout_released") { u.payout_released_at = new Date().toISOString(); u.payout_method = b.payout_method || "pix"; }
      if (b.admin_notes) u.admin_notes = b.admin_notes;
      const { error } = await sb.from("vault_marketplace_orders").update(u).eq("id", b.order_id);
      if (error) throw error;
      return j({ success: true });
    }
    if (mt === "POST" && a === "open-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({ dispute_status: "open", admin_notes: b.reason || "Disputa aberta" }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      return j({ success: true });
    }
    if (mt === "PUT" && a === "resolve-dispute") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({ dispute_status: b.resolution, admin_notes: b.admin_notes || null, status: b.new_status || "dispute_resolved" }).eq("id", b.order_id);
      if (error) throw error;
      return j({ success: true });
    }
    if (mt === "POST" && a === "rate-seller") {
      const b = await req.json();
      const { error } = await sb.from("vault_marketplace_orders").update({ buyer_rating: b.rating, buyer_review: b.review || null }).eq("id", b.order_id).eq("buyer_cpf", cpf);
      if (error) throw error;
      const { data: od } = await sb.from("vault_marketplace_orders").select("seller_id").eq("id", b.order_id).single();
      if (od) { const { data: ar } = await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id", od.seller_id).not("buyer_rating", "is", null); if (ar && ar.length > 0) { const avg = ar.reduce((s: number, r: any) => s + r.buyer_rating, 0) / ar.length; await sb.from("vault_seller_profiles").update({ average_rating: Math.round(avg * 10) / 10, ratings_count: ar.length }).eq("id", od.seller_id); } }
      return j({ success: true });
    }
    if (mt === "GET" && a === "admin-orders") {
      const { data, error } = await sb.from("vault_marketplace_orders").select(`*, listing:vault_marketplace_listings!inner(title, brand, model, size, photos, condition)`).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ orders: data || [] });
    }
    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mkord error:", e);
    return j({ error: e.message }, 500);
  }
});
