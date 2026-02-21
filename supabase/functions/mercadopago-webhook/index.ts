import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Calculate protection end: 8 business days from now */
function calcProtectionEnd(): string {
  const d = new Date();
  let biz = 0;
  while (biz < 8) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) biz++;
  }
  return d.toISOString();
}

/** Handle marketplace (MKT-) payments */
async function handleMarketplacePayment(
  supabase: any,
  payment: any,
  externalRef: string,
  paymentId: string | number
) {
  // Format: MKT-{order_code}-pix or MKT-{order_code}-card
  const parts = externalRef.split("-");
  const method = parts[parts.length - 1]; // "pix" or "card"
  // order_code is everything between MKT- and -pix/-card
  const orderCode = parts.slice(1, -1).join("-");

  console.log(`[webhook] Marketplace payment approved: ${orderCode}, method: ${method}`);

  // Find order by order_code
  const { data: order, error: orderErr } = await supabase
    .from("vault_marketplace_orders")
    .select("id, order_code, status, seller_id, seller_payout, buyer_cpf, fee_amount")
    .eq("order_code", orderCode)
    .single();

  if (orderErr || !order) {
    console.error("[webhook] Marketplace order not found:", orderCode, orderErr);
    return;
  }

  if (order.status !== "pending_payment") {
    console.log("[webhook] Order already processed:", order.status);
    return;
  }

  const protEnd = calcProtectionEnd();

  // Update order to paid
  const { error: updateErr } = await supabase
    .from("vault_marketplace_orders")
    .update({
      status: "paid",
      payment_method: method === "pix" ? "pix" : "card",
      mp_payment_id: paymentId.toString(),
      paid_at: new Date().toISOString(),
      protection_ends_at: protEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("[webhook] Failed to update marketplace order:", updateErr);
    return;
  }

  console.log(`[webhook] Marketplace order ${orderCode} marked as paid`);

  // Notify seller to ship
  if (order.seller_id) {
    const { data: seller } = await supabase
      .from("vault_seller_profiles")
      .select("member:vault_members!inner(client_cpf)")
      .eq("id", order.seller_id)
      .single();

    if (seller?.member?.client_cpf) {
      await supabase.from("notifications").insert({
        title: "🎉 Venda confirmada!",
        message: `Pedido ${orderCode} foi pago. Envie o produto em até 3 dias úteis.`,
        target: "client",
        target_client_cpf: seller.member.client_cpf,
        type: "info",
        reference_id: order.id,
        reference_type: "marketplace_order",
      });
    }
  }

  // Notify buyer
  if (order.buyer_cpf) {
    await supabase.from("notifications").insert({
      title: "✅ Pagamento confirmado!",
      message: `Seu pagamento do pedido ${orderCode} foi aprovado. O vendedor será notificado para envio.`,
      target: "client",
      target_client_cpf: order.buyer_cpf,
      type: "info",
      reference_id: order.id,
      reference_type: "marketplace_order",
    });
  }

  // Notify admin
  await supabase.from("notifications").insert({
    title: "💳 Pagamento MKT recebido",
    message: `Pedido ${orderCode} — R$ ${(payment.transaction_amount || 0).toFixed(2)} (taxa: R$ ${(order.fee_amount || 0).toFixed(2)})`,
    target: "admin",
    type: "payment_received",
    reference_id: order.id,
    reference_type: "marketplace_order",
  });
}

/** Handle standard order payments */
async function handleOrderPayment(
  supabase: any,
  supabaseUrl: string,
  supabaseKey: string,
  payment: any,
  externalRef: string,
  paymentId: string | number
) {
  const parts = externalRef.split("-");

  // Check if it's a card payment (ends with -card)
  const isCardPayment = parts[parts.length - 1] === "card";
  if (isCardPayment) {
    parts.pop();
  }

  const paymentType = parts.pop(); // 'sinal', 'balance', or 'full'
  const orderId = parts.join("-");

  if (!orderId || !paymentType) {
    console.error("Invalid external_reference:", externalRef);
    return;
  }

  // Normalize payment type
  const normalizedPaymentType = paymentType === "full" ? "sinal" : paymentType;
  const isFullPayment = paymentType === "full";

  const paymentMethodId = payment.payment_method_id || "";
  const isPixPayment = paymentMethodId === "pix";
  const paymentMethodLabel = isPixPayment ? "PIX" : "CREDIT_CARD";
  const paymentMethodNote = isPixPayment
    ? "Pix"
    : `Cartão de Crédito (${payment.installments || 1}x)`;

  console.log(`Payment approved for order ${orderId}, type: ${paymentType}, method: ${paymentMethodLabel}`);

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (!currentOrder) {
    console.error("Order not found:", orderId);
    return;
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  let newStatus: string | null = null;
  let historyStatus: string;
  let historyNote: string;

  if (normalizedPaymentType === "sinal") {
    updateData.sinal_paid = true;
    updateData.sinal_paid_at = new Date().toISOString();
    updateData.sinal_payment_method = paymentMethodLabel;

    if (isPixPayment) {
      updateData.sinal_pix_transaction_id = paymentId.toString();
    } else {
      updateData.sinal_stripe_payment_id = paymentId.toString();
    }

    if (isFullPayment) {
      updateData.balance_paid = true;
      updateData.balance_paid_at = new Date().toISOString();
      updateData.balance_payment_method = paymentMethodLabel;
      newStatus = "DEPOSIT_CONFIRMED";
      updateData.current_status = newStatus;
      historyStatus = "DEPOSIT_CONFIRMED";
      historyNote = `Pagamento integral via ${paymentMethodNote} confirmado. Iniciando busca do produto.`;
    } else {
      newStatus = "DEPOSIT_CONFIRMED";
      updateData.current_status = newStatus;
      historyStatus = "DEPOSIT_CONFIRMED";
      historyNote = `Sinal de ${paymentMethodNote} confirmado. Iniciando busca do produto.`;
    }
  } else if (normalizedPaymentType === "balance") {
    updateData.balance_paid = true;
    updateData.balance_paid_at = new Date().toISOString();
    updateData.balance_payment_method = paymentMethodLabel;

    if (isPixPayment) {
      updateData.balance_pix_transaction_id = paymentId.toString();
    } else {
      updateData.balance_stripe_payment_id = paymentId.toString();
    }

    newStatus = "FULLY_PAID";
    updateData.current_status = newStatus;
    historyStatus = "FULLY_PAID";
    historyNote = `Pagamento completo via ${paymentMethodNote}. Preparando envio.`;
  } else {
    historyStatus = "ORDER_CONFIRMED";
    historyNote = `Pagamento via ${paymentMethodNote} confirmado.`;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updateData)
    .eq("order_id", orderId);

  if (updateError) {
    console.error("Error updating order:", updateError);
    throw updateError;
  }

  await supabase.from("order_history").insert({
    order_id: orderId,
    status: historyStatus,
    notes: historyNote,
  });

  console.log(`Order ${orderId} status updated to: ${newStatus || "unchanged"}`);

  // ============ NOTIFICATIONS ============
  try {
    await supabase.from("notifications").insert({
      type: "payment_received",
      target: "admin",
      title: `Pagamento ${paymentType === "sinal" ? "do sinal" : "do saldo"} recebido`,
      message: `Pedido ${orderId}: ${paymentMethodNote} - R$ ${(payment.transaction_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      reference_type: "order",
      reference_id: orderId,
    });
  } catch (notifError) {
    console.error("Failed to create admin notification:", notifError);
  }

  try {
    await supabase.from("notifications").insert({
      type: "payment_received",
      target: "client",
      target_client_cpf: currentOrder.client_cpf,
      title: paymentType === "sinal"
        ? "Sinal confirmado! Iniciando busca"
        : "Pagamento completo! Preparando envio",
      message: `Seu pagamento de R$ ${(payment.transaction_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} foi confirmado.`,
      reference_type: "order",
      reference_id: orderId,
    });
  } catch (notifError) {
    console.error("Failed to create client notification:", notifError);
  }

  // ============ EMAIL ============
  if (currentOrder.client_email) {
    const emailType = paymentType === "sinal" ? "sinal_confirmed" : "balance_confirmed";
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
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

  // ============ WHATSAPP ============
  if (currentOrder.client_phone) {
    const whatsappType = paymentType === "sinal" ? "sinal_confirmed" : "balance_confirmed";
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Mercado Pago webhook received:", JSON.stringify(body));

    if (body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!mercadoPagoToken) {
        throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
      }

      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${mercadoPagoToken}` },
        }
      );

      const payment = await mpResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      if (payment.status === "approved") {
        const externalRef = payment.external_reference || "";

        if (externalRef.startsWith("MKT-")) {
          await handleMarketplacePayment(supabase, payment, externalRef, paymentId);
        } else {
          await handleOrderPayment(supabase, supabaseUrl, supabaseKey, payment, externalRef, paymentId);
        }
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
