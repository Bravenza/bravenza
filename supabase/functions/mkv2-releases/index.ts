import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Fetch manual releases from sneaker_releases table */
async function fetchDbReleases(sb: any): Promise<any[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await sb
    .from("sneaker_releases")
    .select("brand, model, colorway, release_date, image_url, hype_level")
    .eq("is_active", true)
    .gte("release_date", today)
    .order("release_date", { ascending: true })
    .limit(20);

  if (error) {
    console.error("[mkv2-releases] DB fallback error:", error);
    return [];
  }
  return (data || []).map((r: any) => ({
    ...r,
    release_date: typeof r.release_date === "string" ? r.release_date.split("T")[0] : r.release_date,
  }));
}

/** Generate releases via AI */
async function fetchAiReleases(apiKey: string): Promise<any[]> {
  const today = new Date().toISOString().split("T")[0];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a sneaker industry expert. Return upcoming sneaker releases as JSON via tool call. Today is ${today}. Include releases from Nike, Jordan, Adidas, New Balance, Puma, and Asics. Focus on the next 30-60 days. Only include confirmed or highly likely releases. Return 8-12 releases sorted by date. For each release, provide a real product image URL from the brand's official CDN or a well-known sneaker media site. Use high-quality transparent PNG product shots when possible. Common image sources: images.stockx.com, images.goat.com, or official brand CDNs. If you cannot find a real image URL, use null.`,
        },
        {
          role: "user",
          content: `List the most anticipated upcoming sneaker releases for the next 60 days starting from ${today}. Include brand, model name, colorway, release date (YYYY-MM-DD), a product image URL, and hype level (low/medium/high/grail).`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_releases",
            description: "Return a list of upcoming sneaker releases",
            parameters: {
              type: "object",
              properties: {
                releases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      brand: { type: "string" },
                      model: { type: "string" },
                      colorway: { type: "string" },
                      release_date: { type: "string", description: "YYYY-MM-DD format" },
                      image_url: { type: "string", description: "Direct URL to product image, or null" },
                      hype_level: { type: "string", enum: ["low", "medium", "high", "grail"] },
                    },
                    required: ["brand", "model", "colorway", "release_date", "hype_level"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["releases"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_releases" } },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const text = await response.text();
    console.error(`[mkv2-releases] AI error: ${status}`, text);
    throw new Error(`AI gateway returned ${status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return [];

  const parsed = JSON.parse(toolCall.function.arguments);
  return (parsed.releases || []).map((r: Record<string, unknown>) => ({
    ...r,
    image_url: r.image_url && r.image_url !== "null" && r.image_url !== "" ? r.image_url : null,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cronStartedAt = new Date().toISOString();
  let cronLogId: string | null = null;

  try {
    const { data: logEntry } = await sb
      .from("cron_execution_logs")
      .insert({ job_name: "mkv2-releases", started_at: cronStartedAt, status: "running" })
      .select("id")
      .single();
    cronLogId = logEntry?.id || null;

    // 1. Always fetch DB releases as baseline
    const dbReleases = await fetchDbReleases(sb);

    // 2. Try AI enrichment if key is available
    let aiReleases: any[] = [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      try {
        aiReleases = await fetchAiReleases(LOVABLE_API_KEY);
        console.log(`[mkv2-releases] AI returned ${aiReleases.length} releases`);
      } catch (aiErr) {
        console.warn("[mkv2-releases] AI generation failed, using DB fallback only:", aiErr);
      }
    } else {
      console.warn("[mkv2-releases] LOVABLE_API_KEY not configured, using DB fallback only");
    }

    // 3. Merge: DB releases take priority (dedup by brand+model+date), AI fills gaps
    const seen = new Set<string>();
    const merged: any[] = [];

    for (const r of dbReleases) {
      const key = `${r.brand}|${r.model}|${r.release_date}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...r, source: "manual" });
      }
    }

    for (const r of aiReleases) {
      const key = `${r.brand}|${r.model}|${r.release_date}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...r, source: "ai" });
      }
    }

    // Sort by release_date
    merged.sort((a, b) => a.release_date.localeCompare(b.release_date));

    if (cronLogId) {
      await sb.from("cron_execution_logs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(cronStartedAt).getTime(),
        result: { releases_count: merged.length, db_count: dbReleases.length, ai_count: aiReleases.length },
      }).eq("id", cronLogId);
    }

    return jsonResponse({ releases: merged });
  } catch (e) {
    console.error("[mkv2-releases] Error:", e);

    if (cronLogId) {
      await sb.from("cron_execution_logs").update({
        status: "error",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(cronStartedAt).getTime(),
        error_message: e instanceof Error ? e.message : "Unknown",
      }).eq("id", cronLogId);
    }

    // Last resort: try DB fallback even on unexpected errors
    try {
      const fallback = await fetchDbReleases(sb);
      if (fallback.length > 0) {
        return jsonResponse({ releases: fallback, fallback: true });
      }
    } catch { /* ignore */ }

    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error", releases: [] }, 500);
  }
});
