import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, authErrorResponse, AuthError } from "../_shared/auth-guard.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const j = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...H, "Content-Type": "application/json" } });
const sc = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });

  const sb = sc();
  const url = new URL(req.url);
  const a = url.searchParams.get("action");
  const mt = req.method;

  // ── All actions require authentication via shared guard ──
  let uid: string;
  try {
    const auth = await requireAuth(req, sb);
    uid = auth.userId;
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse(e);
    return j({ ok: false, error: "Auth required" }, 401);
  }

  try {
    // ─── A) LIST ────────────────────────────────────────────
    if (mt === "GET" && a === "favorite-lists:list") {
      const { data: lists, error } = await sb
        .from("favorite_lists")
        .select("id, name, created_at")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Count items per list
      const listIds = (lists || []).map((l: any) => l.id);
      let counts: Record<string, number> = {};
      if (listIds.length > 0) {
        const { data: items } = await sb
          .from("favorite_list_items")
          .select("list_id")
          .in("list_id", listIds);
        for (const it of items || []) {
          counts[it.list_id] = (counts[it.list_id] || 0) + 1;
        }
      }

      return j({
        ok: true,
        data: (lists || []).map((l: any) => ({ ...l, item_count: counts[l.id] || 0 })),
      });
    }

    // ─── B) CREATE ──────────────────────────────────────────
    if (mt === "POST" && a === "favorite-lists:create") {
      const b = await req.json();
      if (!b.name?.trim()) return j({ ok: false, error: "Nome obrigatório" }, 400);

      const { data, error } = await sb
        .from("favorite_lists")
        .insert({ owner_id: uid, name: b.name.trim() })
        .select()
        .single();
      if (error) throw error;

      return j({ ok: true, data });
    }

    // ─── C) RENAME ──────────────────────────────────────────
    if (mt === "PUT" && a === "favorite-lists:rename") {
      const b = await req.json();
      if (!b.list_id || !b.name?.trim()) return j({ ok: false, error: "list_id e name obrigatórios" }, 400);

      const { error } = await sb
        .from("favorite_lists")
        .update({ name: b.name.trim() })
        .eq("id", b.list_id)
        .eq("owner_id", uid);
      if (error) throw error;

      return j({ ok: true });
    }

    // ─── D) DELETE ──────────────────────────────────────────
    if (mt === "DELETE" && a === "favorite-lists:delete") {
      const listId = url.searchParams.get("list_id");
      if (!listId) return j({ ok: false, error: "list_id obrigatório" }, 400);

      const { error } = await sb
        .from("favorite_lists")
        .delete()
        .eq("id", listId)
        .eq("owner_id", uid);
      if (error) throw error;

      return j({ ok: true });
    }

    // ─── E) ADD ITEM (upsert-safe) ─────────────────────────
    if (mt === "POST" && a === "favorite-lists:add-item") {
      const b = await req.json();
      if (!b.list_id || !b.listing_id) return j({ ok: false, error: "list_id e listing_id obrigatórios" }, 400);

      // Verify ownership of list
      const { data: list } = await sb
        .from("favorite_lists")
        .select("id")
        .eq("id", b.list_id)
        .eq("owner_id", uid)
        .single();
      if (!list) return j({ ok: false, error: "Lista não encontrada" }, 404);

      const { error } = await sb
        .from("favorite_list_items")
        .upsert(
          { list_id: b.list_id, listing_id: b.listing_id },
          { onConflict: "list_id,listing_id", ignoreDuplicates: true }
        );
      if (error) throw error;

      return j({ ok: true });
    }

    // ─── F) REMOVE ITEM ────────────────────────────────────
    if (mt === "DELETE" && a === "favorite-lists:remove-item") {
      const listId = url.searchParams.get("list_id");
      const listingId = url.searchParams.get("listing_id");
      if (!listId || !listingId) return j({ ok: false, error: "list_id e listing_id obrigatórios" }, 400);

      // Verify ownership
      const { data: list } = await sb
        .from("favorite_lists")
        .select("id")
        .eq("id", listId)
        .eq("owner_id", uid)
        .single();
      if (!list) return j({ ok: false, error: "Lista não encontrada" }, 404);

      const { error } = await sb
        .from("favorite_list_items")
        .delete()
        .eq("list_id", listId)
        .eq("listing_id", listingId);
      if (error) throw error;

      return j({ ok: true });
    }

    // ─── G) MOVE ITEMS (bulk) ───────────────────────────────
    if (mt === "POST" && a === "favorite-lists:move-items") {
      const b = await req.json();
      if (!b.from_list_id || !b.to_list_id || !Array.isArray(b.listing_ids) || b.listing_ids.length === 0) {
        return j({ ok: false, error: "from_list_id, to_list_id e listing_ids[] obrigatórios" }, 400);
      }

      // Verify ownership of both lists
      const { data: owned } = await sb
        .from("favorite_lists")
        .select("id")
        .eq("owner_id", uid)
        .in("id", [b.from_list_id, b.to_list_id]);
      if (!owned || owned.length < 2) return j({ ok: false, error: "Listas não encontradas" }, 404);

      // Insert into target (ignore duplicates), then delete from source
      const toInsert = b.listing_ids.map((lid: string) => ({ list_id: b.to_list_id, listing_id: lid }));
      await sb
        .from("favorite_list_items")
        .upsert(toInsert, { onConflict: "list_id,listing_id", ignoreDuplicates: true });

      await sb
        .from("favorite_list_items")
        .delete()
        .eq("list_id", b.from_list_id)
        .in("listing_id", b.listing_ids);

      return j({ ok: true, data: { moved: b.listing_ids.length } });
    }

    return j({ ok: false, error: "Ação não encontrada" }, 404);
  } catch (e: any) {
    console.error("mkv2-favorites error:", e);
    return j({ ok: false, error: e.message }, 500);
  }
});
