import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CardCheckoutRequest {
  token: string;
  payment_type: "sinal" | "balance" | "full";
  amount: number;
  order_id: string;
  product_name: string;
  installments?: number;
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

    const { token, payment_type, amount, order_id, product_name, installments = 1 }: CardCheckoutRequest = await req.json();

    if (!token || !payment_type || !amount || !order_id) {
      throw new Error("Parâmetros inválidos");
    }

    // Card is allowed for all payment types now

    // Validate installments (1-12)
    const validInstallments = Math.min(Math.max(1, installments), 12);

    // Verify order
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
      // Full payment: check if already paid
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

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://bravenza.com.br";

    // Determine payment description based on type
    let paymentTitle: string;
    let paymentDescription: string;
    if (payment_type === "full") {
      paymentTitle = `Pagamento Total - ${product_name}`;
      paymentDescription = `Pagamento integral do pedido ${order_id}`;
    } else if (payment_type === "sinal") {
      paymentTitle = `Sinal - ${product_name}`;
      paymentDescription = `Pagamento do sinal do pedido ${order_id}`;
    } else {
      paymentTitle = `Saldo - ${product_name}`;
      paymentDescription = `Pagamento do saldo do pedido ${order_id}`;
    }

    // Create Mercado Pago Preference for Credit Card Checkout Pro
    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mercadoPagoToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: order_id,
            title: paymentTitle,
            description: paymentDescription,
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount,
          },
        ],
        payer: {
          email: clientEmail,
          name: clientName,
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [
            { id: "ticket" }, // Exclude boleto
            { id: "atm" }, // Exclude ATM
            { id: "debit_card" }, // Only credit card
          ],
          installments: validInstallments, // Max installments
          default_installments: 1,
        },
        back_urls: {
          success: `${origin}/pagamento/${token}?success=true&method=card`,
          failure: `${origin}/pagamento/${token}?error=true&method=card`,
          pending: `${origin}/pagamento/${token}?pending=true&method=card`,
        },
        auto_return: "approved",
        external_reference: `${order_id}-${payment_type}-card`,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        statement_descriptor: "BRAVENZA",
        binary_mode: false, // Allow pending payments
      }),
    });

    const preferenceData = await preferenceResponse.json();

    if (!preferenceResponse.ok) {
      console.error("Mercado Pago preference error:", preferenceData);
      throw new Error(preferenceData.message || "Erro ao criar preferência de pagamento");
    }

    // Store preference ID for tracking
    await supabase
      .from("orders")
      .update({ 
        balance_stripe_payment_id: preferenceData.id, // Reusing this field for MP preference ID
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order_id);

    console.log(`Mercado Pago card checkout created for order ${order_id}, preference: ${preferenceData.id}`);

    return new Response(
      JSON.stringify({ 
        checkout_url: preferenceData.init_point,
        preference_id: preferenceData.id,
        installments: validInstallments,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating card checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
