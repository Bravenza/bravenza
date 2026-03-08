import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkIdempotency, setIdempotencyResult, markIdempotencyFailed } from "../_shared/idempotency.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PixRequest {
  token: string;
  payment_type: "sinal" | "balance" | "full";
  amount: number;
  description: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!mercadoPagoToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, payment_type, amount, description, idempotency_key }: PixRequest & { idempotency_key?: string } = await req.json();

    if (!token || !payment_type || !amount) {
      throw new Error("Parâmetros inválidos");
    }

    // Verify order exists and get details
    const { data: orderData, error: orderError } = await supabase.rpc(
      "get_order_by_token",
      { p_token: token }
    );

    if (orderError || !orderData || orderData.length === 0) {
      throw new Error("Pedido não encontrado");
    }

    const order = orderData[0];

    // Fetch additional order data including email
    const { data: fullOrderData } = await supabase
      .from("orders")
      .select("client_email, client_name")
      .eq("order_id", order.order_id)
      .single();

    const clientEmail = fullOrderData?.client_email || "cliente@bravenza.com";
    const clientName = fullOrderData?.client_name || order.client_name;

    // Validate payment status based on payment type
    if (payment_type === "full") {
      // Full payment: check if already paid (using sinal_paid as the marker)
      if (order.sinal_paid) {
        throw new Error("Pagamento já foi realizado");
      }
    } else if (payment_type === "sinal") {
      if (order.sinal_paid) {
        throw new Error("Sinal já foi pago");
      }
    } else if (payment_type === "balance") {
      if (order.balance_paid) {
        throw new Error("Saldo já foi pago");
      }
      if (!order.sinal_paid) {
        throw new Error("Sinal deve ser pago primeiro");
      }
    }

    // Deterministic idempotency key — same order+type always maps to same key
    const idempKey = idempotency_key || `pix-${order.order_id}-${payment_type}`;

    // Server-side idempotency check
    const idempCheck = await checkIdempotency(supabase, idempKey, 15);
    if (idempCheck.isDuplicate) {
      console.log(`[generate-pix] Duplicate request for ${idempKey}, returning cached`);
      return new Response(JSON.stringify(idempCheck.cachedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Mercado Pago Pix payment
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mercadoPagoToken}`,
        "X-Idempotency-Key": idempKey,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description,
        payment_method_id: "pix",
        payer: {
          email: clientEmail,
          first_name: clientName?.split(" ")[0] || "Cliente",
          last_name: clientName?.split(" ").slice(1).join(" ") || "",
        },
        external_reference: `${order.order_id}-${payment_type}`,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpData);
      throw new Error(mpData.message || "Erro ao gerar Pix");
    }

    // Get QR code data
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const copyPaste = mpData.point_of_interaction?.transaction_data?.qr_code;

    if (!qrCode || !copyPaste) {
      throw new Error("Erro ao obter dados do Pix");
    }

    // Store Pix transaction ID - for "full" payment, use sinal fields
    let updateField: Record<string, string>;
    if (payment_type === "full" || payment_type === "sinal") {
      updateField = { 
        sinal_pix_transaction_id: mpData.id.toString(), 
        pix_qr_code: `data:image/png;base64,${qrCode}`, 
        pix_copy_paste: copyPaste 
      };
    } else {
      updateField = { 
        balance_pix_transaction_id: mpData.id.toString(), 
        pix_qr_code: `data:image/png;base64,${qrCode}`, 
        pix_copy_paste: copyPaste 
      };
    }

    // Get order_id from token
    const { data: fullOrder } = await supabase
      .from("orders")
      .select("order_id")
      .eq("budget_approval_token", token)
      .single();

    if (fullOrder) {
      await supabase
        .from("orders")
        .update(updateField)
        .eq("order_id", fullOrder.order_id);
    }

    console.log(`Pix generated for order ${order.order_id}, payment_id: ${mpData.id}`);

    const responseData = {
      payment_id: mpData.id,
      qr_code: `data:image/png;base64,${qrCode}`,
      copy_paste: copyPaste,
      expires_at: mpData.date_of_expiration,
    };

    await setIdempotencyResult(supabase, idempKey, responseData);

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating Pix:", error);
    // Record failure — idempKey may not be set if error happened before idempotency check
    if (typeof idempKey === "string" && idempKey) {
      await markIdempotencyFailed(supabase, idempKey, error.message || "PIX generation error").catch(() => {});
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
