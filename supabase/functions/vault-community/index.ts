import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, authErrorResponse } from "../_shared/auth-guard.ts";
import { corsHeaders, jsonResponse } from "../_shared/mk-helpers.ts";

const RATE_LIMIT_POSTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let auth;
  try {
    auth = await requireAuth(req, sb);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const body = await req.json();
    const action = body.action;

    if (action === "create-post") {
      const { type, title, content, member_id } = body;

      if (!title?.trim() || !content?.trim()) {
        return jsonResponse({ error: "Título e conteúdo são obrigatórios" }, 400);
      }
      if (!member_id) {
        return jsonResponse({ error: "member_id obrigatório" }, 400);
      }

      const ALLOWED_TYPES = ["DISCUSSION", "SHOWCASE", "REVIEW", "QUESTION"];
      const safeType = ALLOWED_TYPES.includes(type) ? type : "DISCUSSION";
      const safeTitle = title.trim().slice(0, 200);
      const safeContent = content.trim().slice(0, 5000);

      // Rate limiting
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

      const { count, error: countErr } = await sb
        .from("vault_community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", member_id)
        .gte("created_at", windowStart.toISOString());

      if (countErr) {
        console.error("[vault-community] Rate limit check error:", countErr);
        return jsonResponse({ error: "Erro ao verificar limite" }, 500);
      }

      if ((count ?? 0) >= RATE_LIMIT_POSTS) {
        return jsonResponse({
          error: `Limite de ${RATE_LIMIT_POSTS} publicações por hora atingido. Tente novamente mais tarde.`,
        }, 429);
      }

      const { data: post, error: insertErr } = await sb
        .from("vault_community_posts")
        .insert({
          user_id: member_id,
          type: safeType,
          title: safeTitle,
          content: safeContent,
          status: "PENDING_REVIEW",
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("[vault-community] Insert error:", insertErr);
        return jsonResponse({ error: "Erro ao criar publicação" }, 500);
      }

      console.log(`[vault-community] Post created: ${post.id} by member ${member_id}`);
      return jsonResponse({ success: true, post_id: post.id });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (err: any) {
    console.error("[vault-community] Error:", err);
    return jsonResponse({ error: err.message || "Erro interno" }, 500);
  }
});
