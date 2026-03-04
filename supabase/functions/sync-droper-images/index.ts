import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STORAGE_BUCKET = "product-images";
const BATCH_SIZE = 10; // Process 10 SKUs per invocation to avoid timeout

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: { sku: string; imageUrl: string }[];
  remaining: number;
}

// ─── Search StockX for a SKU and get image URL ──────────────────────────────
async function searchStockXImage(sku: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://stockx-api.p.rapidapi.com/getproducts?keywords=${encodeURIComponent(sku)}&limit=3`,
      {
        headers: {
          "x-rapidapi-host": "stockx-api.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );
    if (!res.ok) {
      console.error(`[StockX] HTTP ${res.status} for SKU ${sku}`);
      return null;
    }

    const data = await res.json();
    const products = data?.products || data?.hits || [];
    
    if (!Array.isArray(products) || products.length === 0) return null;

    // Try to find exact SKU match first
    const exactMatch = products.find((p: any) => {
      const pSku = (p.styleId || p.sku || p.style_id || "").toUpperCase().replace(/\s/g, "");
      return pSku === sku.toUpperCase().replace(/\s/g, "");
    });

    const product = exactMatch || products[0];
    
    // Extract image URL from various possible fields
    const imageUrl = product.image?.original 
      || product.image?.small
      || product.thumbnailUrl 
      || product.thumbnail_url
      || product.media?.imageUrl
      || product.media?.thumbUrl
      || product.image_url
      || null;

    return imageUrl;
  } catch (e) {
    console.error(`[StockX] Error for SKU ${sku}:`, e);
    return null;
  }
}

// ─── Upload image to Supabase Storage ──────────────────────────────────────
async function uploadImageToStorage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  sku: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/webp";
    const ext = contentType.includes("png") ? "png"
              : contentType.includes("jpg") || contentType.includes("jpeg") ? "jpg"
              : "webp";

    const filePath = `products/${sku.toLowerCase().replace(/[\s\/]/g, "-")}/0.${ext}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error(`[Upload] SKU ${sku}:`, e);
    return null;
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: "RAPIDAPI_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get models that need images
    const { data: models, error: fetchError } = await supabase
      .from("sneaker_models")
      .select("id, sku, model_name_en")
      .eq("needs_official_image", true)
      .not("sku", "is", null)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;

    const totalRemaining = await supabase
      .from("sneaker_models")
      .select("id", { count: "exact", head: true })
      .eq("needs_official_image", true);

    const remaining = (totalRemaining.count || 0) - (models?.length || 0);

    if (!models || models.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "✅ Todos os modelos já possuem imagens!", 
          result: { success: 0, failed: 0, skipped: 0, errors: [], details: [], remaining: 0 } 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: SyncResult = {
      success: 0, failed: 0, skipped: 0, errors: [], details: [], remaining,
    };

    for (const model of models) {
      const sku = model.sku;
      if (!sku || sku.includes("/")) {
        // Skip compound SKUs
        result.skipped++;
        await supabase.from("sneaker_models").update({ 
          needs_official_image: false, 
          image_status: "skipped" 
        }).eq("id", model.id);
        continue;
      }

      console.log(`[Sync] Buscando imagem para SKU: ${sku}`);

      // Search StockX for image
      const imageUrl = await searchStockXImage(sku, rapidApiKey);

      if (!imageUrl) {
        result.failed++;
        result.errors.push(`Imagem não encontrada: ${sku}`);
        // Mark as attempted so we don't retry immediately
        await supabase.from("sneaker_models").update({ 
          image_status: "not_found" 
        }).eq("id", model.id);
        continue;
      }

      // Upload to storage
      const storedUrl = await uploadImageToStorage(supabase, imageUrl, sku);

      if (!storedUrl) {
        result.failed++;
        result.errors.push(`Upload falhou: ${sku}`);
        continue;
      }

      // Update sneaker_models
      const { error: updateError } = await supabase
        .from("sneaker_models")
        .update({
          placeholder_image_url: storedUrl,
          source_primary: imageUrl,
          image_status: "synced",
          needs_official_image: false,
        })
        .eq("id", model.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`DB erro: ${sku} - ${updateError.message}`);
      } else {
        result.success++;
        result.details.push({ sku, imageUrl: storedUrl });
        console.log(`[Sync] ✅ ${sku} — imagem salva`);
      }

      // Rate limiting: 500ms between StockX calls
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({
        message: `✅ ${result.success} sincronizados | ❌ ${result.failed} falhas | ⏭️ ${result.skipped} pulados | 📦 ${result.remaining} restantes`,
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
