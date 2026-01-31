import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let code: string;

    // Support both GET (query params) and POST (body)
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
          error: "Código de autenticidade não fornecido" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Normalize code (uppercase, trim)
    code = code.toUpperCase().trim();

    console.log("Verifying authenticity code:", code);

    // Call the verification function
    const { data, error } = await supabase.rpc("verify_authenticity", {
      p_code: code
    });

    if (error) {
      console.error("Verification error:", error);
      throw new Error("Erro ao verificar autenticidade");
    }

    if (!data || data.length === 0 || !data[0].is_valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          is_valid: false,
          error: "Código de autenticidade inválido ou não encontrado" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404
        }
      );
    }

    const result = data[0];

    // Format response with product details
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
          client_name: result.client_name,
          inspection_photos: result.inspection_photos || [],
          purchase_date: result.created_at,
          verification_count: result.verification_count,
          verified_at: new Date().toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno do servidor" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
