import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
};

interface ReviewRequest {
  session_token: string;
  order_id: string;
  rating: number;
  comment?: string;
  product_quality?: number;
  delivery_speed?: number;
  customer_service?: number;
  would_recommend?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: ReviewRequest = await req.json();

    if (!data.session_token || !data.order_id || !data.rating) {
      throw new Error("session_token, order_id e rating são obrigatórios");
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating deve ser entre 1 e 5");
    }

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from("client_sessions")
      .select("cpf")
      .eq("session_token", data.session_token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      throw new Error("Sessão inválida ou expirada");
    }

    // Validate order belongs to client and is delivered
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_id, client_name, client_cpf, current_status, product_name")
      .eq("order_id", data.order_id)
      .eq("client_cpf", session.cpf)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.current_status !== "DELIVERED") {
      throw new Error("Só é possível avaliar pedidos entregues");
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", data.order_id)
      .eq("client_cpf", session.cpf)
      .maybeSingle();

    if (existingReview) {
      throw new Error("Você já avaliou este pedido");
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        order_id: data.order_id,
        client_cpf: session.cpf,
        client_name: order.client_name,
        rating: data.rating,
        comment: data.comment?.trim() || null,
        product_quality: data.product_quality || null,
        delivery_speed: data.delivery_speed || null,
        customer_service: data.customer_service || null,
        would_recommend: data.would_recommend ?? true,
        is_approved: false,
        is_featured: false,
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Create notification for admin
    await supabase.functions.invoke("create-notification", {
      body: {
        title: "Nova Avaliação Recebida",
        message: `${order.client_name} avaliou o pedido ${data.order_id} com ${data.rating} estrelas`,
        type: "system_alert",
        target: "admin",
        reference_type: "review",
        reference_id: review.id,
      },
    });

    console.log(`Review submitted for order ${data.order_id} by ${session.cpf}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        review_id: review.id,
        message: "Avaliação enviada com sucesso! Obrigado pelo feedback." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Submit review error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
