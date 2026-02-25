import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "listings") {
      const { data, error } = await sb
        .from("vault_marketplace_listings")
        .select("id, title, price, status")
        .eq("status", "active")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return json({ listings: data || [], total: data?.length || 0 });
    }

    return json({ error: "Unknown action" }, 404);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
