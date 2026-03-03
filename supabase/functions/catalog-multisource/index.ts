import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const API_BASE = "https://sneaker-database-stockx.p.rapidapi.com";
const API_HOST = "sneaker-database-stockx.p.rapidapi.com";
const PLACEHOLDER = "/img/shoe-placeholder-white.png";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Source definitions ───────────────────────────────────────────

interface SourceDef {
  id: string;
  name: string;
  searchPath: (query: string, page: number) => string;
  descriptionPath: (sku: string) => string;
  /** How to extract items array from search response */
  extractItems: (data: any) => any[];
  /** How to normalize a single item to our internal format */
  normalize: (item: any) => NormalizedItem | null;
  /** How to normalize description/detail response */
  normalizeDetail: (data: any) => Partial<NormalizedItem> | null;
  hasSearch: boolean;
  hasDescription: boolean;
}

interface NormalizedItem {
  sku: string;
  name: string | null;
  brand: string | null;
  colorway: string | null;
  releaseDate: string | null;
  msrp: number | null;
  description: string | null;
  imageUrl: string | null;
}

function findImage(item: any): string | null {
  const candidates = [
    item?.image, item?.thumbnail, item?.media?.imageUrl, item?.media?.smallImageUrl,
    item?.media?.thumbUrl, item?.imageUrl, item?.image?.original, item?.image?.thumbnail,
    item?.main_picture_url, item?.grid_picture_url, item?.original_picture_url,
    item?.product_template_external_pictures?.[0]?.main_picture_url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  // Deep search for any image URL in the item
  const flat = JSON.stringify(item);
  const m = flat.match(/https?:\/\/[^\s"]+\.(jpg|jpeg|png|webp)/i);
  return m ? m[0] : null;
}

function extractSku(item: any): string | null {
  const raw = item.styleID || item.styleId || item.style_id || item.sku || item.slug || item.id || item._id || item.spu;
  if (!raw || typeof raw !== "string") return null;
  return raw.trim();
}

// ─── StadiumGoods ────────────────────────────────────────────────

const stadiumGoods: SourceDef = {
  id: "stadiumgoods",
  name: "StadiumGoods",
  hasSearch: true,
  hasDescription: false, // description needs URL, not SKU
  searchPath: (q, page) => `/sg/search?query=${encodeURIComponent(q)}&page=${page}`,
  descriptionPath: () => "",
  extractItems: (data) => {
    if (Array.isArray(data)) return data;
    for (const k of ["results", "data", "products", "items", "hits", "edges"]) {
      if (data?.[k] && Array.isArray(data[k])) return data[k];
    }
    // StadiumGoods may wrap in edges->node
    if (data?.edges) return data.edges.map((e: any) => e.node || e);
    return [];
  },
  normalize: (item) => {
    const node = item.node || item;
    const sku = extractSku(node) || node.handle;
    if (!sku) return null;
    return {
      sku: sku.trim(),
      name: node.title || node.name || null,
      brand: node.vendor || node.brand || null,
      colorway: node.color || node.colorway || null,
      releaseDate: null,
      msrp: node.price ? parseFloat(String(node.price).replace(/[^0-9.]/g, "")) || null : null,
      description: node.description || node.body_html || null,
      imageUrl: findImage(node),
    };
  },
  normalizeDetail: () => null,
};

// ─── FlightClub ──────────────────────────────────────────────────

const flightClub: SourceDef = {
  id: "flightclub",
  name: "FlightClub",
  hasSearch: true,
  hasDescription: true,
  searchPath: (q) => `/fightclubonly?query=${encodeURIComponent(q)}`,
  descriptionPath: (sku) => `/fightclub-description?sku=${encodeURIComponent(sku.replace(/[\s-]/g, "").toLowerCase())}`,
  extractItems: (data) => {
    if (Array.isArray(data)) return data;
    for (const k of ["results", "data", "products", "items", "hits"]) {
      if (data?.[k] && Array.isArray(data[k])) return data[k];
    }
    return [];
  },
  normalize: (item) => {
    const sku = extractSku(item);
    if (!sku) return null;
    return {
      sku: sku.trim(),
      name: item.name || item.title || item.shoeName || null,
      brand: item.brand || null,
      colorway: item.color || item.colorway || null,
      releaseDate: item.releaseDate || item.release_date || null,
      msrp: item.retailPrice || item.retail_price || item.msrp || null,
      description: item.description || null,
      imageUrl: findImage(item),
    };
  },
  normalizeDetail: (data) => {
    const item = data?.data || data;
    if (!item) return null;
    return {
      description: item.description || item.story || null,
      imageUrl: findImage(item),
      colorway: item.color || item.colorway || null,
      msrp: item.retailPrice || item.retail_price || null,
      releaseDate: item.releaseDate || item.release_date || null,
    };
  },
};

// ─── GOAT ────────────────────────────────────────────────────────

const goat: SourceDef = {
  id: "goat",
  name: "GOAT",
  hasSearch: true,
  hasDescription: true,
  searchPath: (q) => `/goat-search?query=${encodeURIComponent(q)}`,
  descriptionPath: (sku) => `/goat-description?sku=${encodeURIComponent(sku)}`,
  extractItems: (data) => {
    if (Array.isArray(data)) return data;
    for (const k of ["results", "data", "hits", "products", "items"]) {
      if (data?.[k] && Array.isArray(data[k])) return data[k];
    }
    return [];
  },
  normalize: (item) => {
    const sku = item.sku || item.slug || extractSku(item);
    if (!sku) return null;
    return {
      sku: typeof sku === "string" ? sku.trim() : String(sku),
      name: item.name || item.title || item.extended_name || null,
      brand: item.brand_name || item.brand || null,
      colorway: item.color || item.colorway || null,
      releaseDate: item.release_date || null,
      msrp: item.retail_price_cents ? item.retail_price_cents / 100 : item.retail_price || null,
      description: item.story_html || item.story || item.description || null,
      imageUrl: findImage(item),
    };
  },
  normalizeDetail: (data) => {
    const item = data?.data || data;
    if (!item) return null;
    return {
      description: item.story_html || item.story || item.description || null,
      imageUrl: findImage(item),
      colorway: item.color || item.colorway || null,
      msrp: item.retail_price_cents ? item.retail_price_cents / 100 : item.retail_price || null,
      releaseDate: item.release_date || null,
    };
  },
};

// ─── KicksCrew ───────────────────────────────────────────────────

const kicksCrew: SourceDef = {
  id: "kickscrew",
  name: "KicksCrew",
  hasSearch: true,
  hasDescription: true,
  searchPath: (q) => `/kc-search?query=${encodeURIComponent(q)}`,
  descriptionPath: (sku) => `/kc-description?spu=${encodeURIComponent(sku)}`,
  extractItems: (data) => {
    if (Array.isArray(data)) return data;
    for (const k of ["results", "data", "products", "items", "hits"]) {
      if (data?.[k] && Array.isArray(data[k])) return data[k];
    }
    return [];
  },
  normalize: (item) => {
    const sku = item.spu || item.sku || extractSku(item);
    if (!sku) return null;
    return {
      sku: typeof sku === "string" ? sku.trim() : String(sku),
      name: item.title || item.name || null,
      brand: item.brand || item.brand_name || null,
      colorway: item.color || item.colorway || null,
      releaseDate: item.release_date || null,
      msrp: item.retail_price || item.price || null,
      description: item.description || null,
      imageUrl: findImage(item),
    };
  },
  normalizeDetail: (data) => {
    const item = data?.data || data;
    if (!item) return null;
    return {
      description: item.description || null,
      imageUrl: findImage(item),
      colorway: item.color || item.colorway || null,
      msrp: item.retail_price || item.price || null,
      releaseDate: item.release_date || null,
    };
  },
};

const ALL_SOURCES: SourceDef[] = [stadiumGoods, flightClub, goat, kicksCrew];
const sourceMap = new Map(ALL_SOURCES.map((s) => [s.id, s]));

// ─── Throttled fetch ─────────────────────────────────────────────

let lastReqTime = 0;
async function throttledFetch(url: string, headers: Record<string, string>, retries = 3): Promise<any> {
  const gap = 400;
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
    throw new Error(`API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  throw new Error("Max retries exceeded");
}

// ─── Main handler ────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Admin auth
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Auth required" }, 401);
  const anonSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await anonSb.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);
  const { data: adm } = await sb.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!adm) return json({ error: "Admin only" }, 403);

  const rapidKey = Deno.env.get("RAPIDAPI_KEY");
  if (!rapidKey) return json({ ok: false, error: "RAPIDAPI_KEY não configurada." }, 400);
  const apiHeaders = { "X-RapidAPI-Key": rapidKey, "X-RapidAPI-Host": API_HOST };

  let body: any = {};
  try { body = await req.json(); } catch {}
  const mode = body.mode || "sources_list";

  // ─── List available sources ──────────────────────────────────
  if (mode === "sources_list") {
    return json({
      ok: true,
      sources: ALL_SOURCES.map((s) => ({
        id: s.id, name: s.name, hasSearch: s.hasSearch, hasDescription: s.hasDescription,
      })),
    });
  }

  // ─── Test a source ───────────────────────────────────────────
  if (mode === "test") {
    const sourceId = body.source as string;
    const src = sourceMap.get(sourceId);
    if (!src) return json({ ok: false, error: `Source inválida: ${sourceId}. Use: ${ALL_SOURCES.map(s => s.id).join(", ")}` }, 400);

    try {
      const url = `${API_BASE}${src.searchPath("Jordan 1", 1)}`;
      const data = await throttledFetch(url, apiHeaders);
      const items = src.extractItems(data);
      const normalized = items.slice(0, 3).map(src.normalize).filter(Boolean);
      return json({ ok: true, source: src.name, raw_count: items.length, normalized_sample: normalized, raw_sample: items[0] || null });
    } catch (e: any) {
      return json({ ok: false, source: src.name, error: e.message });
    }
  }

  // ─── Search & import new SKUs from a source ──────────────────
  if (mode === "search") {
    const sourceId = body.source as string;
    const src = sourceMap.get(sourceId);
    if (!src || !src.hasSearch) return json({ ok: false, error: `Source inválida ou sem busca: ${sourceId}` }, 400);

    const query = body.query as string;
    const page = body.page ?? 1;
    const batchLimit = body.limit ?? 30;
    if (!query) return json({ ok: false, error: "query obrigatória" }, 400);

    // Load DB references
    const { data: brands } = await sb.from("brands").select("*");
    const { data: silhouettes } = await sb.from("silhouettes").select("*");
    const { data: taxonomy } = await sb.from("silhouette_taxonomy").select("*").order("priority");
    const brandMap = new Map((brands || []).map((b: any) => [b.name.toLowerCase(), b.id]));
    const silMap = new Map((silhouettes || []).map((s: any) => [`${s.brand_id}|${s.name}`, s.id]));

    function matchBrandId(name: string | null): string | null {
      if (!name) return null;
      return brandMap.get(name.toLowerCase()) || null;
    }

    function matchSilhouette(brandId: string, productName: string): string | null {
      const lower = (productName || "").toLowerCase();
      const rows = (taxonomy || []).filter((t: any) => {
        const bid = brandMap.get(t.brand_name?.toLowerCase());
        return bid === brandId;
      });
      for (const t of rows) {
        for (const kw of t.match_keywords || []) {
          if (lower.includes(kw.toLowerCase())) return silMap.get(`${brandId}|${t.silhouette_name}`) || null;
        }
      }
      return null;
    }

    const stats = { fetched: 0, inserted: 0, skipped_existing: 0, skipped_no_sku: 0, errors: 0 };

    try {
      const url = `${API_BASE}${src.searchPath(query, page)}`;
      const data = await throttledFetch(url, apiHeaders);
      const items = src.extractItems(data);
      stats.fetched = items.length;

      const toProcess = items.slice(0, batchLimit);

      for (const raw of toProcess) {
        const norm = src.normalize(raw);
        if (!norm || !norm.sku) { stats.skipped_no_sku++; continue; }

        // Check if exists
        const { data: existing } = await sb.from("sneaker_models").select("id").eq("sku", norm.sku).maybeSingle();
        if (existing) { stats.skipped_existing++; continue; }

        const brandId = matchBrandId(norm.brand);
        if (!brandId) { stats.skipped_no_sku++; continue; } // brand not in our DB

        const silhouetteId = matchSilhouette(brandId, norm.name || "");

        const parsedDate = norm.releaseDate ? (() => {
          try { const d = new Date(norm.releaseDate!); return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]; } catch { return null; }
        })() : null;

        const { data: ins, error: insErr } = await sb.from("sneaker_models").insert({
          brand_id: brandId,
          silhouette_id: silhouetteId,
          sku: norm.sku,
          colorway: norm.colorway,
          release_date: parsedDate,
          msrp: norm.msrp,
          model_name_en: norm.name,
          description_en: norm.description,
          placeholder_image_url: PLACEHOLDER,
          image_status: norm.imageUrl ? "external" : "placeholder",
          needs_official_image: true,
          source_primary: src.id,
          translation_status: "pending",
        }).select("id").single();

        if (insErr) {
          if (insErr.code === "23505") { stats.skipped_existing++; continue; }
          console.error(`Insert error [${src.id}]:`, insErr);
          stats.errors++;
          continue;
        }

        // Add image
        if (ins) {
          const imgUrl = norm.imageUrl || PLACEHOLDER;
          await sb.from("sneaker_images").upsert(
            { sneaker_id: ins.id, image_url: imgUrl, source: src.id, is_primary: true },
            { onConflict: "sneaker_id,source,image_url" }
          );
        }

        stats.inserted++;
      }

      return json({ ok: true, source: src.name, query, page, ...stats });
    } catch (e: any) {
      console.error(`Search error [${src.id}]:`, e);
      return json({ ok: false, source: src.name, error: e.message }, 500);
    }
  }

  // ─── Enrich existing SKUs from description endpoints ─────────
  if (mode === "enrich") {
    const sourceId = body.source as string;
    const src = sourceMap.get(sourceId);
    if (!src || !src.hasDescription) return json({ ok: false, error: `Source inválida ou sem endpoint de descrição: ${sourceId}` }, 400);

    const batchLimit = body.limit ?? 20;

    // Find models that could benefit from enrichment (missing description or image)
    const { data: candidates } = await sb
      .from("sneaker_models")
      .select("id, sku, model_name_en, description_en, image_status")
      .or("description_en.is.null,image_status.eq.placeholder")
      .limit(batchLimit);

    if (!candidates || candidates.length === 0) return json({ ok: true, enriched: 0, message: "Nenhum modelo para enriquecer." });

    const stats = { processed: 0, enriched: 0, no_data: 0, errors: 0 };

    for (const model of candidates) {
      stats.processed++;
      try {
        const url = `${API_BASE}${src.descriptionPath(model.sku)}`;
        const data = await throttledFetch(url, apiHeaders);
        const detail = src.normalizeDetail(data);

        if (!detail) { stats.no_data++; continue; }

        const updates: any = {};
        if (!model.description_en && detail.description) updates.description_en = detail.description;
        if (detail.colorway && !updates.colorway) updates.colorway = detail.colorway;
        if (detail.msrp) updates.msrp = detail.msrp;
        if (detail.releaseDate) {
          try {
            const d = new Date(detail.releaseDate);
            if (!isNaN(d.getTime())) updates.release_date = d.toISOString().split("T")[0];
          } catch {}
        }

        let imageUpdated = false;
        if (model.image_status === "placeholder" && detail.imageUrl) {
          updates.image_status = "external";
          // Update primary image
          await sb.from("sneaker_images").update({ is_primary: false }).eq("sneaker_id", model.id);
          await sb.from("sneaker_images").upsert(
            { sneaker_id: model.id, image_url: detail.imageUrl, source: src.id, is_primary: true },
            { onConflict: "sneaker_id,source,image_url" }
          );
          imageUpdated = true;
        }

        if (Object.keys(updates).length) {
          // Mark for re-translation if description was added
          if (updates.description_en) updates.translation_status = "pending";
          await sb.from("sneaker_models").update(updates).eq("id", model.id);
        }

        if (Object.keys(updates).length || imageUpdated) {
          stats.enriched++;
        } else {
          stats.no_data++;
        }
      } catch (e: any) {
        console.error(`Enrich error [${src.id}] SKU ${model.sku}:`, e.message);
        stats.errors++;
      }
    }

    return json({ ok: true, source: src.name, ...stats });
  }

  return json({ ok: false, error: "mode inválido. Use: sources_list, test, search, enrich" }, 400);
});
