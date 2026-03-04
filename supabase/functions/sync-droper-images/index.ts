import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configurações ────────────────────────────────────────────────────────────
const DROPER_BASE_URL = "https://droper.app";
const STORAGE_BUCKET = "product-images";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface DroperProduct {
  sku: string;
  titulo: string;
  images: string[];
  url: string;
}

interface SyncResult {
  success: number;
  failed: number;
  notFound: number;
  errors: string[];
  details: { sku: string; imagesUploaded: number }[];
}

// ─── Extrai JSON embutido no HTML (window.CkPreloadModel) ─────────────────────
function extractPreloadModel(html: string): DroperProduct | null {
  try {
    const match = html.match(/window\.CkPreloadModel\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!match) return null;

    const json = JSON.parse(match[1]);
    const drop = json?.model?.drop;
    if (!drop) return null;

    const sku    = drop.sku?.trim();
    const titulo = drop.titulo?.trim();
    const images: string[] = drop.colecaoImagens ?? [];
    const url    = drop.url ?? "";

    if (!sku || images.length === 0) return null;
    return { sku, titulo, images, url };
  } catch (e) {
    console.error("[Parse] Erro ao extrair CkPreloadModel:", e);
    return null;
  }
}

// ─── Coleta URLs de produtos no catálogo ─────────────────────────────────────
async function fetchProductUrls(): Promise<string[]> {
  const urls: Set<string> = new Set();

  const pages = [
    `${DROPER_BASE_URL}/buscar?categoria=T%C3%AAnis&minprice=10`,
    `${DROPER_BASE_URL}/buscar?categoria=T%C3%AAnis&minprice=10&page=2`,
    `${DROPER_BASE_URL}/buscar?categoria=T%C3%AAnis&minprice=10&page=3`,
  ];

  for (const pageUrl of pages) {
    try {
      const res = await fetch(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const linkRegex = /href="(\/d\/\d+\/[^"]+)"/g;
      let m: RegExpExecArray | null;
      while ((m = linkRegex.exec(html)) !== null) {
        urls.add(`${DROPER_BASE_URL}${m[1]}`);
      }
    } catch (e) {
      console.error(`[Catalog] Erro em ${pageUrl}:`, e);
    }
  }

  console.log(`[Catalog] ${urls.size} produtos encontrados`);
  return Array.from(urls);
}

// ─── Scraping de uma página de produto ───────────────────────────────────────
async function scrapeProductPage(productUrl: string): Promise<DroperProduct | null> {
  try {
    const res = await fetch(productUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BravenzaBot/1.0)" },
    });
    if (!res.ok) return null;
    return extractPreloadModel(await res.text());
  } catch (e) {
    console.error(`[Scrape] Erro em ${productUrl}:`, e);
    return null;
  }
}

// ─── Upload de imagem para Supabase Storage ───────────────────────────────────
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

// ─── Atualiza sneaker_models com as colunas corretas ─────────────────────────
async function updateSneakerModel(
  supabase: ReturnType<typeof createClient>,
  sku: string,
  imageUrls: string[],
  droperSourceUrl: string
): Promise<"updated" | "not_found" | "error"> {
  const { data, error } = await supabase
    .from("sneaker_models")
    .update({
      placeholder_image_url: imageUrls[0],
      source_primary:        droperSourceUrl,
      source_secondary:      imageUrls.slice(1),
      image_status:          "synced",
      needs_official_image:  false,
    })
    .eq("sku", sku)
    .select("id");

  if (error) {
    console.error(`[DB] Erro SKU ${sku}:`, error);
    return "error";
  }
  if (!data || data.length === 0) return "not_found";

  console.log(`[DB] ✅ ${sku} — ${imageUrls.length} imagem(ns) salva(s)`);
  return "updated";
}

// ─── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result: SyncResult = {
      success: 0, failed: 0, notFound: 0, errors: [], details: [],
    };

    // 1. Coleta URLs do catálogo da droper
    const productUrls = await fetchProductUrls();

    if (productUrls.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum produto encontrado no catálogo.", result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Processa cada produto
    for (const url of productUrls) {
      const product = await scrapeProductPage(url);

      if (!product) {
        result.failed++;
        result.errors.push(`Falha ao extrair: ${url}`);
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

      // Atualiza a tabela sneaker_models
      const droperPageUrl = `${DROPER_BASE_URL}${product.url}`;
      const status = await updateSneakerModel(supabase, product.sku, uploadedUrls, droperPageUrl);

      if (status === "updated") {
        result.success++;
        result.details.push({ sku: product.sku, imagesUploaded: uploadedUrls.length });
      } else if (status === "not_found") {
        result.notFound++;
        result.errors.push(`SKU não encontrado em sneaker_models: ${product.sku}`);
      } else {
        result.failed++;
        result.errors.push(`Erro ao salvar: SKU ${product.sku}`);
      }

      // Pausa de 500ms para não sobrecarregar o servidor da droper
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({
        message: `✅ ${result.success} atualizados | ⚠️ ${result.notFound} SKUs não encontrados | ❌ ${result.failed} falhas`,
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
