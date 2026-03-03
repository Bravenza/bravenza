import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BATCH_SIZE = 3;
const MAX_PER_RUN = 6;
const GENERIC_PATTERN = "Modelo % da %. Ideal para uso casual%";

// Unified query to find weak descriptions — used for both candidates and remaining count
async function findWeakModels(sb: any, limit: number) {
  // 1) Models with null/empty description_pt that haven't been enriched yet
  const { data: nullModels } = await sb
    .from("sneaker_models")
    .select(
      "id, sku, model_name_en, model_name_pt, description_en, description_pt, colorway, brands:brand_id(name), silhouettes:silhouette_id(name), msrp, release_date, translation_status"
    )
    .or("description_pt.is.null,description_pt.eq.")
    .neq("translation_status", "enriched")
    .order("created_at", { ascending: false })
    .limit(limit);

  // 2) Models with generic auto-generated descriptions
  const { data: genericModels } = await sb
    .from("sneaker_models")
    .select(
      "id, sku, model_name_en, model_name_pt, description_en, description_pt, colorway, brands:brand_id(name), silhouettes:silhouette_id(name), msrp, release_date, translation_status"
    )
    .not("description_pt", "is", null)
    .like("description_pt", GENERIC_PATTERN)
    .neq("translation_status", "enriched")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Deduplicate
  const seen = new Set<string>();
  const all = [...(nullModels || []), ...(genericModels || [])];
  return all.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }).slice(0, limit);
}

async function countWeakModels(sb: any): Promise<number> {
  const { count: nullCount } = await sb
    .from("sneaker_models")
    .select("id", { count: "exact", head: true })
    .or("description_pt.is.null,description_pt.eq.")
    .neq("translation_status", "enriched");

  const { count: genericCount } = await sb
    .from("sneaker_models")
    .select("id", { count: "exact", head: true })
    .not("description_pt", "is", null)
    .like("description_pt", GENERIC_PATTERN)
    .neq("translation_status", "enriched");

  // This may slightly overcount due to overlap, but it's close enough
  return (nullCount || 0) + (genericCount || 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Auth check
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return json({ error: "Auth required" }, 401);

  const anonSb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const {
    data: { user },
    error: userErr,
  } = await anonSb.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  const { data: adm } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adm) return json({ error: "Admin only" }, 403);

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const mode = body.mode || "enrich"; // "preview" | "enrich"
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey)
    return json({ ok: false, error: "LOVABLE_API_KEY não configurada" });

  // Find weak candidates
  const candidates = await findWeakModels(sb, MAX_PER_RUN);

  if (mode === "preview") {
    const totalWeak = await countWeakModels(sb);
    return json({
      ok: true,
      total_weak: totalWeak,
      samples: candidates.slice(0, 5).map((m: any) => ({
        sku: m.sku,
        name: m.model_name_pt || m.model_name_en,
        current_desc: m.description_pt,
        has_en_desc: !!m.description_en,
      })),
    });
  }

  if (candidates.length === 0) {
    return json({
      ok: true,
      enriched: 0,
      skipped: 0,
      errors: 0,
      total: 0,
      has_more: false,
      remaining: 0,
      message: "Nenhum modelo com descrição fraca encontrado.",
    });
  }

  // Enrich mode
  const stats = { enriched: 0, skipped: 0, errors: 0, total: candidates.length };

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    const prompt = batch
      .map((m: any, idx: number) => {
        const brand = m.brands?.name || "Desconhecida";
        const silhouette = m.silhouettes?.name || "";
        const name = m.model_name_pt || m.model_name_en || m.sku;
        const colorway = m.colorway || "";
        const msrp = m.msrp ? `R$${m.msrp}` : "";
        const release = m.release_date || "";
        const enDesc = m.description_en || "Sem descrição em inglês";

        return `[${idx}]
Nome: ${name}
Marca: ${brand}
Silhueta: ${silhouette}
Colorway: ${colorway}
MSRP: ${msrp}
Lançamento: ${release}
Descrição EN: ${enDesc}`;
      })
      .join("\n\n");

    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: `Você é um copywriter especialista em sneakers e streetwear brasileiro. Escreva descrições em PT-BR para sneakers com as seguintes regras:

ESTILO:
- Tom editorial, envolvente, com personalidade — como se fosse uma revista de sneakers
- Conte a história do modelo: inspiração, contexto cultural, colaboração, significado da colorway
- Destaque materiais, tecnologias de amortecimento e detalhes de design
- Use linguagem que gere desejo e conexão emocional com o sneakerhead
- Termine com uma frase que posicione o sneaker (uso casual, coleção, performance, etc.)

REGRAS:
- 3-5 frases por descrição (80-200 palavras)
- NÃO use travessões (—)
- Mantenha nomes de marca, silhueta, colorway e SKU em inglês
- Use "sneaker" (não "tênis" ou "sapato") quando se referir ao produto
- Sentence case (não Title Case)
- Se não houver informação suficiente, crie uma descrição baseada na marca e silhueta conhecidas

FORMATO DE RESPOSTA:
JSON array: [{"i":0,"desc":"descrição aqui"},...]
Retorne APENAS o JSON, sem markdown.`,
              },
              { role: "user", content: prompt },
            ],
          }),
        }
      );

      if (res.status === 429) {
        console.warn("Rate limited, waiting 5s...");
        await sleep(5000);
        stats.skipped += batch.length;
        continue;
      }
      if (res.status === 402) {
        console.error("Credits exhausted");
        stats.skipped += batch.length;
        break;
      }
      if (!res.ok) {
        console.error(`AI error ${res.status}`);
        stats.errors += batch.length;
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const arr = JSON.parse(jsonMatch[0]);
        for (const item of arr) {
          const model = batch[item.i];
          if (!model || !item.desc) continue;

          const { error: updateErr } = await sb
            .from("sneaker_models")
            .update({
              description_pt: item.desc,
              translation_status: "enriched",
            })
            .eq("id", model.id);

          if (updateErr) {
            console.error("Update error:", updateErr);
            stats.errors++;
          } else {
            stats.enriched++;
          }
        }
      } else {
        console.error("No JSON found in AI response");
        stats.errors += batch.length;
      }
    } catch (e: any) {
      console.error("Batch error:", e.message);
      stats.errors += batch.length;
    }

    // Small delay between batches
    if (i + BATCH_SIZE < candidates.length) {
      await sleep(1500);
    }
  }

  // Count remaining using the SAME criteria
  const remaining = await countWeakModels(sb);
  // Only signal has_more if we actually enriched something this round AND there are more
  const hasMore = remaining > 0 && stats.enriched > 0;

  return json({
    ok: true,
    ...stats,
    has_more: hasMore,
    remaining,
    message: `${stats.enriched} descrições enriquecidas de ${stats.total} candidatos.`,
  });
});
