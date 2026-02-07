import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CardPaymentRequest {
  token: string;
  card_token: string;
  payment_type: "sinal" | "balance" | "full";
  amount: number;
  order_id: string;
  product_name: string;
  installments: number;
  payer_email: string;
  payer_identification: {
    type: string;
    number: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      token,
      card_token,
      payment_type,
      amount,
      order_id,
      product_name,
      installments,
      payer_email,
      payer_identification,
    }: CardPaymentRequest = await req.json();

    console.log(`Processing card payment for order ${order_id}, type: ${payment_type}, amount: ${amount}`);

    if (!token || !card_token || !payment_type || !amount || !order_id) {
      throw new Error("Parâmetros inválidos");
    }

    // Validate installments (1-12)
    const validInstallments = Math.min(Math.max(1, installments), 12);

    // Verify order using the budget approval token
    const { data: orderData, error: orderError } = await supabase.rpc(
      "get_order_by_token",
      { p_token: token }
    );

    if (orderError || !orderData || orderData.length === 0) {
      console.error("Order not found:", orderError);
      throw new Error("Pedido não encontrado");
    }

    const order = orderData[0];

    // Validate payment status based on payment type
    if (payment_type === "full") {
      if (order.sinal_paid) {
        throw new Error("Pagamento já foi realizado");
      }
    } else if (payment_type === "sinal") {
      if (order.sinal_paid) {
        throw new Error("Sinal já foi pago");
      }
    } else if (payment_type === "balance") {
      if (!order.sinal_paid) {
        throw new Error("Sinal deve ser pago primeiro");
      }
      if (order.balance_paid) {
        throw new Error("Saldo já foi pago");
      }
    }

    // Get additional order data for description
    const { data: fullOrderData } = await supabase
      .from("orders")
      .select("client_email, client_name")
      .eq("order_id", order.order_id)
      .single();

    const clientEmail = payer_email || fullOrderData?.client_email || "cliente@bravenza.com";

    // Determine payment description
    let paymentDescription: string;
    if (payment_type === "full") {
      paymentDescription = `Pagamento Total - ${product_name}`;
    } else if (payment_type === "sinal") {
      paymentDescription = `Sinal - ${product_name}`;
    } else {
      paymentDescription = `Saldo - ${product_name}`;
    }

    // Create payment using Mercado Pago Payments API (Transparent Checkout)
    const paymentPayload = {
      transaction_amount: amount,
      token: card_token,
      description: paymentDescription,
      installments: validInstallments,
      payment_method_id: "credit_card", // Will be auto-detected from token
      payer: {
        email: clientEmail,
        identification: payer_identification,
      },
      statement_descriptor: "BRAVENZA",
      external_reference: `${order_id}-${payment_type}-card`,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        order_id: order_id,
        payment_type: payment_type,
        product_name: product_name,
      },
    };

    console.log("Creating payment with payload:", JSON.stringify(paymentPayload, null, 2));

    const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mercadoPagoToken}`,
        "X-Idempotency-Key": `${order_id}-${payment_type}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentResponse.json();

    console.log("Payment response:", JSON.stringify(paymentData, null, 2));

    if (!paymentResponse.ok) {
      console.error("Mercado Pago payment error:", paymentData);
      
      // Map error codes to user-friendly messages
      let errorMessage = "Erro ao processar pagamento";
      
      if (paymentData.cause && paymentData.cause.length > 0) {
        const cause = paymentData.cause[0];
        const errorCode = cause.code;
        
        const errorMessages: Record<string, string> = {
          "cc_rejected_bad_filled_card_number": "Número do cartão inválido",
          "cc_rejected_bad_filled_date": "Data de validade inválida",
          "cc_rejected_bad_filled_other": "Dados do cartão inválidos",
          "cc_rejected_bad_filled_security_code": "Código de segurança inválido",
          "cc_rejected_blacklist": "Cartão não permitido",
          "cc_rejected_call_for_authorize": "Cartão requer autorização",
          "cc_rejected_card_disabled": "Cartão desabilitado",
          "cc_rejected_card_error": "Erro no cartão",
          "cc_rejected_duplicated_payment": "Pagamento duplicado",
          "cc_rejected_high_risk": "Pagamento recusado por segurança",
          "cc_rejected_insufficient_amount": "Saldo insuficiente",
          "cc_rejected_invalid_installments": "Parcelas inválidas",
          "cc_rejected_max_attempts": "Limite de tentativas excedido",
          "cc_rejected_other_reason": "Cartão recusado",
        };
        
        errorMessage = errorMessages[errorCode] || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Update order based on payment status
    if (paymentData.status === "approved") {
      const now = new Date().toISOString();
      
      if (payment_type === "full" || payment_type === "sinal") {
        // For full payment, we mark sinal as paid (which represents the full amount)
        await supabase
          .from("orders")
          .update({
            sinal_paid: true,
            sinal_paid_at: now,
            sinal_payment_method: "CARD",
            sinal_stripe_payment_id: paymentData.id.toString(),
            current_status: payment_type === "full" ? "ORDER_CONFIRMED" : "ORDER_CONFIRMED",
            updated_at: now,
          })
          .eq("order_id", order_id);

        // Add to order history
        await supabase.from("order_history").insert({
          order_id: order_id,
          status: "ORDER_CONFIRMED",
          notes: payment_type === "full" 
            ? `Pagamento total confirmado via cartão de crédito (${validInstallments}x). ID: ${paymentData.id}`
            : `Sinal confirmado via cartão de crédito (${validInstallments}x). ID: ${paymentData.id}`,
        });
      } else if (payment_type === "balance") {
        await supabase
          .from("orders")
          .update({
            balance_paid: true,
            balance_paid_at: now,
            balance_payment_method: "CARD",
            balance_stripe_payment_id: paymentData.id.toString(),
            updated_at: now,
          })
          .eq("order_id", order_id);

        await supabase.from("order_history").insert({
          order_id: order_id,
          status: "ORDER_CONFIRMED",
          notes: `Saldo confirmado via cartão de crédito (${validInstallments}x). ID: ${paymentData.id}`,
        });
      }

      console.log(`Payment approved for order ${order_id}, payment ID: ${paymentData.id}`);
    }

    return new Response(
      JSON.stringify({
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        payment_id: paymentData.id,
        installments: validInstallments,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error processing card payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
