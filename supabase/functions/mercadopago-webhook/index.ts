import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

        // Get current order data before update
        const { data: currentOrder } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .single();

        if (!currentOrder) {
          console.error("Order not found:", orderId);
          return new Response("OK", { status: 200 });
        }

        // Build update data with automatic status advancement
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        let newStatus: string | null = null;
        let historyStatus: string;
        let historyNote: string;

        if (paymentType === "sinal") {
          updateData.sinal_paid = true;
          updateData.sinal_paid_at = new Date().toISOString();
          updateData.sinal_payment_method = paymentMethodLabel;
          
          if (isPixPayment) {
            updateData.sinal_pix_transaction_id = paymentId.toString();
          } else {
            updateData.sinal_stripe_payment_id = paymentId.toString();
          }

          // AUTOMATIC STATUS ADVANCEMENT: Sinal paid → DEPOSIT_CONFIRMED
          newStatus = "DEPOSIT_CONFIRMED";
          updateData.current_status = newStatus;
          historyStatus = "DEPOSIT_CONFIRMED";
          historyNote = `Sinal de ${paymentMethodNote} confirmado. Iniciando busca do produto.`;

        } else if (paymentType === "balance") {
          updateData.balance_paid = true;
          updateData.balance_paid_at = new Date().toISOString();
          updateData.balance_payment_method = paymentMethodLabel;
          
          if (isPixPayment) {
            updateData.balance_pix_transaction_id = paymentId.toString();
          } else {
            updateData.balance_stripe_payment_id = paymentId.toString();
          }

          // AUTOMATIC STATUS ADVANCEMENT: Balance paid → FULLY_PAID
          newStatus = "FULLY_PAID";
          updateData.current_status = newStatus;
          historyStatus = "FULLY_PAID";
          historyNote = `Pagamento completo via ${paymentMethodNote}. Preparando envio.`;
        } else {
          historyStatus = "ORDER_CONFIRMED";
          historyNote = `Pagamento via ${paymentMethodNote} confirmado.`;
        }

        // Update order
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
          status: historyStatus,
          notes: historyNote,
        });

        console.log(`Order ${orderId} status updated to: ${newStatus || 'unchanged'}`);

        // ============ NOTIFICATIONS ============

        // 1. Create ADMIN notification
        try {
          await supabase.from("notifications").insert({
            type: "payment_received",
            target: "admin",
            title: `Pagamento ${paymentType === "sinal" ? "do sinal" : "do saldo"} recebido`,
            message: `Pedido ${orderId}: ${paymentMethodNote} - R$ ${(payment.transaction_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            reference_type: "order",
            reference_id: orderId,
          });
          console.log("Admin notification created");
        } catch (notifError) {
          console.error("Failed to create admin notification:", notifError);
        }

        // 2. Create CLIENT notification
        try {
          await supabase.from("notifications").insert({
            type: "payment_received",
            target: "client",
            target_client_cpf: currentOrder.client_cpf,
            title: paymentType === "sinal" 
              ? "Sinal confirmado! Iniciando busca"
              : "Pagamento completo! Preparando envio",
            message: `Seu pagamento de R$ ${(payment.transaction_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi confirmado.`,
            reference_type: "order",
            reference_id: orderId,
          });
          console.log("Client notification created");
        } catch (notifError) {
          console.error("Failed to create client notification:", notifError);
        }

        // ============ EMAIL NOTIFICATION ============
        if (currentOrder.client_email) {
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
                client_name: currentOrder.client_name,
                client_email: currentOrder.client_email,
                product_name: currentOrder.product_name,
                total_price: currentOrder.product_price,
                sinal_value: currentOrder.sinal_value,
                balance_value: currentOrder.balance_value,
                sla_vault_due_date: currentOrder.sla_vault_due_date,
              }),
            });
            console.log(`Email ${emailType} sent to ${currentOrder.client_email}`);
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
          }
        }

        // ============ WHATSAPP NOTIFICATION ============
        if (currentOrder.client_phone) {
          const whatsappType = paymentType === "sinal" ? "sinal_confirmed" : "balance_confirmed";
          
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                order_id: orderId,
                message_type: whatsappType,
              }),
            });
            console.log(`WhatsApp ${whatsappType} sent for order ${orderId}`);
          } catch (whatsappError) {
            console.error("Failed to send WhatsApp:", whatsappError);
          }
        }

        console.log(`Order ${orderId} fully processed - payment: ${paymentType}, status: ${newStatus}`);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
