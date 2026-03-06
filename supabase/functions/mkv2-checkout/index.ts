// Marketplace Checkout — Consolidated payment for multiple orders
// Supports PIX or Card via MercadoPago Transparent Checkout
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

/** Mercado Pago interest rates by installment count */
const MP_RATES: Record<number, number> = {
  1: 0, 2: 0.0964, 3: 0.1123, 4: 0.1136, 5: 0.1431, 6: 0.1432,
  7: 0.1672, 8: 0.1673, 9: 0.1969, 10: 0.2065, 11: 0.2066, 12: 0.2211,
};

/** Installment surcharge tiers (seller absorbs this to offer interest-free) */
const INSTALLMENT_SURCHARGES: Record<number, number> = {
  3: 5, 6: 10, 10: 14, 12: 18,
};

/** Get surcharge percent for a given interest_free_installments tier */
function getSurchargePercent(interestFreeMax: number): number {
  if (interestFreeMax <= 0) return 0;
  // Find the matching tier
  const tiers = [3, 6, 10, 12];
  for (const t of tiers) {
    if (interestFreeMax <= t) return INSTALLMENT_SURCHARGES[t];
  }
  return INSTALLMENT_SURCHARGES[12];
}

/** Calculate card total with interest: amount / (1 - rate) */
function calcCardTotal(baseAmount: number, installments: number, interestFreeMax: number = 0): number {
  // If installments are within the seller's interest-free tier, buyer pays no interest
  if (interestFreeMax > 0 && installments <= interestFreeMax) return baseAmount;
  const rate = MP_RATES[installments] || 0;
  if (rate === 0) return baseAmount;
  return Math.round((baseAmount / (1 - rate)) * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!mpToken) return json({ error: "Pagamento indisponível no momento" }, 500);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    const {
      order_id,
      order_ids: rawOrderIds,
      payment_method,
      card_token,
      installments,
      payer_email,
      payer_identification,
      idempotency_key,
      coupon_code,
    } = body;

    // Normalize to array
    const orderIds: string[] = rawOrderIds || (order_id ? [order_id] : []);
    if (orderIds.length === 0 || !payment_method) {
      return json({ error: "order_ids e payment_method são obrigatórios" }, 400);
    }

    // Fetch all orders with their listing's offer info for interest_free_installments
    const { data: orders, error: ordersErr } = await sb
      .from("vault_marketplace_orders")
      .select("*, listing:vault_marketplace_listings(title, interest_free_installments)")
      .in("id", orderIds);

    if (ordersErr || !orders || orders.length === 0) {
      return json({ error: "Pedidos não encontrados" }, 404);
    }

    // Validate all are pending_payment
    const invalidOrders = orders.filter(o => o.status !== "pending_payment");
    if (invalidOrders.length > 0) {
      return json({
        error: `Pedido(s) ${invalidOrders.map(o => o.order_code).join(", ")} já foi/foram pago(s) ou cancelado(s)`,
      }, 400);
    }

    // Determine max interest-free installments across all orders
    const maxInterestFree = orders.reduce((m, o) => {
      const ifMax = o.listing?.interest_free_installments || 0;
      return Math.min(m === -1 ? ifMax : m, ifMax); // Use MIN: all orders must support it
    }, -1);
    const effectiveInterestFree = maxInterestFree === -1 ? 0 : maxInterestFree;

    // Calculate consolidated total
    const totalAmount = orders.reduce((sum, o) => {
      return sum + (o.sale_price || 0) + (o.shipping_cost || 0) + (o.authentication_fee || 0);
    }, 0);

    const orderCodes = orders.map(o => o.order_code).join("+");
    const productNames = orders.map(o => o.listing?.title || "Sneaker").join(", ");
    const description = `Bravenza MKT — ${orderCodes}`;

    // Build consolidated external_reference: MKT-CODE1+CODE2-method
    const externalRef = `MKT-${orderCodes}-${payment_method === "card" ? "card" : "pix"}`;

    let paymentResult: any;

    if (payment_method === "pix") {
      // ===== PIX Payment =====
      const pixPayload = {
        transaction_amount: totalAmount,
        payment_method_id: "pix",
        description: description.slice(0, 256),
        payer: {
          email: payer_email || orders[0].buyer_email || "cliente@bravenza.com",
        },
        statement_descriptor: "BRAVENZA MKT",
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: {
          order_ids: orderIds,
          order_codes: orders.map(o => o.order_code),
          source: "marketplace",
          consolidated: true,
          total_fee: orders.reduce((s, o) => s + (o.fee_amount || 0), 0),
          total_seller_payout: orders.reduce((s, o) => s + (o.seller_payout || 0), 0),
        },
      };

      console.log("[mkv2-checkout] Creating consolidated PIX:", orderCodes, totalAmount);

      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpToken}`,
          "X-Idempotency-Key": idempotency_key || `mkt-${orderIds.sort().join("-")}-pix`,
        },
        body: JSON.stringify(pixPayload),
      });

      paymentResult = await res.json();
      if (!res.ok) {
        console.error("[mkv2-checkout] PIX error:", paymentResult);
        return json({ error: "Erro ao gerar PIX. Tente novamente." }, 400);
      }

      // Save PIX payment ID on all orders
      for (const order of orders) {
        await sb.from("vault_marketplace_orders").update({
          mp_payment_id: paymentResult.id?.toString(),
          payment_method: "pix",
          pix_transaction_id: paymentResult.id?.toString(),
        }).eq("id", order.id);
      }

      const pixData = paymentResult.point_of_interaction?.transaction_data;

      return json({
        status: paymentResult.status,
        payment_id: paymentResult.id,
        pix_qr_code: pixData?.qr_code_base64 || null,
        pix_copy_paste: pixData?.qr_code || null,
        pix_expiration: pixData?.expiration_date || null,
        total_amount: totalAmount,
        order_count: orders.length,
        order_codes: orders.map(o => o.order_code),
      });

    } else if (payment_method === "card") {
      // ===== Card Payment =====
      if (!card_token) return json({ error: "Token do cartão obrigatório" }, 400);

      const validInstallments = Math.min(Math.max(1, installments || 1), 12);
      const cardTotalAmount = calcCardTotal(totalAmount, validInstallments, effectiveInterestFree);
      const isInterestFree = effectiveInterestFree > 0 && validInstallments <= effectiveInterestFree;

      const cardPayload = {
        transaction_amount: cardTotalAmount,
        token: card_token,
        description: description.slice(0, 256),
        installments: validInstallments,
        payment_method_id: "credit_card",
        payer: {
          email: payer_email || orders[0].buyer_email || "cliente@bravenza.com",
          identification: payer_identification,
        },
        statement_descriptor: "BRAVENZA MKT",
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: {
          order_ids: orderIds,
          order_codes: orders.map(o => o.order_code),
          source: "marketplace",
          consolidated: true,
          total_fee: orders.reduce((s, o) => s + (o.fee_amount || 0), 0),
          total_seller_payout: orders.reduce((s, o) => s + (o.seller_payout || 0), 0),
        },
      };

      console.log("[mkv2-checkout] Creating consolidated card:", orderCodes, `base=${totalAmount}`, `total=${cardTotalAmount}`, `${validInstallments}x`);

      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpToken}`,
          "X-Idempotency-Key": idempotency_key || `mkt-${orderIds.sort().join("-")}-card`,
        },
        body: JSON.stringify(cardPayload),
      });

      paymentResult = await res.json();
      if (!res.ok) {
        console.error("[mkv2-checkout] Card error:", paymentResult);
        const errorMessages: Record<string, string> = {
          cc_rejected_bad_filled_card_number: "Número do cartão inválido",
          cc_rejected_bad_filled_date: "Data de validade inválida",
          cc_rejected_bad_filled_security_code: "Código de segurança inválido",
          cc_rejected_insufficient_amount: "Saldo insuficiente",
          cc_rejected_high_risk: "Pagamento recusado por segurança",
          cc_rejected_other_reason: "Cartão recusado",
          cc_rejected_duplicated_payment: "Pagamento duplicado",
          cc_rejected_max_attempts: "Limite de tentativas excedido",
          cc_rejected_card_disabled: "Cartão desabilitado",
        };
        const cause = paymentResult.cause?.[0]?.code;
        return json({ error: errorMessages[cause] || "Erro ao processar cartão" }, 400);
      }

      // Save card payment data on all orders
      for (const order of orders) {
        await sb.from("vault_marketplace_orders").update({
          mp_payment_id: paymentResult.id?.toString(),
          payment_method: "card",
        }).eq("id", order.id);
      }

      // If approved immediately, mark all as paid + set protection
      if (paymentResult.status === "approved") {
        const protEnd = calcProtectionEnd();
        const cancelWindow = new Date();
        cancelWindow.setMinutes(cancelWindow.getMinutes() + 30);
        for (const order of orders) {
          const updateData: Record<string, any> = {
            status: "paid",
            paid_at: new Date().toISOString(),
            protection_ends_at: protEnd,
            cancellation_window_ends_at: cancelWindow.toISOString(),
          };

          // If interest-free, adjust seller fee (surcharge absorbed by seller)
          if (isInterestFree) {
            const surchargePercent = getSurchargePercent(effectiveInterestFree);
            const newFeePercent = (order.fee_percent || 14) + surchargePercent;
            const newFeeAmount = Math.round(order.sale_price * newFeePercent / 100 * 100) / 100;
            const newSellerPayout = Math.round((order.sale_price - newFeeAmount) * 100) / 100;
            updateData.fee_percent = newFeePercent;
            updateData.fee_amount = newFeeAmount;
            updateData.seller_payout = newSellerPayout;
          }

          await sb.from("vault_marketplace_orders").update(updateData).eq("id", order.id);
        }
        console.log("[mkv2-checkout] Card approved, all orders paid:", orderCodes, isInterestFree ? "(interest-free)" : "");
      }

      return json({
        status: paymentResult.status,
        status_detail: paymentResult.status_detail,
        payment_id: paymentResult.id,
        installments: validInstallments,
        total_amount: cardTotalAmount,
        interest_free: isInterestFree,
        interest_free_max: effectiveInterestFree,
        order_count: orders.length,
        order_codes: orders.map(o => o.order_code),
      });

    } else {
      return json({ error: "Método de pagamento inválido" }, 400);
    }
  } catch (err: any) {
    console.error("[mkv2-checkout] Error:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
});
