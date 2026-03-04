import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configurações ─────────────────────────────────────────────────────────────
const CATALOKO_API   = "https://service.cataloko.com/api/search/v4";
const CATALOKO_TOKEN = "ef8bbe71c05448a48c8f6f7923a1e7a5";
const DROPER_BASE    = "https://droper.app";
const STORAGE_BUCKET = "product-images";
const PAGE_SIZE      = 60;
const MAX_PAGES      = 5;
const CONCURRENCY    = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface DropItem { id: number; url: string; }

interface DroperProduct {
  sku: string;
  titulo: string;
  descricao: string;
  nomeMarca: string;
  urlMarca: string;
  nomeModelo: string;
  urlModelo: string;
  cor: string;
  dataLancamento: string | null;
  retail: number | null;
  images: string[];
  droperUrl: string;
}

interface SyncResult {
  success: number;
  failed: number;
  notFound: number;
  errors: string[];
  details: { sku: string; images: number }[];
}

// ─── Cache de brands e silhouettes (evita lookups repetidos) ───────────────────
const brandCache: Record<string, string>     = {}; // name → uuid
const silhouetteCache: Record<string, string> = {}; // "brand_id:name" → uuid

// ─── Helpers ───────────────────────────────────────────────────────────────────
function toSlug(text: string): string {
  return text.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── 1. Busca drops via API da droper ──────────────────────────────────────────
async function fetchDropsPage(page: number): Promise<{ drops: DropItem[]; temMais: boolean }> {
  const body = {
    tipoProduto: 1, amount: PAGE_SIZE, amountDrops: PAGE_SIZE,
    page: 0, pageDrops: page, precoMinimo: 10,
    marcas: [], tamanhos: [], cores: [],
    marca: null, termo: null, condicao: null, ordenacao: null,
    segmento: null, tag: null, apenasIntant: null,
    mostrarEncomendas: false, precoMaximo: null,
  };
  const res = await fetch(CATALOKO_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Authorization": CATALOKO_TOKEN,
      "Origin": "https://droper.app",
      "Referer": "https://droper.app/",
      "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API erro ${res.status}`);
  const json = await res.json();
  const drops: DropItem[] = (json.drops ?? [])
    .map((d: Record<string, unknown>) => ({ id: d.id, url: d.url as string }))
    .filter((d: DropItem) => d.url);
  return { drops, temMais: json.temMaisDrops === true };
}

// ─── 2. Scraping da página do produto (extrai CkPreloadModel) ──────────────────
function extractPreloadModel(html: string): DroperProduct | null {
  try {
    const match = html.match(/window\.CkPreloadModel\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!match) return null;
    const json = JSON.parse(match[1]);
    const drop = json?.model?.drop;
    if (!drop) return null;

    const sku          = drop.sku?.trim();
    const images: string[] = drop.colecaoImagens ?? [];
    if (!sku || images.length === 0) return null;

    // Extrai nome do modelo a partir de urlModelo ("marca/nike/modelo/air max 95" → "Air Max 95")
    const urlModeloRaw: string = drop.urlModelo ?? "";
    const modeloParts  = urlModeloRaw.split("/modelo/");
    const nomeModelo   = modeloParts[1]
      ? modeloParts[1].split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : drop.nomeModelo ?? "";

    return {
      sku,
      titulo:        drop.titulo?.trim() ?? "",
      descricao:     drop.descricao?.trim() ?? "",
      nomeMarca:     drop.nomeMarca?.trim() ?? "",
      urlMarca:      drop.urlMarca?.trim() ?? "",
      nomeModelo,
      urlModelo:     drop.urlModelo2 ?? toSlug(nomeModelo),
      cor:           drop.cores?.[0]?.nome ?? "",
      dataLancamento: drop.dataLancamento ?? null,
      retail:        drop.retail ?? null,
      images,
      droperUrl:     `${DROPER_BASE}${drop.url}`,
    };
  } catch { return null; }
}

async function scrapeProduct(dropUrl: string): Promise<DroperProduct | null> {
  try {
    const res = await fetch(`${DROPER_BASE}${dropUrl}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
    });
    if (!res.ok) return null;
    return extractPreloadModel(await res.text());
  } catch { return null; }
}

// ─── 3. Lookup ou criação de brand ─────────────────────────────────────────────
async function getOrCreateBrand(
  supabase: ReturnType<typeof createClient>,
  name: string
): Promise<string | null> {
  if (brandCache[name]) return brandCache[name];

  // Busca case-insensitive para evitar duplicatas (Nike vs nike vs NIKE)
  const { data: existing } = await supabase
    .from("brands").select("id").ilike("name", name).maybeSingle();

  if (existing?.id) {
    brandCache[name] = existing.id;
    return existing.id;
  }

  // Upsert para evitar conflito se já existir com mesmo slug
  const { data: upserted, error } = await supabase
    .from("brands")
    .upsert({ name, slug: toSlug(name) }, { onConflict: "slug" })
    .select("id").single();

  if (error || !upserted) {
    // Última tentativa: busca pelo slug
    const { data: bySlug } = await supabase
      .from("brands").select("id").eq("slug", toSlug(name)).maybeSingle();
    if (bySlug?.id) {
      brandCache[name] = bySlug.id;
      return bySlug.id;
    }
    console.error(`[Brand] Erro ao criar "${name}":`, error);
    return null;
  }

  brandCache[name] = upserted.id;
  return upserted.id;
}

// ─── 4. Lookup ou criação de silhouette ────────────────────────────────────────
async function getOrCreateSilhouette(
  supabase: ReturnType<typeof createClient>,
  name: string,
  brandId: string
): Promise<string | null> {
  const cacheKey = `${brandId}:${name}`;
  if (silhouetteCache[cacheKey]) return silhouetteCache[cacheKey];

  const { data: existing } = await supabase
    .from("silhouettes").select("id")
    .eq("name", name).eq("brand_id", brandId).maybeSingle();

  if (existing?.id) {
    silhouetteCache[cacheKey] = existing.id;
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("silhouettes")
    .insert({ name, slug: toSlug(name), brand_id: brandId })
    .select("id").single();

  if (error || !created) {
    console.error(`[Silhouette] Erro ao criar "${name}":`, error);
    return null;
  }

  silhouetteCache[cacheKey] = created.id;
  return created.id;
}

// ─── 5. Upload de imagem para Supabase Storage ─────────────────────────────────
async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string, sku: string, index: number
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/webp";
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpg") ? "jpg" : "webp";
    const filePath = `products/${sku.toLowerCase()}/${index}.${ext}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET).upload(filePath, buffer, { contentType, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error(`[Upload] SKU ${sku} img ${index}:`, e);
    return null;
  }
}

// ─── 6. Upsert completo em sneaker_models ──────────────────────────────────────
async function upsertSneakerModel(
  supabase: ReturnType<typeof createClient>,
  product: DroperProduct,
  brandId: string,
  silhouetteId: string | null,
  imageUrls: string[]
): Promise<string | null> {
  const releaseDate = product.dataLancamento
    ? product.dataLancamento.split("T")[0]
    : null;

  const payload: Record<string, unknown> = {
    sku:                   product.sku,
    brand_id:              brandId,
    silhouette_id:         silhouetteId,
    model_name_pt:         product.titulo,
    model_name_en:         product.titulo, // droper só tem PT; usa o mesmo
    description_pt:        product.descricao,
    colorway:              product.cor,
    release_date:          releaseDate,
    msrp:                  product.retail,
    placeholder_image_url: imageUrls[0] ?? null,
    source_primary:        product.droperUrl,
    source_secondary:      imageUrls.slice(1),
    image_status:          "synced",
    needs_official_image:  false,
    translation_status:    "pending", // descrição em EN ainda não traduzida
  };

  const { data, error } = await supabase
    .from("sneaker_models")
    .upsert(payload, { onConflict: "sku" })
    .select("id").single();

  if (error) { console.error(`[Model] SKU ${product.sku}:`, error); return null; }
  return data?.id ?? null;
}

// ─── 7. Salva imagens em sneaker_images ────────────────────────────────────────
async function saveSneakerImages(
  supabase: ReturnType<typeof createClient>,
  sneakerId: string,
  imageUrls: string[]
): Promise<void> {
  // Remove imagens antigas do produto antes de inserir as novas
  await supabase.from("sneaker_images").delete().eq("sneaker_id", sneakerId);

  const rows = imageUrls.map((url, i) => ({
    sneaker_id:  sneakerId,
    image_url:   url,
    source:      "droper",
    is_primary:  i === 0,
  }));

  const { error } = await supabase.from("sneaker_images").insert(rows);
  if (error) console.error(`[Images] sneaker_id ${sneakerId}:`, error);
}

// ─── 8. Processa um produto completo ───────────────────────────────────────────
async function processProduct(
  supabase: ReturnType<typeof createClient>,
  drop: DropItem,
  result: SyncResult
): Promise<void> {
  const product = await scrapeProduct(drop.url);
  if (!product) {
    result.failed++;
    result.errors.push(`Falha ao extrair: ${DROPER_BASE}${drop.url}`);
    return;
  }

  console.log(`[Sync] ${product.sku} — ${product.titulo}`);

  // Resolve brand_id
  const brandId = await getOrCreateBrand(supabase, product.nomeMarca);
  if (!brandId) {
    result.failed++;
    result.errors.push(`Não foi possível resolver marca: ${product.nomeMarca} (SKU ${product.sku})`);
    return;
  }

  // Resolve silhouette_id (opcional — não bloqueia se falhar)
  const silhouetteId = product.nomeModelo
    ? await getOrCreateSilhouette(supabase, product.nomeModelo, brandId)
    : null;

  // Upload de todas as imagens em paralelo
  const uploadedUrls = (
    await Promise.all(product.images.map((img, i) => uploadImage(supabase, img, product.sku, i)))
  ).filter(Boolean) as string[];

  if (uploadedUrls.length === 0) {
    result.failed++;
    result.errors.push(`Upload falhou: SKU ${product.sku}`);
    return;
  }

  // Upsert em sneaker_models
  const sneakerId = await upsertSneakerModel(supabase, product, brandId, silhouetteId, uploadedUrls);
  if (!sneakerId) {
    result.failed++;
    result.errors.push(`Erro ao salvar modelo: SKU ${product.sku}`);
    return;
  }

  // Salva imagens em sneaker_images
  await saveSneakerImages(supabase, sneakerId, uploadedUrls);

  result.success++;
  result.details.push({ sku: product.sku, images: uploadedUrls.length });
}

// ─── Concorrência controlada ───────────────────────────────────────────────────
async function runConcurrent(
  supabase: ReturnType<typeof createClient>,
  drops: DropItem[],
  result: SyncResult
): Promise<void> {
  for (let i = 0; i < drops.length; i += CONCURRENCY) {
    const chunk = drops.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((drop) => processProduct(supabase, drop, result)));
    console.log(`[Progress] ${Math.min(i + CONCURRENCY, drops.length)}/${drops.length}`);
  }
}

// ─── Handler principal ─────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let startPage = 0;
    let maxPages  = MAX_PAGES;
    try {
      const body = await req.json();
      if (body?.page     !== undefined) startPage = parseInt(body.page);
      if (body?.maxPages !== undefined) maxPages  = parseInt(body.maxPages);
    } catch { /* usa defaults */ }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result: SyncResult = {
      success: 0, failed: 0, notFound: 0, errors: [], details: [],
    };

    let currentPage = startPage;
    let processed   = 0;

    while (processed < maxPages) {
      console.log(`[API] Página ${currentPage}...`);
      const { drops, temMais } = await fetchDropsPage(currentPage);
      if (drops.length === 0) break;

      await runConcurrent(supabase, drops, result);

      if (!temMais) break;
      currentPage++;
      processed++;
    }

    return new Response(
      JSON.stringify({
        message: `✅ ${result.success} sincronizados | ❌ ${result.failed} falhas`,
        pagesProcessed: processed,
        nextPage: currentPage,
        result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Edge Function] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
