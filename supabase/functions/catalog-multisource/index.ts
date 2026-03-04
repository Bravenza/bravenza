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
  extractItems: (data: any) => any[];
  normalize: (item: any) => NormalizedItem | null;
  normalizeDetail: (data: any) => Partial<NormalizedItem> | null;
  hasSearch: boolean;
  hasDescription: boolean;
  /** Extra discovery endpoints beyond basic search */
  extraEndpoints?: ExtraEndpoint[];
}

interface ExtraEndpoint {
  id: string;
  label: string;
  /** Build the URL path (param is optional context like a brand name or product ID) */
  buildPath: (param?: string) => string;
  /** Extract array of items from response */
  extractItems: (data: any) => any[];
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
  if (!raw) return null;
  // Accept both string and numeric IDs
  return String(raw).trim();
}

// ─── StadiumGoods ────────────────────────────────────────────────

const genericExtract = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  for (const k of ["results", "data", "products", "items", "hits", "edges"]) {
    if (data?.[k] && Array.isArray(data[k])) return data[k];
  }
  return [];
};

const stadiumGoods: SourceDef = {
  id: "stadiumgoods",
  name: "StadiumGoods",
  hasSearch: true,
  hasDescription: false,
  searchPath: (q, page) => `/sg/search?query=${encodeURIComponent(q)}&page=${page}`,
  descriptionPath: () => "",
  extractItems: (data) => {
    const arr = genericExtract(data);
    if (arr.length) return arr;
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
  extraEndpoints: [
    {
      id: "sg_collections",
      label: "Listar Coleções",
      buildPath: (page) => `/sg/collections?page=${page || "1"}`,
      extractItems: genericExtract,
    },
    {
      id: "sg_collection_products",
      label: "Produtos de uma Coleção",
      buildPath: (handle) => `/sg/collections/product?collectionsHandle=${encodeURIComponent(handle || "yeezy-380")}&page=1`,
      extractItems: genericExtract,
    },
    {
      id: "sg_similar",
      label: "Produtos Similares",
      buildPath: (productId) => `/sg/similar?productId=${encodeURIComponent(productId || "")}&limit=10`,
      extractItems: genericExtract,
    },
  ],
};

// ─── FlightClub ──────────────────────────────────────────────────

const flightClub: SourceDef = {
  id: "flightclub",
  name: "FlightClub",
  hasSearch: true,
  hasDescription: true,
  searchPath: (q) => `/fightclubonly?query=${encodeURIComponent(q)}&hitsPerPage=20`,
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
  extraEndpoints: [
    {
      id: "fc_brands",
      label: "Buscar por marca",
      buildPath: (brand) => `/fightclub-brand?brand=${encodeURIComponent(brand || "adidas")}`,
      extractItems: genericExtract,
    },
    {
      id: "fc_releases",
      label: "Novos lançamentos",
      buildPath: () => `/fightclub-releases?hitsPerPage=20`,
      extractItems: genericExtract,
    },
    {
      id: "fc_recommendation",
      label: "Recomendações (por ID)",
      buildPath: (id) => `/fightclub-recommendation?id=${encodeURIComponent(id || "")}`,
      extractItems: genericExtract,
    },
  ],
};

// ─── GOAT ────────────────────────────────────────────────────────

const goat: SourceDef = {
  id: "goat",
  name: "GOAT",
  hasSearch: true,
  hasDescription: true,
  searchPath: (q) => `/goat-search?query=${encodeURIComponent(q)}&hitsPerPage=20`,
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
  extraEndpoints: [
    {
      id: "goat_recommended",
      label: "Produtos similares (por ID)",
      buildPath: (productId) => `/goat/recommended?productId=${encodeURIComponent(productId || "")}&limit=8`,
      extractItems: genericExtract,
    },
  ],
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

// ─── StockX ──────────────────────────────────────────────────────

const stockX: SourceDef = {
  id: "stockx",
  name: "StockX",
  hasSearch: true,
  hasDescription: true,
  searchPath: (q, page) => `/getproducts?keywords=${encodeURIComponent(q)}&limit=40&page=${page}`,
  descriptionPath: (urlKey) => `/stockx-description?urlKey=${encodeURIComponent(urlKey)}`,
  extractItems: (data) => {
    if (Array.isArray(data)) return data;
    for (const k of ["results", "data", "sneakers", "items", "products", "hits"]) {
      if (data?.[k] && Array.isArray(data[k])) return data[k];
    }
    return [];
  },
  normalize: (item) => {
    const sku = item.styleID || item.styleId || item.style_id || item.sku || item.id || item._id;
    if (!sku) return null;
    return {
      sku: String(sku).trim(),
      name: item.shoeName || item.title || item.name || item.model || null,
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
      msrp: item.retailPrice || item.retail_price || item.msrp || null,
      releaseDate: item.releaseDate || item.release_date || null,
    };
  },
  extraEndpoints: [
    {
      id: "stockx_popular",
      label: "Mais populares",
      buildPath: (limit) => `/mostpopular?limit=${limit || "20"}`,
      extractItems: genericExtract,
    },
    {
      id: "stockx_sneakers_search",
      label: "Busca dedicada StockX Sneakers",
      buildPath: (q) => {
        // Support "query|page" format for pagination
        const parts = (q || "Jordan").split("|");
        const keywords = parts[0] || "Jordan";
        const page = parseInt(parts[1] || "1") || 1;
        return `/getproducts?keywords=${encodeURIComponent(keywords)}&limit=40&page=${page}`;
      },
      extractItems: genericExtract,
    },
    {
      id: "stockx_related",
      label: "Produtos relacionados (por urlKey)",
      buildPath: (urlKey) => `/stockx-related?urlKey=${encodeURIComponent(urlKey || "air-jordan-1-high-zoom-air-cmft-2-honeydew")}`,
      extractItems: genericExtract,
    },
    {
      id: "stockx_prices",
      label: "Preços por styleId",
      buildPath: (styleId) => `/productprice?styleId=${encodeURIComponent(styleId || "")}`,
      extractItems: (data) => data ? [data] : [],
    },
  ],
};

const ALL_SOURCES: SourceDef[] = [stockX, stadiumGoods, flightClub, goat, kicksCrew];
const sourceMap = new Map(ALL_SOURCES.map((s) => [s.id, s]));

// ─── Throttled fetch ─────────────────────────────────────────────

// ─── Exchange rate cache ─────────────────────────────────────────
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
  } catch (e) {
    console.error("Exchange rate fetch failed, using fallback:", e);
  }
  return cachedRate?.rate || FALLBACK_RATE;
}

function convertMsrp(msrpUsd: number | null, rate: number): number | null {
  if (!msrpUsd || msrpUsd <= 0) return null;
  return Math.ceil(msrpUsd * rate * 100) / 100; // round up to nearest cent
}

let lastReqTime = 0;
async function throttledFetch(url: string, headers: Record<string, string>, retries = 3): Promise<any> {
  const gap = 400;
  const now = Date.now();
  const wait = gap - (now - lastReqTime);
  if (wait > 0) await sleep(wait);
  lastReqTime = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers });

    // Check Content-Type before parsing — HTML responses indicate endpoint issues
    const contentType = res.headers.get("content-type") || "";

    if (res.ok) {
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        // Some APIs return JSON without proper content-type
        try { return JSON.parse(text); } catch {
          throw new Error(`API retornou ${contentType} ao invés de JSON. Resposta: ${text.substring(0, 200)}`);
        }
      }
      return res.json();
    }

    if (res.status === 429) {
      await sleep(Math.pow(2, attempt + 1) * 1000);
      continue;
    }
    if (res.status >= 500 && attempt < retries - 1) {
      await sleep(1000 * (attempt + 1));
      continue;
    }

    // Get error body
    const errorBody = await res.text().catch(() => "");

    // If HTML response, provide a clearer error
    if (errorBody.includes("<!DOCTYPE") || errorBody.includes("<html")) {
      const match = errorBody.match(/<pre>(.*?)<\/pre>/);
      const detail = match ? match[1] : `HTTP ${res.status}`;
      throw new Error(`Endpoint indisponível (${detail}). Verifique se seu plano RapidAPI inclui este endpoint.`);
    }

    throw new Error(`API ${res.status}: ${errorBody.substring(0, 300)}`);
  }
  throw new Error("Max retries exceeded");
}

// ─── Diagnostic fetch (non-throwing) ─────────────────────────────
async function diagnosticFetch(url: string, headers: Record<string, string>): Promise<{ ok: boolean; status: number; contentType: string; preview: string }> {
  try {
    const res = await fetch(url, { headers });
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    return { ok: res.ok, status: res.status, contentType, preview: text.substring(0, 300) };
  } catch (e: any) {
    return { ok: false, status: 0, contentType: "", preview: e.message };
  }
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
        extraEndpoints: (s.extraEndpoints || []).map((e) => ({ id: e.id, label: e.label })),
      })),
    });
  }

  // ─── Test a source ───────────────────────────────────────────
  if (mode === "test") {
    const sourceId = body.source as string;
    const src = sourceMap.get(sourceId);
    if (!src) return json({ ok: false, error: `Source inválida: ${sourceId}. Use: ${ALL_SOURCES.map(s => s.id).join(", ")}` }, 400);

    const url = `${API_BASE}${src.searchPath("Jordan 1", 1)}`;

    // First do a diagnostic fetch to detect issues before processing
    const diag = await diagnosticFetch(url, apiHeaders);
    if (!diag.ok) {
      return json({
        ok: false,
        source: src.name,
        endpoint: url.replace(rapidKey!, "***"),
        status: diag.status,
        content_type: diag.contentType,
        error: diag.status === 404
          ? `Endpoint não encontrado (404). Seu plano RapidAPI pode não incluir ${src.name}. Verifique em rapidapi.com.`
          : diag.status === 403
          ? `Acesso negado (403). Seu plano RapidAPI pode não incluir ${src.name}.`
          : `Erro ${diag.status}: ${diag.preview.substring(0, 200)}`,
      });
    }

    try {
      // Parse the diagnostic result as JSON
      let data: any;
      try { data = JSON.parse(diag.preview.length > 300 ? (await (await fetch(url, { headers: apiHeaders })).text()) : diag.preview); }
      catch { data = await throttledFetch(url, apiHeaders); }
      
      const items = src.extractItems(data);
      const normalized = items.slice(0, 3).map(src.normalize).filter(Boolean);
      return json({ ok: true, source: src.name, raw_count: items.length, normalized_sample: normalized, raw_sample: items[0] || null });
    } catch (e: any) {
      return json({ ok: false, source: src.name, error: e.message });
    }
  }

  // ─── Test all sources at once ──────────────────────────────────
  if (mode === "test_all") {
    const results: any[] = [];
    for (const src of ALL_SOURCES) {
      const url = `${API_BASE}${src.searchPath("Jordan 1", 1)}`;
      const diag = await diagnosticFetch(url, apiHeaders);
      results.push({
        source: src.id,
        name: src.name,
        ok: diag.ok,
        status: diag.status,
        content_type: diag.contentType,
        is_json: diag.contentType.includes("application/json"),
        error: !diag.ok
          ? diag.status === 404 ? "Endpoint não encontrado — plano pode não incluir"
          : diag.status === 403 ? "Acesso negado — plano pode não incluir"
          : `HTTP ${diag.status}`
          : null,
      });
      await sleep(300); // Respect rate limits
    }
    return json({ ok: true, results });
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

    // Load DB references + exchange rate
    const [{ data: brands }, { data: silhouettes }, { data: taxonomy }, exchangeRate] = await Promise.all([
      sb.from("brands").select("*"),
      sb.from("silhouettes").select("*"),
      sb.from("silhouette_taxonomy").select("*").order("priority"),
      getUsdToBrl(),
    ]);
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
          msrp_usd: norm.msrp,
          msrp: convertMsrp(norm.msrp, exchangeRate),
          msrp_exchange_rate: norm.msrp ? exchangeRate : null,
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
        if (detail.msrp) {
          const rate = await getUsdToBrl();
          updates.msrp_usd = detail.msrp;
          updates.msrp = convertMsrp(detail.msrp, rate);
          updates.msrp_exchange_rate = rate;
        }
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

  // ─── Discover: call extra endpoints for import ───────────────
  if (mode === "discover") {
    const sourceId = body.source as string;
    const src = sourceMap.get(sourceId);
    if (!src) return json({ ok: false, error: `Source inválida: ${sourceId}` }, 400);

    const endpointId = body.endpoint as string;
    const param = body.param as string | undefined;
    const batchLimit = body.limit ?? 30;

    const ep = (src.extraEndpoints || []).find((e) => e.id === endpointId);
    if (!ep) {
      const available = (src.extraEndpoints || []).map((e) => e.id).join(", ");
      return json({ ok: false, error: `Endpoint "${endpointId}" não encontrado para ${src.name}. Disponíveis: ${available || "nenhum"}` }, 400);
    }

    // Load DB references + exchange rate
    const [{ data: brands }, { data: silhouettes }, { data: taxonomy }, exchangeRate] = await Promise.all([
      sb.from("brands").select("*"),
      sb.from("silhouettes").select("*"),
      sb.from("silhouette_taxonomy").select("*").order("priority"),
      getUsdToBrl(),
    ]);
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

    const stats = { fetched: 0, inserted: 0, skipped_existing: 0, skipped_no_sku: 0, skipped_no_brand: 0, errors: 0 };

    try {
      const url = `${API_BASE}${ep.buildPath(param)}`;
      const data = await throttledFetch(url, apiHeaders);
      const items = ep.extractItems(data);
      stats.fetched = items.length;

      // If this is a non-product endpoint (like listing collections), return raw data
      if (endpointId === "sg_collections" || endpointId === "fc_brands") {
        return json({ ok: true, source: src.name, endpoint: ep.label, raw_count: items.length, data: items.slice(0, 50) });
      }

      // For product-like endpoints, normalize and import
      const toProcess = items.slice(0, batchLimit);
      for (const raw of toProcess) {
        const norm = src.normalize(raw);
        if (!norm || !norm.sku) { stats.skipped_no_sku++; continue; }

        const { data: existing } = await sb.from("sneaker_models").select("id").eq("sku", norm.sku).maybeSingle();
        if (existing) { stats.skipped_existing++; continue; }

        let brandId = matchBrandId(norm.brand);
        if (!brandId && norm.brand) {
          // Auto-create brand if it doesn't exist
          const slug = norm.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const { data: newBrand } = await sb.from("brands").insert({ name: norm.brand, slug }).select("id").single();
          if (newBrand) {
            brandId = newBrand.id;
            brandMap.set(norm.brand.toLowerCase(), brandId);
          }
        }
        if (!brandId) { stats.skipped_no_brand++; continue; }

        const silhouetteId = matchSilhouette(brandId, norm.name || "");
        const parsedDate = norm.releaseDate ? (() => {
          try { const d = new Date(norm.releaseDate!); return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]; } catch { return null; }
        })() : null;

        const { data: ins, error: insErr } = await sb.from("sneaker_models").insert({
          brand_id: brandId, silhouette_id: silhouetteId, sku: norm.sku,
          colorway: norm.colorway, release_date: parsedDate,
          msrp_usd: norm.msrp, msrp: convertMsrp(norm.msrp, exchangeRate),
          msrp_exchange_rate: norm.msrp ? exchangeRate : null,
          model_name_en: norm.name, description_en: norm.description,
          placeholder_image_url: PLACEHOLDER, image_status: norm.imageUrl ? "external" : "placeholder",
          needs_official_image: true, source_primary: src.id, translation_status: "pending",
        }).select("id").single();

        if (insErr) {
          if (insErr.code === "23505") { stats.skipped_existing++; continue; }
          stats.errors++; continue;
        }

        if (ins) {
          const imgUrl = norm.imageUrl || PLACEHOLDER;
          await sb.from("sneaker_images").upsert(
            { sneaker_id: ins.id, image_url: imgUrl, source: src.id, is_primary: true },
            { onConflict: "sneaker_id,source,image_url" }
          );
        }
        stats.inserted++;
      }

      return json({ ok: true, source: src.name, endpoint: ep.label, ...stats });
    } catch (e: any) {
      console.error(`Discover error [${src.id}] ${ep.id}:`, e.message);
      return json({ ok: false, source: src.name, endpoint: ep.label, error: e.message, hint: "Este endpoint pode estar indisponível na API. Tente outro endpoint ou source." });
    }
  }

  return json({ ok: false, error: "mode inválido. Use: sources_list, test, search, enrich, discover" }, 400);
});
