import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const PLACEHOLDER = "/img/shoe-placeholder-white.png";

// ---- Sneaker Database - StockX (RapidAPI) ----
const STOCKX_API_HOST = "sneaker-database-stockx.p.rapidapi.com";
const STOCKX_API_BASE = "https://sneaker-database-stockx.p.rapidapi.com";

const BRAND_QUOTAS: Record<string, number> = {
  Nike: 170, Jordan: 90, adidas: 70, Yeezy: 40, "New Balance": 70,
  ASICS: 30, PUMA: 10, Converse: 10, Vans: 5, Reebok: 5,
};

// ---------- helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  for (const k of ["results", "data", "sneakers", "items", "products", "hits"]) {
    if (payload?.[k] && Array.isArray(payload[k])) return payload[k];
  }
  return [];
}

function findImageUrl(item: any): string | null {
  const candidates = [
    item?.image,
    item?.thumbnail,
    item?.media?.imageUrl,
    item?.media?.smallImageUrl,
    item?.media?.thumbUrl,
    item?.imageUrl,
    item?.image?.original,
    item?.image?.thumbnail,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  // deep scan for any URL-like string ending in image ext
  const flat = JSON.stringify(item);
  const m = flat.match(/https?:\/\/[^\s"]+\.(jpg|jpeg|png|webp)/i);
  return m ? m[0] : null;
}

function normalize(item: any) {
  // StockX API returns fields like: title, brand, styleId, color, retailPrice, releaseDate, image, description, urlKey
  const sku = item.styleId || item.style_id || item.sku || item.id;
  if (!sku || typeof sku !== "string") return null;

  const name = item.title || item.name || item.shoeName || item.model || null;
  const brand = item.brand || null;
  const colorway = item.color || item.colorway || null;
  const releaseDate = item.releaseDate || item.release_date || null;
  const msrp = item.retailPrice || item.retail_price || item.msrp || null;
  const description = item.description || null;
  const imageUrl = findImageUrl(item);

  return { sku: sku.trim(), name, brand, colorway, releaseDate, msrp, description, imageUrl };
}

// ---------- throttled fetch ----------
let lastReqTime = 0;
async function throttledFetch(url: string, headers: Record<string, string>, retries = 3): Promise<any> {
  const gap = 250; // ~4 req/s to stay safe
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
    throw new Error(`StockX API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  throw new Error("Max retries exceeded");
}

// ---------- translate helper ----------
async function translateBatch(
  items: { sku: string; name: string | null; description: string | null; colorway: string | null; brand: string; silhouette: string | null }[],
): Promise<Map<string, { name_pt: string; desc_pt: string }>> {
  const result = new Map<string, { name_pt: string; desc_pt: string }>();
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

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

  if (!lovableKey) {
    console.warn("LOVABLE_API_KEY not configured, skipping AI translation");
    return result;
  }

  const toTranslate = items.filter((it) => it.description && !result.has(it.sku));
  if (toTranslate.length === 0) return result;

  for (let i = 0; i < toTranslate.length; i += 10) {
    const batch = toTranslate.slice(i, i + 10);
    const prompt = batch
      .map((it, idx) => `[${idx}] Name: "${it.name || it.sku}" | Desc: "${it.description}"`)
      .join("\n");

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
              content:
                "Traduza nomes e descrições de sneakers do inglês para PT-BR. Mantenha nomes de marca, silhueta e SKU sem traduzir. Retorne JSON array: [{i:0,name_pt:'...',desc_pt:'...'},...]",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.status === 429) { console.warn("Lovable AI rate limited, waiting..."); await sleep(5000); continue; }
      if (res.status === 402) { console.error("Lovable AI credits exhausted"); break; }
      if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${await res.text().catch(() => "")}`);

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
  const { data: { user }, error: userErr } = await anonSb.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const { data: adm } = await sb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!adm) return json({ error: "Admin only" }, 403);

  // Parse body
  let body: any = {};
  try { body = await req.json(); } catch {}
  const mode = body.mode || "seed"; // "test" | "seed"

  // Check RapidAPI key
  const rapidKey = Deno.env.get("RAPIDAPI_KEY");
  if (!rapidKey) {
    return json({ ok: false, error: "RAPIDAPI_KEY não configurada. Adicione nas secrets do projeto.", missing: ["RAPIDAPI_KEY"] });
  }

  const apiHeaders = {
    "X-RapidAPI-Key": rapidKey,
    "X-RapidAPI-Host": STOCKX_API_HOST,
  };

  // Test mode — quick connectivity check via /stockx/sneakers
  if (mode === "test") {
    try {
      const testUrl = `${STOCKX_API_BASE}/getproducts?keywords=Jordan+1&limit=1`;
      const data = await throttledFetch(testUrl, apiHeaders);
      const arr = extractArray(data);
      return json({ ok: true, test: true, sample_count: arr.length, sample: arr[0] || null, source: "sneaker-database-stockx" });
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
      const seenSkus = new Set<string>();

      while (collected.length < quota && page <= 20) {
        let items: any[] = [];
        try {
          // Primary: /stockx/sneakers endpoint with brand as query, BRL currency, BR country
          const searchUrl = `${STOCKX_API_BASE}/stockx/sneakers?query=${encodeURIComponent(brandName)}&limit=40&page=${page}&currency=BRL&country=BR`;
          const data = await throttledFetch(searchUrl, apiHeaders);
          items = extractArray(data);
        } catch (e1: any) {
          try {
            // Fallback: /getproducts endpoint
            const fallbackUrl = `${STOCKX_API_BASE}/getproducts?keywords=${encodeURIComponent(brandName)}&limit=40`;
            const data = await throttledFetch(fallbackUrl, apiHeaders);
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
          // Deduplicate within this run
          if (seenSkus.has(norm.sku)) continue;
          seenSkus.add(norm.sku);
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

        const imageStatus = item.imageUrl ? "stockx" : "placeholder";
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
          updates.source_primary = "stockx";

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
            source_primary: "stockx",
            translation_status: "pending",
          }).select("id").single();

          if (insErr) {
            if (insErr.code === "23505") { stats.skipped++; continue; }
            console.error("Insert error:", insErr);
            stats.errors++;
            continue;
          }
          sneakerId = ins.id;
          stats.inserted++;
        }

        // Manage images — reset primary, then upsert
        await sb.from("sneaker_images").update({ is_primary: false }).eq("sneaker_id", sneakerId);
        const imgUrl = item.imageUrl || PLACEHOLDER;
        const imgSource = item.imageUrl ? "stockx" : "placeholder";
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
      source: "sneaker-database-stockx",
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
