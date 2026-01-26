import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Mercado Pago webhook received:", JSON.stringify(body));

    // Mercado Pago sends notification with action and data.id
    if (body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      // Fetch payment details from Mercado Pago
      const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!mercadoPagoToken) {
        throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
      }

      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${mercadoPagoToken}`,
          },
        }
      );

      const payment = await mpResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      if (payment.status === "approved") {
        // Parse external_reference to get order_id and payment_type
        // Format: order_id-payment_type or order_id-payment_type-card
        const externalRef = payment.external_reference || "";
        const parts = externalRef.split("-");
        
        // Check if it's a card payment (ends with -card)
        const isCardPayment = parts[parts.length - 1] === "card";
        if (isCardPayment) {
          parts.pop(); // Remove 'card' suffix
        }
        
        const paymentType = parts.pop(); // 'sinal' or 'balance'
        const orderId = parts.join("-"); // order_id might contain dashes

        if (!orderId || !paymentType) {
          console.error("Invalid external_reference:", externalRef);
          return new Response("OK", { status: 200 });
        }

        // Determine payment method
        const paymentMethodId = payment.payment_method_id || "";
        const isPixPayment = paymentMethodId === "pix";
        const paymentMethodLabel = isPixPayment ? "PIX" : "CREDIT_CARD";
        const paymentMethodNote = isPixPayment 
          ? "Pix" 
          : `Cartão de Crédito (${payment.installments || 1}x)`;

        console.log(`Payment approved for order ${orderId}, type: ${paymentType}, method: ${paymentMethodLabel}`);

        // Update order payment status
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (paymentType === "sinal") {
          updateData.sinal_paid = true;
          updateData.sinal_paid_at = new Date().toISOString();
          updateData.sinal_payment_method = paymentMethodLabel;
          if (isPixPayment) {
            updateData.sinal_pix_transaction_id = paymentId.toString();
          } else {
            updateData.sinal_stripe_payment_id = paymentId.toString(); // Reusing for MP card payment ID
          }
        } else if (paymentType === "balance") {
          updateData.balance_paid = true;
          updateData.balance_paid_at = new Date().toISOString();
          updateData.balance_payment_method = paymentMethodLabel;
          if (isPixPayment) {
            updateData.balance_pix_transaction_id = paymentId.toString();
          } else {
            updateData.balance_stripe_payment_id = paymentId.toString();
          }
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
        const historyNote =
          paymentType === "sinal"
            ? `Pagamento do sinal confirmado via ${paymentMethodNote}`
            : `Pagamento do saldo confirmado via ${paymentMethodNote}`;

        await supabase.from("order_history").insert({
          order_id: orderId,
          status: paymentType === "sinal" ? "ORDER_CONFIRMED" : "BALANCE_DUE",
          notes: historyNote,
        });

        // Create admin notification
        try {
          await supabase.from("notifications").insert({
            type: "payment_received",
            target: "admin",
            title: `Pagamento ${paymentType === "sinal" ? "do sinal" : "do saldo"} recebido`,
            message: `Pedido ${orderId}: ${paymentMethodNote}`,
            reference_type: "order",
            reference_id: orderId,
          });
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }

        // Fetch order data for email notification
        const { data: orderData } = await supabase
          .from("orders")
          .select("client_name, client_email, product_name, product_price, sinal_value, balance_value")
          .eq("order_id", orderId)
          .single();

        // Send email notification if order has email
        if (orderData?.client_email) {
          const emailType = paymentType === "sinal" ? "sinal_confirmed" : "balance_confirmed";
          
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                type: emailType,
                order_id: orderId,
                client_name: orderData.client_name,
                client_email: orderData.client_email,
                product_name: orderData.product_name,
                total_price: orderData.product_price,
                sinal_value: orderData.sinal_value,
                balance_value: orderData.balance_value,
              }),
            });
            console.log(`Payment confirmation email sent for order ${orderId}`);
          } catch (emailError) {
            console.error("Failed to send payment email:", emailError);
          }
        }

        console.log(`Order ${orderId} updated successfully`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
