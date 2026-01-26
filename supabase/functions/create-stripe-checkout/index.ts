import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  token: string;
  payment_type: "sinal" | "balance";
  amount: number;
  order_id: string;
  product_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurado");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, payment_type, amount, order_id, product_name }: CheckoutRequest = await req.json();

    if (!token || !payment_type || !amount || !order_id) {
      throw new Error("Parâmetros inválidos");
    }

    // Only allow card payment for balance
    if (payment_type === "sinal") {
      throw new Error("Sinal deve ser pago via Pix");
    }

    // Verify order
    const { data: orderData, error: orderError } = await supabase.rpc(
      "get_order_by_token",
      { p_token: token }
    );

    if (orderError || !orderData || orderData.length === 0) {
      throw new Error("Pedido não encontrado");
    }

    const order = orderData[0];

    if (!order.sinal_paid) {
      throw new Error("Sinal deve ser pago primeiro");
    }

    if (order.balance_paid) {
      throw new Error("Saldo já foi pago");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Saldo - ${product_name}`,
              description: `Pagamento do saldo do pedido ${order_id}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/pagamento/${token}?success=true`,
      cancel_url: `${req.headers.get("origin")}/pagamento/${token}?canceled=true`,
      metadata: {
        order_id,
        payment_type,
        token,
      },
    });

    // Store session ID
    await supabase
      .from("orders")
      .update({ balance_stripe_payment_id: session.id })
      .eq("order_id", order_id);

    console.log(`Stripe checkout created for order ${order_id}, session: ${session.id}`);

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
