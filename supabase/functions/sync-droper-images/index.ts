import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configurações ─────────────────────────────────────────────────────────────
const CATALOKO_API = "https://service.cataloko.com/api/search/v4";
const CATALOKO_TOKEN = "ef8bbe71c05448a48c8f6f7923a1e7a5";
const DROPER_BASE = "https://droper.app";
const STORAGE_BUCKET = "product-images";
const PAGE_SIZE = 60;
const MAX_PAGES = 5;
const CONCURRENCY = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface DropItem {
  id: number;
  url: string;
  linkfoto: string | null; // imagem do card na página de busca
}

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
  images: string[]; // colecaoImagens — até 6 fotos da página do produto
  cardImage: string | null; // linkfoto — imagem exibida no card da busca
  droperUrl: string;
}

interface SyncResult {
  success: number;
  failed: number;
  notFound: number;
  errors: string[];
  details: { sku: string; images: number }[];
}

// ─── Cache de brands e silhouettes ────────────────────────────────────────────
const brandCache: Record<string, string> = {};
const silhouetteCache: Record<string, string> = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── 1. Busca drops via API (captura linkfoto do card) ─────────────────────────
async function fetchDropsPage(
  page: number,
  marca: string | null = null,
): Promise<{ drops: DropItem[]; temMais: boolean }> {
  const body = {
    tipoProduto: 1,
    amount: PAGE_SIZE,
    amountDrops: PAGE_SIZE,
    page: 0,
    pageDrops: page,
    precoMinimo: 10,
    marcas: [],
    tamanhos: [],
    cores: [],
    marca: marca ?? null,
    termo: null,
    condicao: null,
    ordenacao: null,
    segmento: null,
    tag: null,
    apenasIntant: null,
    mostrarEncomendas: false,
    precoMaximo: null,
  };
  const res = await fetch(CATALOKO_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Authorization: CATALOKO_TOKEN,
      Origin: "https://droper.app",
      Referer: "https://droper.app/",
      "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`API erro ${res.status} p.${page}: ${errBody.slice(0, 300)}`);
  }
  const json = await res.json();

  const drops: DropItem[] = (json.drops ?? [])
    .map((d: Record<string, unknown>) => ({
      id: d.id,
      url: d.url as string,
      linkfoto: (d.linkfoto as string) ?? null, // imagem do card
    }))
    .filter((d: DropItem) => d.url);

  return { drops, temMais: json.temMaisDrops === true };
}

// ─── 2. Scraping da página do produto ─────────────────────────────────────────
function extractPreloadModel(html: string): Omit<DroperProduct, "cardImage" | "droperUrl"> | null {
  try {
    const match = html.match(/window\.CkPreloadModel\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!match) return null;
    const json = JSON.parse(match[1]);
    const drop = json?.model?.drop;
    if (!drop) return null;

    const sku = drop.sku?.trim();
    const images: string[] = drop.colecaoImagens ?? [];
    if (!sku || images.length === 0) return null;

    const urlModeloRaw: string = drop.urlModelo ?? "";
    const modeloParts = urlModeloRaw.split("/modelo/");
    const nomeModelo = modeloParts[1]
      ? modeloParts[1]
          .split(" ")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : (drop.nomeModelo ?? "");

    return {
      sku,
      titulo: drop.titulo?.trim() ?? "",
      descricao: drop.descricao?.trim() ?? "",
      nomeMarca: drop.nomeMarca?.trim() ?? "",
      urlMarca: drop.urlMarca?.trim() ?? "",
      nomeModelo,
      urlModelo: drop.urlModelo2 ?? toSlug(nomeModelo),
      cor: drop.cores?.[0]?.nome ?? "",
      dataLancamento: drop.dataLancamento ?? null,
      retail: drop.retail ?? null,
      images,
    };
  } catch {
    return null;
  }
}

async function scrapeProduct(drop: DropItem): Promise<DroperProduct | null> {
  try {
    const fullUrl = `${DROPER_BASE}${drop.url}`;
    const res = await fetch(fullUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
    });
    if (!res.ok) return null;
    const data = extractPreloadModel(await res.text());
    if (!data) return null;
    return {
      ...data,
      cardImage: drop.linkfoto, // imagem do card vinda da API de busca
      droperUrl: fullUrl,
    };
  } catch {
    return null;
  }
}

// ─── 3. Upload de imagem para Supabase Storage ─────────────────────────────────
async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  sku: string,
  index: number,
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
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error(`[Upload] SKU ${sku} img ${index}:`, e);
    return null;
  }
}

// ─── 4. Lookup ou criação de brand ────────────────────────────────────────────
async function getOrCreateBrand(supabase: ReturnType<typeof createClient>, name: string): Promise<string | null> {
  if (brandCache[name]) return brandCache[name];
  const { data: existing } = await supabase.from("brands").select("id").ilike("name", name).maybeSingle();
  if (existing?.id) {
    brandCache[name] = existing.id;
    return existing.id;
  }
  const { data: upserted, error } = await supabase
    .from("brands")
    .upsert({ name, slug: toSlug(name) }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error || !upserted) {
    const { data: bySlug } = await supabase.from("brands").select("id").eq("slug", toSlug(name)).maybeSingle();
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

// ─── 5. Lookup ou criação de silhouette ───────────────────────────────────────
async function getOrCreateSilhouette(
  supabase: ReturnType<typeof createClient>,
  name: string,
  brandId: string,
): Promise<string | null> {
  const cacheKey = `${brandId}:${name}`;
  if (silhouetteCache[cacheKey]) return silhouetteCache[cacheKey];
  const { data: existing } = await supabase
    .from("silhouettes")
    .select("id")
    .eq("name", name)
    .eq("brand_id", brandId)
    .maybeSingle();
  if (existing?.id) {
    silhouetteCache[cacheKey] = existing.id;
    return existing.id;
  }
  const { data: created, error } = await supabase
    .from("silhouettes")
    .insert({ name, slug: toSlug(name), brand_id: brandId })
    .select("id")
    .single();
  if (error || !created) {
    console.error(`[Silhouette] Erro ao criar "${name}":`, error);
    return null;
  }
  silhouetteCache[cacheKey] = created.id;
  return created.id;
}

// ─── 6. Upsert em sneaker_models ──────────────────────────────────────────────
async function upsertSneakerModel(
  supabase: ReturnType<typeof createClient>,
  product: DroperProduct,
  brandId: string,
  silhouetteId: string | null,
  imageUrls: string[], // URLs das imagens da página (já uploadadas no Storage)
): Promise<string | null> {
  const releaseDate = product.dataLancamento ? product.dataLancamento.split("T")[0] : null;

  const payload: Record<string, unknown> = {
    sku: product.sku,
    brand_id: brandId,
    silhouette_id: silhouetteId,
    model_name_pt: product.titulo || product.sku,
    model_name_en: product.titulo || product.sku,
    description_pt: product.descricao || "",
    description_en: "",
    colorway: product.cor || "",
    release_date: releaseDate,
    msrp: product.retail,
    placeholder_image_url: imageUrls[0] ?? "", // imagem principal da página
    source_primary: product.droperUrl,
    source_secondary: imageUrls.slice(1),
    image_status: "synced",
    needs_official_image: false,
    translation_status: "pending",
    translation_error: null,
  };

  const { data: updated, error: updateError } = await supabase
    .from("sneaker_models")
    .update(payload)
    .eq("sku", product.sku)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(`[Model UPDATE] SKU ${product.sku}:`, JSON.stringify(updateError));
    return null;
  }
  if (updated?.id) {
    console.log(`[Model] UPDATED ${product.sku}`);
    return updated.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("sneaker_models")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    console.error(`[Model INSERT] SKU ${product.sku}:`, JSON.stringify(insertError));
    return null;
  }
  console.log(`[Model] INSERTED ${product.sku}`);
  return inserted?.id ?? null;
}

// ─── 7. Salva imagens em sneaker_images ───────────────────────────────────────
async function saveSneakerImages(
  supabase: ReturnType<typeof createClient>,
  sneakerId: string,
  imageUrls: string[], // imagens da página do produto (uploadadas no Storage)
  cardImageUrl: string | null, // linkfoto original da droper (URL externa)
): Promise<void> {
  await supabase.from("sneaker_images").delete().eq("sneaker_id", sneakerId);

  const rows = imageUrls.map((url, i) => ({
    sneaker_id: sneakerId,
    image_url: url,
    source: "droper",
    is_primary: i === 0,
  }));

  // Adiciona a imagem do card como entrada extra se for diferente das demais
  if (cardImageUrl && !imageUrls.includes(cardImageUrl)) {
    rows.push({
      sneaker_id: sneakerId,
      image_url: cardImageUrl,
      source: "droper_card", // identifica como imagem de card
      is_primary: false,
    });
  }

  const { error } = await supabase.from("sneaker_images").insert(rows);
  if (error) console.error(`[Images] sneaker_id ${sneakerId}:`, error);
}

// ─── 8. Processa um produto completo ──────────────────────────────────────────
async function processProduct(
  supabase: ReturnType<typeof createClient>,
  drop: DropItem,
  result: SyncResult,
): Promise<void> {
  const product = await scrapeProduct(drop);
  if (!product) {
    result.failed++;
    result.errors.push(`Falha ao extrair: ${DROPER_BASE}${drop.url}`);
    return;
  }

  console.log(`[Sync] ${product.sku} — ${product.titulo}`);

  const brandId = await getOrCreateBrand(supabase, product.nomeMarca);
  if (!brandId) {
    result.failed++;
    result.errors.push(`Não foi possível resolver marca: ${product.nomeMarca} (SKU ${product.sku})`);
    return;
  }

  const silhouetteId = product.nomeModelo ? await getOrCreateSilhouette(supabase, product.nomeModelo, brandId) : null;

  // Upload das imagens da página do produto
  const uploadedUrls = (
    await Promise.all(product.images.map((img, i) => uploadImage(supabase, img, product.sku, i)))
  ).filter(Boolean) as string[];

  if (uploadedUrls.length === 0) {
    result.failed++;
    result.errors.push(`Upload falhou: SKU ${product.sku}`);
    return;
  }

  const sneakerId = await upsertSneakerModel(supabase, product, brandId, silhouetteId, uploadedUrls);
  if (!sneakerId) {
    result.failed++;
    result.errors.push(`Erro ao salvar modelo: SKU ${product.sku}`);
    return;
  }

  // Salva imagens da página + imagem do card (linkfoto)
  await saveSneakerImages(supabase, sneakerId, uploadedUrls, product.cardImage);

  result.success++;
  result.details.push({ sku: product.sku, images: uploadedUrls.length + (product.cardImage ? 1 : 0) });
}

// ─── Concorrência controlada ──────────────────────────────────────────────────
async function runConcurrent(
  supabase: ReturnType<typeof createClient>,
  drops: DropItem[],
  result: SyncResult,
): Promise<void> {
  for (let i = 0; i < drops.length; i += CONCURRENCY) {
    const chunk = drops.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((drop) => processProduct(supabase, drop, result)));
    console.log(`[Progress] ${Math.min(i + CONCURRENCY, drops.length)}/${drops.length}`);
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let startPage = 0;
    let maxPages = MAX_PAGES;
    let marcaFiltro: string | null = null;
    try {
      const body = await req.json();
      if (body?.page !== undefined) startPage = parseInt(body.page);
      if (body?.maxPages !== undefined) maxPages = parseInt(body.maxPages);
      if (body?.marca !== undefined) marcaFiltro = body.marca ?? null;
    } catch {
      /* usa defaults */
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const result: SyncResult = {
      success: 0,
      failed: 0,
      notFound: 0,
      errors: [],
      details: [],
    };

    let currentPage = startPage;
    let processed = 0;

    while (processed < maxPages) {
      console.log(`[API] Página ${currentPage}...`);
      const { drops, temMais } = await fetchDropsPage(currentPage, marcaFiltro);
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
        marca: marcaFiltro,
        reachedLimit: currentPage >= 99,
        result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Edge Function] Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
