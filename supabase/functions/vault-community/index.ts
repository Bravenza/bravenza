import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const RATE_LIMIT_POSTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Auth: resolve user
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Auth required" }, 401);

    const { data: { user }, error: authErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return json({ error: "Token inválido" }, 401);

    const body = await req.json();
    const action = body.action;

    if (action === "create-post") {
      const { type, title, content, member_id } = body;

      if (!title?.trim() || !content?.trim()) {
        return json({ error: "Título e conteúdo são obrigatórios" }, 400);
      }
      if (!member_id) {
        return json({ error: "member_id obrigatório" }, 400);
      }

      // Validate type
      const ALLOWED_TYPES = ["DISCUSSION", "SHOWCASE", "REVIEW", "QUESTION"];
      const safeType = ALLOWED_TYPES.includes(type) ? type : "DISCUSSION";

      // Sanitize lengths
      const safeTitle = title.trim().slice(0, 200);
      const safeContent = content.trim().slice(0, 5000);

      // Rate limiting: max 3 posts per hour per user
      const windowStart = new Date();
      windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

      const { count, error: countErr } = await sb
        .from("vault_community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", member_id)
        .gte("created_at", windowStart.toISOString());

      if (countErr) {
        console.error("[vault-community] Rate limit check error:", countErr);
        return json({ error: "Erro ao verificar limite" }, 500);
      }

      if ((count ?? 0) >= RATE_LIMIT_POSTS) {
        return json({
          error: `Limite de ${RATE_LIMIT_POSTS} publicações por hora atingido. Tente novamente mais tarde.`,
        }, 429);
      }

      // Insert with forced PENDING_REVIEW status
      const { data: post, error: insertErr } = await sb
        .from("vault_community_posts")
        .insert({
          user_id: member_id,
          type: safeType,
          title: safeTitle,
          content: safeContent,
          status: "PENDING_REVIEW", // Always forced server-side
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("[vault-community] Insert error:", insertErr);
        return json({ error: "Erro ao criar publicação" }, 500);
      }

      console.log(`[vault-community] Post created: ${post.id} by member ${member_id}`);
      return json({ success: true, post_id: post.id });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err: any) {
    console.error("[vault-community] Error:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
});
