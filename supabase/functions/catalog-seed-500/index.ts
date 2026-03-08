import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const PLACEHOLDER = "/img/shoe-placeholder-white.png";

const STOCKX_API_HOST = "sneaker-database-stockx.p.rapidapi.com";
const STOCKX_API_BASE = "https://sneaker-database-stockx.p.rapidapi.com";

const BRAND_QUOTAS: Record<string, number> = {
  Nike: 170, Jordan: 90, adidas: 70, Yeezy: 40, "New Balance": 70,
  ASICS: 30, PUMA: 10, Converse: 10, Vans: 5, Reebok: 5,
};

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
    item?.image, item?.thumbnail, item?.media?.imageUrl, item?.media?.smallImageUrl,
    item?.media?.thumbUrl, item?.imageUrl, item?.image?.original, item?.image?.thumbnail,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  const flat = JSON.stringify(item);
  const m = flat.match(/https?:\/\/[^\s"]+\.(jpg|jpeg|png|webp)/i);
  return m ? m[0] : null;
}

function normalize(item: any) {
  const sku = item.styleID || item.styleId || item.style_id || item.sku || item.id || item._id;
  if (!sku || typeof sku !== "string") return null;

  return {
    sku: sku.trim(),
    name: item.shoeName || item.title || item.name || item.model || null,
    brand: item.brand || null,
    colorway: item.color || item.colorway || null,
    releaseDate: item.releaseDate || item.release_date || null,
    msrp: item.retailPrice || item.retail_price || item.msrp || null,
    description: item.description || null,
    imageUrl: findImageUrl(item),
  };
}

// ─── Exchange rate ─────────────────────────────────────────
let cachedRate: { rate: number; fetchedAt: number } | null = null;
const FALLBACK_RATE = 5.50;

async function getUsdToBrl(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < 3600_000) return cachedRate.rate;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.BRL;
      if (typeof rate === "number" && rate > 0) {
        cachedRate = { rate, fetchedAt: Date.now() };
        return rate;
      }
    }
  } catch (e) { console.error("Exchange rate fetch failed:", e); }
  return cachedRate?.rate || FALLBACK_RATE;
}

function convertMsrp(msrpUsd: number | null, rate: number): number | null {
  if (!msrpUsd || msrpUsd <= 0) return null;
  return Math.ceil(msrpUsd * rate * 100) / 100;
}

let lastReqTime = 0;
async function throttledFetch(url: string, headers: Record<string, string>, retries = 3): Promise<any> {
  const gap = 350;
  const now = Date.now();
  const wait = gap - (now - lastReqTime);
  if (wait > 0) await sleep(wait);
  lastReqTime = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status === 429) {
      await sleep(Math.pow(2, attempt + 1) * 1000);
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

async function translateBatch(
  items: { sku: string; name: string | null; description: string | null; colorway: string | null; brand: string; silhouette: string | null }[],
): Promise<Map<string, { name_pt: string; desc_pt: string }>> {
  const result = new Map<string, { name_pt: string; desc_pt: string }>();
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

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

  if (!lovableKey) return result;

  const toTranslate = items.filter((it) => it.description && !result.has(it.sku));
  if (toTranslate.length === 0) return result;

  for (let i = 0; i < toTranslate.length; i += 10) {
    const batch = toTranslate.slice(i, i + 10);
    const prompt = batch.map((it, idx) => `[${idx}] Name: "${it.name || it.sku}" | Desc: "${it.description}"`).join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.2,
          messages: [
            { role: "system", content: "Traduza nomes e descrições de sneakers do inglês para PT-BR. Mantenha nomes de marca, silhueta e SKU sem traduzir. Retorne JSON array: [{i:0,name_pt:'...',desc_pt:'...'},...]" },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.status === 429) { await sleep(5000); continue; }
      if (res.status === 402) break;
      if (!res.ok) throw new Error(`Lovable AI ${res.status}`);

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

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Auth: require admin via shared guard
  try {
    await requireAdmin(req, sb);
  } catch (error) {
    return authErrorResponse(error);
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const mode = body.mode || "seed"; // "test" | "seed" | "seed_brand" | "brands_list"

  const rapidKey = Deno.env.get("RAPIDAPI_KEY");
  if (!rapidKey) return json({ ok: false, error: "RAPIDAPI_KEY não configurada.", missing: ["RAPIDAPI_KEY"] });

  const apiHeaders = { "X-RapidAPI-Key": rapidKey, "X-RapidAPI-Host": STOCKX_API_HOST };

  // --- Test mode ---
  if (mode === "test") {
    try {
      const data = await throttledFetch(`${STOCKX_API_BASE}/getproducts?keywords=Jordan+1&limit=1`, apiHeaders);
      const arr = extractArray(data);
      return json({ ok: true, test: true, sample_count: arr.length, sample: arr[0] || null, source: "sneaker-database-stockx" });
    } catch (e: any) {
      return json({ ok: false, error: e.message });
    }
  }

  // --- Brands list mode ---
  if (mode === "brands_list") {
    const brandsList = Object.entries(BRAND_QUOTAS).map(([name, quota]) => ({ name, quota }));
    return json({ ok: true, brands: brandsList, total_quota: Object.values(BRAND_QUOTAS).reduce((a, b) => a + b, 0) });
  }

  // --- Seed one brand mode (processes one batch per call) ---
  if (mode === "seed_brand") {
    const brandName = body.brand as string;
    const quota = BRAND_QUOTAS[brandName];
    if (!brandName || !quota) return json({ ok: false, error: `Marca inválida: ${brandName}` }, 400);
    const queryIndex = body.query_index ?? 0; // which silhouette query to start from
    const BATCH_LIMIT = 30; // max items to process per call

    const { data: taxonomy } = await sb.from("silhouette_taxonomy").select("*").order("priority");
    const { data: brands } = await sb.from("brands").select("*");
    const { data: silhouettes } = await sb.from("silhouettes").select("*");

    const brandMap = new Map((brands || []).map((b: any) => [b.name, b.id]));
    const silMap = new Map((silhouettes || []).map((s: any) => [`${s.brand_id}|${s.name}`, s.id]));
    const brandId = brandMap.get(brandName);
    if (!brandId) return json({ ok: false, error: `Marca não encontrada no DB: ${brandName}` }, 400);

    const brandSilhouettes = (taxonomy || [])
      .filter((t: any) => t.brand_name === brandName)
      .map((t: any) => t.silhouette_name as string);
    
    const searchQueries: string[] = [];
    for (const sil of brandSilhouettes) {
      searchQueries.push(`${brandName} ${sil}`);
    }
    searchQueries.push(brandName);

    function matchSilhouette(name: string): string | null {
      const lower = (name || "").toLowerCase();
      const rows = (taxonomy || []).filter((t: any) => t.brand_name === brandName);
      for (const t of rows) {
        for (const kw of t.match_keywords || []) {
          if (lower.includes(kw.toLowerCase())) return silMap.get(`${brandId}|${t.silhouette_name}`) || null;
        }
      }
      return null;
    }

    const stats = { inserted: 0, updated: 0, skipped: 0, skipped_existing: 0, translated: 0, pending: 0, errors: 0, queries_used: 0, pages_scanned: 0 };

    try {
      const { data: existingRows } = await sb
        .from("sneaker_models")
        .select("sku")
        .eq("brand_id", brandId);
      const existingSkus = new Set((existingRows || []).map((r: any) => r.sku));
      const existingCount = existingSkus.size;

      let collected: any[] = [];
      const seenSkus = new Set<string>();
      const PAGES_PER_QUERY = 3;
      let lastQueryIndex = queryIndex;

      // Start from queryIndex, collect up to BATCH_LIMIT new items
      for (let qi = queryIndex; qi < searchQueries.length; qi++) {
        if (collected.length >= BATCH_LIMIT) break;
        lastQueryIndex = qi;
        const query = searchQueries[qi];
        stats.queries_used++;

        for (let page = 1; page <= PAGES_PER_QUERY; page++) {
          if (collected.length >= BATCH_LIMIT) break;
          try {
            const searchUrl = `${STOCKX_API_BASE}/getproducts?keywords=${encodeURIComponent(query)}&limit=40&page=${page}`;
            const data = await throttledFetch(searchUrl, apiHeaders);
            const items = extractArray(data);
            if (items.length === 0) break;
            stats.pages_scanned++;

            let newInPage = 0;
            for (const raw of items) {
              if (collected.length >= BATCH_LIMIT) break;
              const norm = normalize(raw);
              if (!norm) continue;
              if (seenSkus.has(norm.sku)) continue;
              seenSkus.add(norm.sku);

              if (existingSkus.has(norm.sku)) {
                stats.skipped_existing++;
                continue;
              }

              collected.push({ ...norm, brandName, brandId });
              newInPage++;
            }

            if (newInPage === 0) break;
          } catch (e: any) {
            console.error(`Failed /getproducts for "${query}" page ${page}:`, e.message);
            break;
          }
        }
      }

      const hasMore = lastQueryIndex + 1 < searchQueries.length && existingCount + collected.length < quota;

      const translateQueue: any[] = [];

      for (const item of collected) {
        const silhouetteId = matchSilhouette(item.name || "");
        if (!silhouetteId) stats.missing_silhouette++;
        if (!item.imageUrl) stats.missing_image++;
        if (!item.msrp) stats.missing_msrp++;
        if (!item.releaseDate) stats.missing_release++;

        const imageStatus = item.imageUrl ? "stockx" : "placeholder";
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
          if (Object.keys(updates).length) await sb.from("sneaker_models").update(updates).eq("id", existing.id);
          sneakerId = existing.id;
          stats.updated++;
        } else {
          const parsedDate = item.releaseDate ? (() => {
            try { const d = new Date(item.releaseDate); return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]; } catch { return null; }
          })() : null;

          const exchangeRate = await getUsdToBrl();
          const { data: ins, error: insErr } = await sb.from("sneaker_models").insert({
            brand_id: item.brandId, silhouette_id: silhouetteId, sku: item.sku,
            colorway: item.colorway, release_date: parsedDate,
            msrp_usd: item.msrp, msrp: convertMsrp(item.msrp, exchangeRate),
            msrp_exchange_rate: item.msrp ? exchangeRate : null,
            model_name_en: item.name, description_en: item.description,
            placeholder_image_url: PLACEHOLDER, image_status: imageStatus,
            needs_official_image: true, source_primary: "stockx", translation_status: "pending",
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

        await sb.from("sneaker_images").update({ is_primary: false }).eq("sneaker_id", sneakerId);
        const imgUrl = item.imageUrl || PLACEHOLDER;
        const imgSource = item.imageUrl ? "stockx" : "placeholder";
        await sb.from("sneaker_images").upsert(
          { sneaker_id: sneakerId, image_url: imgUrl, source: imgSource, is_primary: true },
          { onConflict: "sneaker_id,source,image_url" }
        );

        translateQueue.push({
          sku: item.sku, sneakerId, name: item.name, description: item.description,
          colorway: item.colorway, brand: item.brandName,
          silhouette: silhouetteId ? (silhouettes || []).find((s: any) => s.id === silhouetteId)?.name : null,
        });
      }

      // Translate
      if (translateQueue.length) {
        const translations = await translateBatch(translateQueue);
        for (const item of translateQueue) {
          const t = translations.get(item.sku);
          if (t) {
            await sb.from("sneaker_models").update({
              model_name_pt: t.name_pt, description_pt: t.desc_pt, translation_status: "translated",
            }).eq("id", item.sneakerId);
            stats.translated++;
          } else {
            stats.pending++;
          }
        }
      }

      return json({
        ok: true, brand: brandName, fetched: collected.length, quota,
        inserted: stats.inserted, updated: stats.updated, skipped: stats.skipped,
        skipped_existing: stats.skipped_existing,
        queries_used: stats.queries_used, pages_scanned: stats.pages_scanned,
        translated: stats.translated, pending: stats.pending, errors: stats.errors,
        has_more: hasMore, next_query_index: lastQueryIndex + 1,
        total_in_db: existingCount + stats.inserted,
      });
    } catch (e: any) {
      console.error(`catalog-seed brand ${brandName} error:`, e);
      return json({ ok: false, brand: brandName, error: e.message }, 500);
    }
  }

  // Legacy "seed" mode — redirect to brands_list
  return json({ ok: false, error: "Use mode=seed_brand com brand=Nike. Use mode=brands_list para listar marcas." }, 400);
});
