import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

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

  let body: any = {};
  try { body = await req.json(); } catch {}
  const mode = body.mode || "preview";
  const batchSize = body.batch_size || 100;
  const offset = body.offset || 0;

  try {
    if (mode === "preview") {
      // Count how many sneaker_models don't have a corresponding marketplace_products entry
      const { count: totalModels } = await sb.from("sneaker_models").select("id", { count: "exact", head: true });
      const { count: totalProducts } = await sb.from("marketplace_products").select("id", { count: "exact", head: true });

      // Find models that already have a matching SKU in marketplace_products
      const { data: existingSkus } = await sb.from("marketplace_products").select("sku").not("sku", "is", null);
      const skuSet = new Set((existingSkus || []).map((p: any) => p.sku).filter(Boolean));

      // Count models not yet synced (sampling to avoid timeout)
      const { data: sampleModels, count: pendingCount } = await sb
        .from("sneaker_models")
        .select("id, sku", { count: "exact" })
        .limit(1);

      return json({
        ok: true,
        total_sneaker_models: totalModels || 0,
        total_marketplace_products: totalProducts || 0,
        existing_skus_in_marketplace: skuSet.size,
        estimated_to_sync: (totalModels || 0) - skuSet.size,
      });
    }

    if (mode === "sync") {
      // Fetch a batch of sneaker_models with brand info and primary image
      const { data: models, error: modelsErr } = await sb
        .from("sneaker_models")
        .select("id, sku, model_name_en, model_name_pt, description_en, description_pt, colorway, release_date, msrp, image_status, brand:brands!inner(name)")
        .order("created_at", { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (modelsErr) throw modelsErr;
      if (!models || models.length === 0) return json({ ok: true, synced: 0, skipped: 0, has_more: false });

      // Get all existing SKUs in marketplace_products to skip
      const skus = models.map((m: any) => m.sku).filter(Boolean);
      const { data: existingProducts } = await sb
        .from("marketplace_products")
        .select("sku")
        .in("sku", skus);
      const existingSkuSet = new Set((existingProducts || []).map((p: any) => p.sku));

      // Get ALL images for these models (primary first, then by index)
      const modelIds = models.map((m: any) => m.id);
      const { data: images } = await sb
        .from("sneaker_images")
        .select("sneaker_id, image_url, is_primary")
        .in("sneaker_id", modelIds)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      // Build a map: sneaker_id → array of image URLs (primary first)
      const imageMap = new Map<string, string[]>();
      for (const img of (images || [])) {
        const list = imageMap.get(img.sneaker_id) || [];
        list.push(img.image_url);
        imageMap.set(img.sneaker_id, list);
      }

      let synced = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Batch insert - prepare rows
      const toInsert: any[] = [];
      for (const model of models) {
        if (!model.sku || existingSkuSet.has(model.sku)) {
          skipped++;
          continue;
        }

        const brandName = (model as any).brand?.name || "Unknown";
        let modelName = model.model_name_pt || model.model_name_en || model.sku;
        // Strip leading brand name to avoid duplication (e.g. "Nike Air Max 1" → "Air Max 1")
        if (modelName.toLowerCase().startsWith(brandName.toLowerCase() + " ")) {
          modelName = modelName.substring(brandName.length + 1).trim();
        }
        const description = model.description_pt || model.description_en || `${brandName} ${modelName}`;
        const imageArray = imageMap.get(model.id) || [];

        // Generate slug
        const slug = `${brandName}-${modelName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 120);

        // Check slug uniqueness
        const uniqueSlug = `${slug}-${model.sku.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 10)}`;

        toInsert.push({
          brand: brandName,
          model: modelName,
          colorway: model.colorway || null,
          sku: model.sku,
          release_date: model.release_date || null,
          retail_price: model.msrp || null,
          description,
          category: "sneakers",
          images: imageArray,
          is_active: true,
          is_high_risk: false,
          total_offers: 0,
          lowest_price: null,
          slug: uniqueSlug,
        });
      }

      // Insert in chunks of 50 to avoid payload limits
      const CHUNK = 50;
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        const chunk = toInsert.slice(i, i + CHUNK);
        const { data: inserted, error: insertErr } = await sb
          .from("marketplace_products")
          .upsert(chunk, { onConflict: "sku", ignoreDuplicates: true })
          .select("id");

        if (insertErr) {
          console.error("Batch insert error:", insertErr);
          errors.push(insertErr.message);
          // Try individual inserts for this chunk
          for (const row of chunk) {
            const { error: singleErr } = await sb
              .from("marketplace_products")
              .upsert(row, { onConflict: "sku", ignoreDuplicates: true });
            if (singleErr) {
              console.error(`Insert error for SKU ${row.sku}:`, singleErr.message);
              skipped++;
            } else {
              synced++;
            }
          }
        } else {
          synced += inserted?.length || chunk.length;
        }
      }

      const hasMore = models.length === batchSize;

      return json({
        ok: true,
        synced,
        skipped,
        errors: errors.length,
        error_details: errors.slice(0, 5),
        offset,
        next_offset: offset + batchSize,
        has_more: hasMore,
        batch_size: batchSize,
      });
    }

    return json({ ok: false, error: "mode inválido. Use: preview, sync" }, 400);
  } catch (e: any) {
    console.error("catalog-sync error:", e);
    return json({ ok: false, error: e.message }, 500);
  }
});
