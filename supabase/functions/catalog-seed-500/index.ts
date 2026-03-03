import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const PLACEHOLDER = "/img/shoe-placeholder-white.png";

const BRAND_QUOTAS: Record<string, number> = {
  Nike: 170, Jordan: 90, adidas: 70, Yeezy: 40, "New Balance": 70,
  ASICS: 30, PUMA: 10, Converse: 10, Vans: 5, Reebok: 5,
};

// ---------- helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  for (const k of ["results", "data", "sneakers", "items", "products"]) {
    if (payload?.[k] && Array.isArray(payload[k])) return payload[k];
  }
  return [];
}

function findImageUrl(item: any): string | null {
  const candidates = [
    item?.media?.imageUrl,
    item?.media?.imageUrlPrimary,
    item?.media?.smallImageUrl,
    item?.media?.thumbUrl,
    item?.imageUrl,
    item?.image?.original,
    item?.image?.thumbnail,
    item?.thumbnail,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\/.+\.(jpg|jpeg|png|webp)/i.test(c)) return c;
  }
  // deep scan for any URL-like string ending in image ext
  const flat = JSON.stringify(item);
  const m = flat.match(/https?:\/\/[^\s"]+\.(jpg|jpeg|png|webp)/i);
  return m ? m[0] : null;
}

function normalize(item: any) {
  const sku = item.sku || item.styleId || item.style_id || item.id;
  if (!sku || typeof sku !== "string") return null;
  return {
    sku: sku.trim(),
    name: item.name || item.title || item.sneakerName || item.model || null,
    colorway: item.colorway || null,
    releaseDate: item.releaseDate || item.release_date || null,
    msrp: item.retailPrice || item.retail_price || item.msrp || null,
    description: item.description || null,
    imageUrl: findImageUrl(item),
  };
}

// ---------- throttled fetch ----------
let lastReqTime = 0;
async function throttledFetch(url: string, headers: Record<string, string>, retries = 3): Promise<any> {
  const gap = 210; // ~5 req/s
  const now = Date.now();
  const wait = gap - (now - lastReqTime);
  if (wait > 0) await sleep(wait);
  lastReqTime = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status === 429) {
      const backoff = Math.pow(2, attempt + 1) * 1000;
      console.warn(`429 rate limited, backing off ${backoff}ms`);
      await sleep(backoff);
      continue;
    }
    if (res.status >= 500 && attempt < retries - 1) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    throw new Error(`TSDB ${res.status}: ${await res.text().catch(() => "")}`);
  }
  throw new Error("Max retries exceeded");
}

// ---------- translate helper ----------
async function translateBatch(
  items: { sku: string; name: string | null; description: string | null; colorway: string | null; brand: string; silhouette: string | null }[],
): Promise<Map<string, { name_pt: string; desc_pt: string }>> {
  const result = new Map<string, { name_pt: string; desc_pt: string }>();
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const provider = Deno.env.get("TRANSLATE_PROVIDER") || "none";
  
  // Generate neutral descriptions for items without english desc
  for (const it of items) {
    if (!it.description) {
      const sil = it.silhouette || "sneaker";
      const cw = it.colorway ? ` na colorway ${it.colorway}` : "";
      result.set(it.sku, {
        name_pt: it.name || it.sku,
        desc_pt: `Modelo ${sil} da ${it.brand}${cw}. Ideal para uso casual e coleção.`,
      });
    }
  }

  if (provider === "none" || !apiKey) return result;

  // Only translate items that have english text and weren't already handled
  const toTranslate = items.filter((it) => it.description && !result.has(it.sku));
  if (toTranslate.length === 0) return result;

  // Batch in groups of 10
  for (let i = 0; i < toTranslate.length; i += 10) {
    const batch = toTranslate.slice(i, i + 10);
    const prompt = batch
      .map((it, idx) => `[${idx}] Name: "${it.name || it.sku}" | Desc: "${it.description}"`)
      .join("\n");

    try {
      const model = Deno.env.get("OPENAI_TRANSLATE_MODEL") || "gpt-4.1-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "Traduza nomes e descrições de sneakers do inglês para PT-BR. Mantenha nomes de marca, silhueta e SKU sem traduzir. Retorne JSON array: [{i:0,name_pt:'...',desc_pt:'...'},...]",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const arr = JSON.parse(jsonMatch[0]);
        for (const t of arr) {
          const it = batch[t.i];
          if (it) result.set(it.sku, { name_pt: t.name_pt, desc_pt: t.desc_pt });
        }
      }
    } catch (e) {
      console.error("Translation batch error:", e);
    }
  }

  return result;
}

// ---------- main ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Admin auth check
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Auth required" }, 401);

  const anonSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await anonSb.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  const { data: adm } = await sb.from("admin_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!adm) return json({ error: "Admin only" }, 403);

  // Parse body
  let body: any = {};
  try { body = await req.json(); } catch {}
  const mode = body.mode || "seed"; // "test" | "seed"

  // Check TSDB config
  const rapidKey = Deno.env.get("RAPIDAPI_KEY");
  const tsdbHost = Deno.env.get("TSDB_RAPIDAPI_HOST");
  const tsdbBase = Deno.env.get("TSDB_API_BASE_URL");
  const missing: string[] = [];
  if (!rapidKey) missing.push("RAPIDAPI_KEY");
  if (!tsdbHost) missing.push("TSDB_RAPIDAPI_HOST");
  if (!tsdbBase) missing.push("TSDB_API_BASE_URL");
  if (missing.length) return json({ ok: false, error: "TSDB connector not configured", missing });

  const listPath = Deno.env.get("TSDB_LIST_PATH") || "/sneakers";
  const searchPath = Deno.env.get("TSDB_SEARCH_PATH") || "/search";
  const pageSize = parseInt(Deno.env.get("TSDB_PAGE_SIZE") || "50");
  const apiHeaders = { "X-RapidAPI-Key": rapidKey!, "X-RapidAPI-Host": tsdbHost! };

  // Test mode
  if (mode === "test") {
    try {
      const testUrl = `${tsdbBase}${listPath}?limit=1`;
      const data = await throttledFetch(testUrl, apiHeaders);
      const arr = extractArray(data);
      return json({ ok: true, test: true, sample_count: arr.length, sample: arr[0] || null });
    } catch (e: any) {
      return json({ ok: false, error: e.message });
    }
  }

  // Load taxonomy
  const { data: taxonomy } = await sb.from("silhouette_taxonomy").select("*").order("priority");
  const { data: brands } = await sb.from("brands").select("*");
  const { data: silhouettes } = await sb.from("silhouettes").select("*");

  const brandMap = new Map((brands || []).map((b: any) => [b.name, b.id]));
  const silMap = new Map((silhouettes || []).map((s: any) => [`${s.brand_id}|${s.name}`, s.id]));

  function matchSilhouette(name: string, brandName: string): string | null {
    const lower = (name || "").toLowerCase();
    const rows = (taxonomy || []).filter((t: any) => t.brand_name === brandName);
    for (const t of rows) {
      for (const kw of t.match_keywords || []) {
        if (lower.includes(kw.toLowerCase())) {
          const brandId = brandMap.get(brandName);
          if (brandId) return silMap.get(`${brandId}|${t.silhouette_name}`) || null;
        }
      }
    }
    return null;
  }

  // Seed
  const stats = {
    inserted: 0, updated: 0, skipped: 0,
    per_brand: {} as Record<string, number>,
    missing_image: 0, missing_msrp: 0, missing_release: 0, missing_silhouette: 0,
    translated: 0, pending: 0, errors: 0,
    sample_missing_sil: [] as any[],
    sample_errors: [] as any[],
  };

  try {
    for (const [brandName, quota] of Object.entries(BRAND_QUOTAS)) {
      const brandId = brandMap.get(brandName);
      if (!brandId) { console.warn(`Brand not found: ${brandName}`); continue; }

      let collected: any[] = [];
      let page = 1;

      while (collected.length < quota && page <= 20) {
        let items: any[] = [];
        try {
          // Try list endpoint first
          const listUrl = `${tsdbBase}${listPath}?brand=${encodeURIComponent(brandName)}&limit=${pageSize}&page=${page}`;
          const data = await throttledFetch(listUrl, apiHeaders);
          items = extractArray(data);
        } catch {
          try {
            // Fallback to search
            const searchUrl = `${tsdbBase}${searchPath}?q=${encodeURIComponent(brandName)}&limit=${pageSize}&page=${page}`;
            const data = await throttledFetch(searchUrl, apiHeaders);
            items = extractArray(data);
          } catch (e2: any) {
            console.error(`Failed both endpoints for ${brandName} page ${page}:`, e2.message);
            break;
          }
        }

        if (items.length === 0) break;

        for (const raw of items) {
          if (collected.length >= quota) break;
          const norm = normalize(raw);
          if (!norm) continue;
          collected.push({ ...norm, brandName, brandId });
        }
        page++;
      }

      // Batch upsert
      const translateQueue: any[] = [];

      for (const item of collected) {
        const silhouetteId = matchSilhouette(item.name || "", item.brandName);
        if (!silhouetteId) {
          stats.missing_silhouette++;
          if (stats.sample_missing_sil.length < 10) stats.sample_missing_sil.push({ sku: item.sku, name: item.name });
        }

        const imageStatus = item.imageUrl ? "tsdb" : "placeholder";
        if (!item.imageUrl) stats.missing_image++;
        if (!item.msrp) stats.missing_msrp++;
        if (!item.releaseDate) stats.missing_release++;

        // Upsert sneaker_models
        const { data: existing } = await sb.from("sneaker_models").select("id,model_name_en,description_en,model_name_pt").eq("sku", item.sku).maybeSingle();

        let sneakerId: string;
        if (existing) {
          const updates: any = {};
          if (!existing.model_name_en && item.name) updates.model_name_en = item.name;
          if (!existing.description_en && item.description) updates.description_en = item.description;
          if (silhouetteId) updates.silhouette_id = silhouetteId;
          updates.image_status = imageStatus;
          updates.placeholder_image_url = PLACEHOLDER;

          if (Object.keys(updates).length) {
            await sb.from("sneaker_models").update(updates).eq("id", existing.id);
          }
          sneakerId = existing.id;
          stats.updated++;
        } else {
          const parsedDate = item.releaseDate ? (() => {
            try { const d = new Date(item.releaseDate); return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]; } catch { return null; }
          })() : null;

          const { data: ins, error: insErr } = await sb.from("sneaker_models").insert({
            brand_id: item.brandId,
            silhouette_id: silhouetteId,
            sku: item.sku,
            colorway: item.colorway,
            release_date: parsedDate,
            msrp: item.msrp,
            model_name_en: item.name,
            description_en: item.description,
            placeholder_image_url: PLACEHOLDER,
            image_status: imageStatus,
            needs_official_image: true,
            source_primary: "tsdb",
            translation_status: "pending",
          }).select("id").single();

          if (insErr) {
            if (insErr.code === "23505") { stats.skipped++; continue; }
            console.error("Insert error:", insErr);
            continue;
          }
          sneakerId = ins.id;
          stats.inserted++;
        }

        // Manage images — reset primary, then upsert
        await sb.from("sneaker_images").update({ is_primary: false }).eq("sneaker_id", sneakerId);
        const imgUrl = item.imageUrl || PLACEHOLDER;
        const imgSource = item.imageUrl ? "tsdb" : "placeholder";
        const { error: imgErr } = await sb.from("sneaker_images").upsert(
          { sneaker_id: sneakerId, image_url: imgUrl, source: imgSource, is_primary: true },
          { onConflict: "sneaker_id,source,image_url" }
        );
        if (imgErr) console.warn("Image upsert warn:", imgErr.message);

        translateQueue.push({
          sku: item.sku, sneakerId,
          name: item.name, description: item.description,
          colorway: item.colorway, brand: item.brandName,
          silhouette: silhouetteId ? (silhouettes || []).find((s: any) => s.id === silhouetteId)?.name : null,
        });

        stats.per_brand[item.brandName] = (stats.per_brand[item.brandName] || 0) + 1;
      }

      // Translate batch for this brand
      if (translateQueue.length) {
        const translations = await translateBatch(translateQueue);
        for (const item of translateQueue) {
          const t = translations.get(item.sku);
          if (t) {
            await sb.from("sneaker_models").update({
              model_name_pt: t.name_pt,
              description_pt: t.desc_pt,
              translation_status: "translated",
            }).eq("id", item.sneakerId);
            stats.translated++;
          } else {
            stats.pending++;
          }
        }
      }
    }

    return json({
      ok: true,
      inserted_count: stats.inserted,
      updated_count: stats.updated,
      duplicates_skipped: stats.skipped,
      per_brand_counts: stats.per_brand,
      missing_image_count: stats.missing_image,
      missing_msrp_count: stats.missing_msrp,
      missing_release_date_count: stats.missing_release,
      missing_silhouette_count: stats.missing_silhouette,
      translation_translated_count: stats.translated,
      translation_pending_count: stats.pending,
      translation_error_count: stats.errors,
      sample_missing_silhouette: stats.sample_missing_sil,
      sample_translation_errors: stats.sample_errors,
    });
  } catch (e: any) {
    console.error("catalog-seed-500 error:", e);
    return json({ ok: false, error: e.message }, 500);
  }
});
