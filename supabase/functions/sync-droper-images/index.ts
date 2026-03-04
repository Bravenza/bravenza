import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configurações ─────────────────────────────────────────────────────────────
const CATALOKO_API   = "https://service.cataloko.com/api/search/v4";
const CATALOKO_TOKEN = "ef8bbe71c05448a48c8f6f7923a1e7a5";
const DROPER_BASE    = "https://droper.app";
const STORAGE_BUCKET = "product-images";

// Quantos drops buscar por página (máx permitido pela API: 60)
const PAGE_SIZE = 60;

// Quantas páginas processar por execução
// Aumente conforme necessário (64k produtos = ~1067 páginas)
// Comece com 5 para testar, depois aumente
const MAX_PAGES = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface DropItem {
  id: number;
  url: string; // ex: "/d/36906/nike_air_max_95_big_bubble_linen_feminino"
  nomeMarca?: string;
}

interface DroperProduct {
  sku: string;
  titulo: string;
  images: string[]; // colecaoImagens — até 6 .webp por produto
  droperUrl: string;
}

interface SyncResult {
  success: number;
  failed: number;
  notFound: number;
  skipped: number;
  errors: string[];
  details: { sku: string; images: number }[];
}

// ─── 1. Busca lista de drops via API ──────────────────────────────────────────
async function fetchDropsPage(page: number): Promise<{ drops: DropItem[]; temMais: boolean }> {
  const body = {
    tipoProduto:       1,      // 1 = Tênis
    amount:            PAGE_SIZE,
    amountDrops:       PAGE_SIZE,
    page:              0,
    pageDrops:         page,
    precoMinimo:       10,
    marcas:            [],
    tamanhos:          [],
    cores:             [],
    marca:             null,
    termo:             null,
    condicao:          null,
    ordenacao:         null,
    segmento:          null,
    tag:               null,
    apenasIntant:      null,
    mostrarEncomendas: false,
    precoMaximo:       null,
  };

  const res = await fetch(CATALOKO_API, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json;charset=UTF-8",
      "Authorization": CATALOKO_TOKEN,
      "Origin":        "https://droper.app",
      "Referer":       "https://droper.app/",
      "User-Agent":    "Mozilla/5.0 (compatible; BravenzaBot/1.0)",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API erro ${res.status} na página ${page}`);

  const json = await res.json();

  const drops: DropItem[] = (json.drops ?? []).map((d: Record<string, unknown>) => ({
    id:       d.id,
    url:      d.url as string,
    nomeMarca: d.nomeMarca as string,
  })).filter((d: DropItem) => d.url);

  return {
    drops,
    temMais: json.temMaisDrops === true,
  };
}

// ─── 2. Extrai SKU + colecaoImagens do HTML da página do produto ───────────────
// O droper embute window.CkPreloadModel com todos os dados do produto no HTML.
function extractPreloadModel(html: string): { sku: string; titulo: string; images: string[] } | null {
  try {
    const match = html.match(/window\.CkPreloadModel\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!match) return null;

    const json  = JSON.parse(match[1]);
    const drop  = json?.model?.drop;
    if (!drop) return null;

    const sku    = drop.sku?.trim();
    const titulo = drop.titulo?.trim() ?? "";
    const images: string[] = drop.colecaoImagens ?? [];

    if (!sku || images.length === 0) return null;
    return { sku, titulo, images };
  } catch {
    return null;
  }
}

async function scrapeProduct(dropUrl: string): Promise<DroperProduct | null> {
  try {
    const fullUrl = `${DROPER_BASE}${dropUrl}`;
    const res = await fetch(fullUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
    });
    if (!res.ok) return null;

    const data = extractPreloadModel(await res.text());
    if (!data) return null;

    return { ...data, droperUrl: fullUrl };
  } catch {
    return null;
  }
}

// ─── 3. Upload de imagem para Supabase Storage ─────────────────────────────────
// Salva formato original .webp (mesma qualidade exibida no droper.app)
// Estrutura: product-images/products/{sku}/0.webp ... 5.webp
async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  sku: string,
  index: number
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer      = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/webp";
    const ext         = contentType.includes("png") ? "png"
                      : contentType.includes("jpg") ? "jpg"
                      : "webp";

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

// ─── 4. Atualiza sneaker_models ────────────────────────────────────────────────
async function updateSneakerModel(
  supabase: ReturnType<typeof createClient>,
  sku: string,
  imageUrls: string[],
  droperUrl: string
): Promise<"updated" | "not_found" | "error"> {
  const { data, error } = await supabase
    .from("sneaker_models")
    .update({
      placeholder_image_url: imageUrls[0],      // imagem principal
      source_primary:        droperUrl,          // URL da página na droper
      source_secondary:      imageUrls.slice(1), // imagens adicionais (até 5)
      image_status:          "synced",           // marca como sincronizado
      needs_official_image:  false,              // não precisa de imagem manual
    })
    .eq("sku", sku)
    .select("id");

  if (error) { console.error(`[DB] SKU ${sku}:`, error); return "error"; }
  if (!data || data.length === 0) return "not_found";
  console.log(`[DB] ✅ ${sku} — ${imageUrls.length} imagem(ns)`);
  return "updated";
}

// ─── Handler principal ─────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Permite passar ?page=N na URL para processar páginas específicas
    const url        = new URL(req.url);
    const startPage  = parseInt(url.searchParams.get("page") ?? "0");
    const maxPages   = parseInt(url.searchParams.get("maxPages") ?? String(MAX_PAGES));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result: SyncResult = {
      success: 0, failed: 0, notFound: 0, skipped: 0, errors: [], details: [],
    };

    let currentPage = startPage;
    let processed   = 0;

    // Pagina pelo catálogo da droper
    while (processed < maxPages) {
      console.log(`[API] Buscando página ${currentPage}...`);

      const { drops, temMais } = await fetchDropsPage(currentPage);

      if (drops.length === 0) break;

      for (const drop of drops) {
        // Scraping da página do produto para obter SKU + colecaoImagens
        const product = await scrapeProduct(drop.url);

        if (!product) {
          result.failed++;
          result.errors.push(`Falha ao extrair: ${DROPER_BASE}${drop.url}`);
          continue;
        }

        console.log(`[Sync] ${product.sku} — ${product.titulo} — ${product.images.length} imgs`);

        // Upload de todas as imagens em paralelo
        const uploadedUrls = (
          await Promise.all(
            product.images.map((img, i) => uploadImage(supabase, img, product.sku, i))
          )
        ).filter(Boolean) as string[];

        if (uploadedUrls.length === 0) {
          result.failed++;
          result.errors.push(`Upload falhou: SKU ${product.sku}`);
          continue;
        }

        const status = await updateSneakerModel(
          supabase, product.sku, uploadedUrls, product.droperUrl
        );

        if (status === "updated") {
          result.success++;
          result.details.push({ sku: product.sku, images: uploadedUrls.length });
        } else if (status === "not_found") {
          result.notFound++;
          result.errors.push(`SKU não encontrado: ${product.sku}`);
        } else {
          result.failed++;
          result.errors.push(`Erro ao salvar: ${product.sku}`);
        }

        // Pausa de 300ms entre produtos para não sobrecarregar a droper
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!temMais) break;
      currentPage++;
      processed++;

      // Pausa de 1s entre páginas
      await new Promise((r) => setTimeout(r, 1000));
    }

    return new Response(
      JSON.stringify({
        message: `✅ ${result.success} atualizados | ⚠️ ${result.notFound} SKUs não encontrados | ❌ ${result.failed} falhas`,
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
