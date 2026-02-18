import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ releases: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ releases: parsed.releases || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("releases error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", releases: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
