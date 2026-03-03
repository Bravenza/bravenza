import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Admin auth
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Auth required" }, 401);
  const anonSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await anonSb.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const { data: adm } = await sb.from("admin_profiles").select("id").eq("user_id", claims.claims.sub).maybeSingle();
  if (!adm) return json({ error: "Admin only" }, 403);

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  let body: any = {};
  try { body = await req.json(); } catch {}
  const limit = body.limit || 50;

  // Fetch pending
  const { data: pending, error: fetchErr } = await sb
    .from("sneaker_models")
    .select("id, sku, model_name_en, description_en, colorway, brand_id, silhouette_id")
    .in("translation_status", ["pending", "error"])
    .limit(limit);

  if (fetchErr) return json({ ok: false, error: fetchErr.message }, 500);
  if (!pending || pending.length === 0) return json({ ok: true, translated: 0, message: "No pending translations" });

  // Load brands and silhouettes for context
  const { data: brands } = await sb.from("brands").select("id, name");
  const { data: silhouettes } = await sb.from("silhouettes").select("id, name");
  const brandMap = new Map((brands || []).map((b: any) => [b.id, b.name]));
  const silMap = new Map((silhouettes || []).map((s: any) => [s.id, s.name]));

  let translated = 0;
  let errors = 0;
  const sampleErrors: any[] = [];

  for (const item of pending) {
    const brandName = brandMap.get(item.brand_id) || "Marca";
    const silName = silMap.get(item.silhouette_id) || "sneaker";

    // If no english description, generate neutral PT
    if (!item.description_en) {
      const cw = item.colorway ? ` na colorway ${item.colorway}` : "";
      await sb.from("sneaker_models").update({
        model_name_pt: item.model_name_en || item.sku,
        description_pt: `Modelo ${silName} da ${brandName}${cw}. Ideal para uso casual e coleção.`,
        translation_status: "translated",
      }).eq("id", item.id);
      translated++;
      continue;
    }

    // Need Lovable AI for translation
    if (!lovableKey) {
      // Can't translate, leave as pending
      continue;
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: "Traduza o nome e descrição de sneaker do inglês para PT-BR. Mantenha nomes de marca, silhueta e SKU sem traduzir. Retorne JSON: {name_pt:'...',desc_pt:'...'}",
            },
            {
              role: "user",
              content: `Name: "${item.model_name_en || item.sku}" | Desc: "${item.description_en}"`,
            },
          ],
        }),
      });

      if (res.status === 429) { console.warn("Lovable AI rate limited"); continue; }
      if (res.status === 402) { console.error("Lovable AI credits exhausted"); break; }
      if (!res.ok) throw new Error(`Lovable AI ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const t = JSON.parse(jsonMatch[0]);
        await sb.from("sneaker_models").update({
          model_name_pt: t.name_pt,
          description_pt: t.desc_pt,
          translation_status: "translated",
        }).eq("id", item.id);
        translated++;
      } else {
        throw new Error("No JSON in response");
      }
    } catch (e: any) {
      errors++;
      if (sampleErrors.length < 5) sampleErrors.push({ sku: item.sku, error: e.message });
      await sb.from("sneaker_models").update({
        translation_status: "error",
        translation_error: e.message,
      }).eq("id", item.id);
    }
  }

  return json({
    ok: true,
    total_processed: pending.length,
    translated,
    errors,
    still_pending: !lovableKey ? pending.filter((p: any) => p.description_en).length : 0,
    provider_configured: !!lovableKey,
    sample_errors: sampleErrors,
  });
});
