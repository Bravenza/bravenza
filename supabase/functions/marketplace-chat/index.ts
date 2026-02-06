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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cpf = req.headers.get("x-client-cpf");
  if (!cpf) return j({ error: "CPF não informado" }, 401);
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;
  try {
    if (mt === "GET" && a === "chat-messages") {
      const oi = url.searchParams.get("order_id"), li = url.searchParams.get("listing_id");
      let q = sb.from("vault_marketplace_messages").select("*").order("created_at", { ascending: true });
      if (oi) q = q.eq("order_id", oi); else if (li) q = q.eq("listing_id", li); else throw new Error("order_id ou listing_id obrigatório");
      const { data, error } = await q; if (error) throw error;
      if (data && data.length > 0) { const ur = data.filter((m: any) => m.sender_cpf !== cpf && !m.read_at).map((m: any) => m.id); if (ur.length > 0) await sb.from("vault_marketplace_messages").update({ read_at: new Date().toISOString() }).in("id", ur); }
      return j({ messages: data || [] });
    }
    if (mt === "POST" && a === "send-message") {
      const b = await req.json();
      const { data: mg, error } = await sb.from("vault_marketplace_messages").insert({ order_id: b.order_id || null, listing_id: b.listing_id || null, sender_cpf: cpf, sender_name: b.sender_name, message: b.message, is_admin: b.is_admin || false }).select().single(); if (error) throw error;
      if (b.order_id) { const { data: od } = await sb.from("vault_marketplace_orders").select(`buyer_cpf, listing:vault_marketplace_listings!inner(title), seller:vault_seller_profiles!inner(member:vault_members!inner(client_cpf))`).eq("id", b.order_id).single(); if (od) { const to = cpf === od.buyer_cpf ? od.seller?.member?.client_cpf : od.buyer_cpf; if (to) await nt(sb, "💬 Nova mensagem", `Mensagem sobre "${od.listing?.title}".`, to, b.order_id, "marketplace_chat"); } }
      return j({ success: true, message: mg });
    }
    return j({ error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("Chat error:", e);
    return j({ error: e.message }, 500);
  }
});
