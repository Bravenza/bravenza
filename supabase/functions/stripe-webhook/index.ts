import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurado");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
    }

    console.log("Stripe webhook event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.order_id;
      const paymentType = session.metadata?.payment_type;

      if (!orderId) {
        console.error("No order_id in metadata");
        return new Response("OK", { status: 200 });
      }

      console.log(`Checkout completed for order ${orderId}, type: ${paymentType}`);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update order payment status
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (paymentType === "balance") {
        updateData.balance_paid = true;
        updateData.balance_paid_at = new Date().toISOString();
        updateData.balance_payment_method = "CREDIT_CARD";
        updateData.balance_stripe_payment_id = session.payment_intent?.toString() || session.id;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("order_id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw updateError;
      }

      // Add to order history
      await supabase.from("order_history").insert({
        order_id: orderId,
        status: "BALANCE_DUE",
        notes: "Pagamento do saldo confirmado via Cartão de Crédito",
      });

      console.log(`Order ${orderId} updated successfully`);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
});
