import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ch = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-cpf",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...ch, "Content-Type": "application/json" } });
}

async function nt(sb: any, t: string, m: string, c: string, ri?: string, rt?: string) {
  try { await sb.from("notifications").insert({ title: t, message: m, target: "client", target_client_cpf: c, type: "info", reference_id: ri || null, reference_type: rt || "marketplace" }); } catch (_) {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF obrigatório" }, 401);

  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  console.log("mkoff", a, mt);

  try {
    if (mt === "POST" && a === "make-offer") {
      const b = await req.json();
      const { data: li } = await sb.from("vault_marketplace_listings").select(`id, title, seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", b.listing_id).eq("status", "active").single();
      if (!li) throw new Error("Anúncio não encontrado");
      if (li.seller?.member?.client_cpf === cpf) throw new Error("Não pode ofertar próprio anúncio");
      const { data: of2, error } = await sb.from("vault_marketplace_offers").insert({ listing_id: b.listing_id, buyer_cpf: cpf, buyer_name: b.buyer_name || "Comprador", offer_price: b.offer_price, message: b.message || null }).select().single();
      if (error) throw error;
      await nt(sb, "💰 Nova oferta!", `R$ ${b.offer_price.toFixed(2)} por "${li.title}".`, li.seller.member.client_cpf, li.id, "marketplace_offer");
      return j({ success: true, offer: of2 });
    }
    if (mt === "GET" && a === "listing-offers") {
      const lid = url.searchParams.get("listing_id");
      if (!lid) throw new Error("listing_id obrigatório");
      const { data, error } = await sb.from("vault_marketplace_offers").select("*").eq("listing_id", lid).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ offers: data || [] });
    }
    if (mt === "GET" && a === "my-offers") {
      const { data, error } = await sb.from("vault_marketplace_offers").select(`*, listing:vault_marketplace_listings!inner(title, photos, price)`).eq("buyer_cpf", cpf).order("created_at", { ascending: false });
      if (error) throw error;
      return j({ offers: data || [] });
    }
    if (mt === "PUT" && a === "respond-offer") {
      const b = await req.json();
      const { data: of2 } = await sb.from("vault_marketplace_offers").select(`id, listing_id, buyer_cpf, offer_price, listing:vault_marketplace_listings!inner(title)`).eq("id", b.offer_id).single();
      if (!of2) throw new Error("Oferta não encontrada");
      const u: Record<string, any> = { responded_at: new Date().toISOString() };
      if (b.response === "accept") { u.status = "accepted"; await nt(sb, "✅ Oferta aceita!", `Oferta por "${of2.listing?.title}" aceita!`, of2.buyer_cpf, of2.listing_id, "marketplace_offer"); }
      else if (b.response === "reject") { u.status = "rejected"; await nt(sb, "❌ Recusada", `Oferta por "${of2.listing?.title}" recusada.`, of2.buyer_cpf, of2.listing_id, "marketplace_offer"); }
      else if (b.response === "counter") { u.status = "counter"; u.counter_price = b.counter_price; u.counter_message = b.counter_message || null; await nt(sb, "🔄 Contra-proposta!", `R$ ${b.counter_price?.toFixed(2)} por "${of2.listing?.title}".`, of2.buyer_cpf, of2.listing_id, "marketplace_offer"); }
      const { error } = await sb.from("vault_marketplace_offers").update(u).eq("id", b.offer_id);
      if (error) throw error;
      return j({ success: true });
    }
    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mkoff error:", e);
    return j({ error: e.message }, 500);
  }
});
