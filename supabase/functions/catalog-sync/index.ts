/**
 * catalog-sync — Syncs sneaker_models → marketplace_products
 *
 * Action tiers:
 *   PUBLIC_ACTIONS  → (none)
 *   AUTH_ACTIONS    → (none)
 *   ADMIN_ACTIONS   → preview, sync, update-images (admin, service-role, or cron)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceOrAdmin, authErrorResponse } from "../_shared/auth-guard.ts";
import { corsHeaders, jsonResponse } from "../_shared/mk-helpers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Auth: require service-role, cron key, or admin session (shared guard)
  try {
    await requireServiceOrAdmin(req, sb);
  } catch (error) {
    return authErrorResponse(error);
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const mode = body.mode || "preview";
  const batchSize = body.batch_size || 100;
  const offset = body.offset || 0;

  try {
    if (mode === "preview") {
      const { count: totalModels } = await sb.from("sneaker_models").select("id", { count: "exact", head: true });
      const { count: totalProducts } = await sb.from("marketplace_products").select("id", { count: "exact", head: true });

      const PAGE = 1000;
      const modelSkus = new Set<string>();
      let mOff = 0;
      while (true) {
        const { data: pg } = await sb.from("sneaker_models").select("sku").not("sku", "is", null).range(mOff, mOff + PAGE - 1);
        if (!pg || pg.length === 0) break;
        for (const m of pg) if (m.sku) modelSkus.add(m.sku);
        if (pg.length < PAGE) break;
        mOff += PAGE;
      }
      const mpSkus = new Set<string>();
      let pOff = 0;
      while (true) {
        const { data: pg } = await sb.from("marketplace_products").select("sku").not("sku", "is", null).range(pOff, pOff + PAGE - 1);
        if (!pg || pg.length === 0) break;
        for (const p of pg) if (p.sku) mpSkus.add(p.sku);
        if (pg.length < PAGE) break;
        pOff += PAGE;
      }
      let alreadySynced = 0, pendingSync = 0;
      for (const sku of modelSkus) {
        if (mpSkus.has(sku)) alreadySynced++; else pendingSync++;
      }

      const { count: outdatedImages } = await sb.rpc("count_outdated_images").maybeSingle() || { count: 0 };

      return jsonResponse({
        ok: true,
        total_sneaker_models: totalModels || 0,
        total_marketplace_products: totalProducts || 0,
        existing_skus_in_marketplace: alreadySynced,
        estimated_to_sync: pendingSync,
        outdated_images: outdatedImages || 0,
      });
    }

    if (mode === "sync") {
      const { data: models, error: modelsErr } = await sb
        .from("sneaker_models")
        .select("id, sku, model_name_en, model_name_pt, description_en, description_pt, colorway, release_date, msrp, image_status, brand:brands!inner(name)")
        .order("created_at", { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (modelsErr) throw modelsErr;
      if (!models || models.length === 0) return jsonResponse({ ok: true, synced: 0, updated: 0, skipped: 0, has_more: false });

      const skus = models.map((m: any) => m.sku).filter(Boolean);
      
      const { data: existingProducts } = await sb
        .from("marketplace_products")
        .select("id, sku, images")
        .in("sku", skus);
      const existingMap = new Map((existingProducts || []).map((p: any) => [p.sku, p]));

      const modelIds = models.map((m: any) => m.id);
      const { data: imgData } = await sb
        .from("sneaker_images")
        .select("sneaker_id, image_url, is_primary")
        .in("sneaker_id", modelIds)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      const imageMap = new Map<string, string[]>();
      for (const img of (imgData || [])) {
        const list = imageMap.get(img.sneaker_id) || [];
        list.push(img.image_url);
        imageMap.set(img.sneaker_id, list);
      }

      let synced = 0, updated = 0, skipped = 0;
      const errors: string[] = [];
      const toInsert: any[] = [];
      const toUpdate: { id: string; images: string[] }[] = [];

      for (const model of models) {
        if (!model.sku) { skipped++; continue; }
        const brandName = (model as any).brand?.name || "Unknown";
        let modelName = model.model_name_pt || model.model_name_en || model.sku;
        if (modelName.toLowerCase().startsWith(brandName.toLowerCase() + " ")) {
          modelName = modelName.substring(brandName.length + 1).trim();
        }
        const description = model.description_pt || model.description_en || `${brandName} ${modelName}`;
        const imageArray = imageMap.get(model.id) || [];
        const existing = existingMap.get(model.sku);

        if (existing) {
          const currentImgCount = existing.images?.length || 0;
          if (imageArray.length > currentImgCount) {
            toUpdate.push({ id: existing.id, images: imageArray });
          } else {
            skipped++;
          }
          continue;
        }

        const slug = `${brandName}-${modelName}`
          .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 120);
        const uniqueSlug = `${slug}-${model.sku.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 10)}`;

        toInsert.push({
          brand: brandName, model: modelName, colorway: model.colorway || null,
          sku: model.sku, release_date: model.release_date || null,
          retail_price: model.msrp || null, description, category: "sneakers",
          images: imageArray, is_active: true, is_high_risk: false,
          total_offers: 0, lowest_price: null, slug: uniqueSlug,
        });
      }

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
          for (const row of chunk) {
            const { error: singleErr } = await sb
              .from("marketplace_products")
              .upsert(row, { onConflict: "sku", ignoreDuplicates: true });
            if (singleErr) { skipped++; } else { synced++; }
          }
        } else {
          synced += inserted?.length || chunk.length;
        }
      }

      for (const upd of toUpdate) {
        const { error: updErr } = await sb
          .from("marketplace_products")
          .update({ images: upd.images })
          .eq("id", upd.id);
        if (updErr) {
          errors.push(`Image update failed: ${updErr.message}`);
        } else {
          updated++;
        }
      }

      return jsonResponse({
        ok: true, synced, updated, skipped,
        errors: errors.length, error_details: errors.slice(0, 5),
        offset, next_offset: offset + batchSize,
        has_more: models.length === batchSize, batch_size: batchSize,
      });
    }

    if (mode === "update-images") {
      const { data: products, error: pErr } = await sb
        .from("marketplace_products")
        .select("id, sku")
        .not("sku", "is", null)
        .order("created_at", { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (pErr) throw pErr;
      if (!products || products.length === 0) return jsonResponse({ ok: true, updated: 0, has_more: false });

      const skus = products.map((p: any) => p.sku);
      const { data: models } = await sb
        .from("sneaker_models")
        .select("id, sku")
        .in("sku", skus);
      const skuToModelId = new Map((models || []).map((m: any) => [m.sku, m.id]));

      const modelIds = [...new Set((models || []).map((m: any) => m.id))];
      const { data: imgData } = await sb
        .from("sneaker_images")
        .select("sneaker_id, image_url, is_primary")
        .in("sneaker_id", modelIds)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      const imageMap = new Map<string, string[]>();
      for (const img of (imgData || [])) {
        const list = imageMap.get(img.sneaker_id) || [];
        list.push(img.image_url);
        imageMap.set(img.sneaker_id, list);
      }

      let updated = 0;
      for (const prod of products) {
        const modelId = skuToModelId.get(prod.sku);
        if (!modelId) continue;
        const imgs = imageMap.get(modelId);
        if (!imgs || imgs.length === 0) continue;
        const { error } = await sb
          .from("marketplace_products")
          .update({ images: imgs })
          .eq("id", prod.id);
        if (!error) updated++;
      }

      return jsonResponse({
        ok: true, updated, offset,
        next_offset: offset + batchSize,
        has_more: products.length === batchSize,
      });
    }

    return jsonResponse({ ok: false, error: "mode inválido. Use: preview, sync" }, 400);
  } catch (e: any) {
    console.error("catalog-sync error:", e);
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
});
