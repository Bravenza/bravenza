import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Rate limit: max attempts per IP per window
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get client IP for rate limiting
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    let code: string;

    if (req.method === "GET") {
      const url = new URL(req.url);
      code = url.searchParams.get("code") || "";
    } else {
      const body = await req.json();
      code = body.code;
    }

    if (!code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Código de autenticidade não fornecido",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Normalize code
    code = code.toUpperCase().trim();

    // Validate code format (only alphanumeric + dash, max 20 chars)
    if (!/^[A-Z0-9-]{4,20}$/.test(code)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Formato de código inválido",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // --- Rate limiting check ---
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    const { count: attemptCount } = await supabase
      .from("verification_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if ((attemptCount ?? 0) >= RATE_LIMIT_MAX) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Muitas tentativas de verificação. Aguarde alguns minutos e tente novamente.",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60),
          },
          status: 429,
        }
      );
    }

    console.log("Verifying authenticity code:", code, "from IP:", clientIp);

    // Call the verification function
    const { data, error } = await supabase.rpc("verify_authenticity", {
      p_code: code,
    });

    const isValid = data && data.length > 0 && data[0].is_valid;

    // --- Log the attempt ---
    await supabase.from("verification_attempts").insert({
      ip_address: clientIp,
      code_attempted: code,
      is_valid: !!isValid,
    });

    if (error) {
      console.error("Verification error:", error);
      throw new Error("Erro ao verificar autenticidade");
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          is_valid: false,
          error: "Código de autenticidade inválido ou não encontrado",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    const result = data[0];

    // Mask client name for privacy (show first name + initials)
    const maskClientName = (name: string): string => {
      if (!name) return "Cliente Bravenza";
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0][0] + "***";
      return (
        parts[0] +
        " " +
        parts
          .slice(1)
          .map((p: string) => p[0] + ".")
          .join(" ")
      );
    };

    // Format response with reduced data exposure
    return new Response(
      JSON.stringify({
        success: true,
        is_valid: true,
        certificate: {
          order_id: result.order_id,
          product: {
            name: result.product_name,
            brand: result.product_brand,
            model: result.product_model,
            size: result.product_size,
            color: result.product_color,
          },
          client_name: maskClientName(result.client_name),
          inspection_photos: result.inspection_photos || [],
          purchase_date: result.created_at,
          verification_count: result.verification_count,
          verified_at: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);

    // Log failed attempt
    try {
      await supabase.from("verification_attempts").insert({
        ip_address: clientIp,
        code_attempted: "ERROR",
        is_valid: false,
      });
    } catch (_) {
      // Ignore logging errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Cleanup old attempts (called periodically, not on every request)
// This is handled by the edge function's own lifecycle
