import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeParseBody } from "../_shared/input-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    if (!token || !action) {
      return new Response(
        JSON.stringify({ success: false, error: "Token e action são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const response = await fetch(verifyUrl, { method: "POST" });
    const data = await response.json();

    console.log("reCAPTCHA verification result:", {
      success: data.success,
      score: data.score,
      action: data.action,
      expectedAction: action,
    });

    // Validate: success, score >= 0.5, and action matches
    const isValid =
      data.success === true &&
      data.score >= 0.5 &&
      data.action === action;

    return new Response(
      JSON.stringify({
        success: isValid,
        score: data.score,
        error: isValid ? undefined : "Verificação de segurança falhou. Tente novamente.",
      }),
      {
        status: isValid ? 200 : 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Captcha verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno na verificação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
