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

    const { session_token } = await req.json();

    if (!session_token) {
      throw new Error("Token de sessão é obrigatório");
    }

    // Validate session
    const { data: sessions, error: sessionError } = await supabase
      .from("client_sessions")
      .select("cpf")
      .eq("session_token", session_token)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (sessionError) throw sessionError;

    if (!sessions || sessions.length === 0) {
      throw new Error("Sessão inválida ou expirada");
    }

    const cpf = sessions[0].cpf;

    // Get all orders for this CPF
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        order_id,
        order_type,
        current_status,
        product_name,
        product_brand,
        product_model,
        product_size,
        product_color,
        product_price,
        product_currency,
        sinal_value,
        sinal_paid,
        sinal_paid_at,
        balance_value,
        balance_paid,
        balance_paid_at,
        budget_status,
        budget_approval_token,
        international_tracking,
        national_tracking,
        national_carrier,
        created_at,
        updated_at
      `)
      .eq("client_cpf", cpf)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    // Get order history for each order
    const ordersWithHistory = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: history } = await supabase
          .from("order_history")
          .select("status, notes, created_at")
          .eq("order_id", order.order_id)
          .order("created_at", { ascending: true });

        return {
          ...order,
          history: history || [],
        };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        orders: ordersWithHistory 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Client orders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
