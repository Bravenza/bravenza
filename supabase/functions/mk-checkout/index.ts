// Marketplace Checkout — Processes PIX or Card payments via MercadoPago
// Calculates platform fee (split) and escrow hold
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

/** Calculate card total with interest: amount / (1 - rate), rounded to 2 decimals */
function calcCardTotal(baseAmount: number, installments: number): number {
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
      payment_method, // "pix" | "card"
      // Card-specific
      card_token,
      installments,
      payer_email,
      payer_identification,
    } = body;

    if (!order_id || !payment_method) {
      return json({ error: "order_id e payment_method são obrigatórios" }, 400);
    }

    // Fetch order
    const { data: order, error: orderErr } = await sb
      .from("vault_marketplace_orders")
      .select("*, listing:vault_marketplace_listings(title)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) return json({ error: "Pedido não encontrado" }, 404);
    if (order.status !== "pending_payment") {
      return json({ error: "Pedido já foi pago ou cancelado" }, 400);
    }

    const totalAmount = (order.sale_price || 0) + (order.shipping_cost || 0) + (order.authentication_fee || 0);
    const productName = order.listing?.title || "Sneaker Marketplace";
    const description = `Bravenza MKT — ${order.order_code} — ${productName}`;

    let paymentResult: any;

    if (payment_method === "pix") {
      // ===== PIX Payment =====
      const pixPayload = {
        transaction_amount: totalAmount,
        payment_method_id: "pix",
        description,
        payer: {
          email: payer_email || order.buyer_email || "cliente@bravenza.com",
        },
        statement_descriptor: "BRAVENZA MKT",
        external_reference: `MKT-${order.order_code}-pix`,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: {
          order_id: order.id,
          order_code: order.order_code,
          source: "marketplace",
          fee_amount: order.fee_amount,
          seller_payout: order.seller_payout,
        },
      };

      console.log("[mk-checkout] Creating PIX payment:", order.order_code, totalAmount);

      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpToken}`,
          "X-Idempotency-Key": `mkt-${order.id}-pix-${Date.now()}`,
        },
        body: JSON.stringify(pixPayload),
      });

      paymentResult = await res.json();
      if (!res.ok) {
        console.error("[mk-checkout] PIX error:", paymentResult);
        return json({ error: "Erro ao gerar PIX. Tente novamente." }, 400);
      }

      // Save PIX data on order
      await sb.from("vault_marketplace_orders").update({
        mp_payment_id: paymentResult.id?.toString(),
        payment_method: "pix",
        pix_transaction_id: paymentResult.id?.toString(),
      }).eq("id", order.id);

      const pixData = paymentResult.point_of_interaction?.transaction_data;

      return json({
        status: paymentResult.status,
        payment_id: paymentResult.id,
        pix_qr_code: pixData?.qr_code_base64 || null,
        pix_copy_paste: pixData?.qr_code || null,
        pix_expiration: pixData?.expiration_date || null,
        total_amount: totalAmount,
        split: {
          seller_payout: order.seller_payout,
          platform_fee: order.fee_amount,
          fee_percent: order.fee_percent,
        },
      });

    } else if (payment_method === "card") {
      // ===== Card Payment =====
      if (!card_token) return json({ error: "Token do cartão obrigatório" }, 400);

      const validInstallments = Math.min(Math.max(1, installments || 1), 12);
      // Apply interest for card payments (same rates as Bravenza)
      const cardTotalAmount = calcCardTotal(totalAmount, validInstallments);

      const cardPayload = {
        transaction_amount: cardTotalAmount,
        token: card_token,
        description,
        installments: validInstallments,
        payment_method_id: "credit_card",
        payer: {
          email: payer_email || order.buyer_email || "cliente@bravenza.com",
          identification: payer_identification,
        },
        statement_descriptor: "BRAVENZA MKT",
        external_reference: `MKT-${order.order_code}-card`,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        metadata: {
          order_id: order.id,
          order_code: order.order_code,
          source: "marketplace",
          fee_amount: order.fee_amount,
          seller_payout: order.seller_payout,
        },
      };

      console.log("[mk-checkout] Creating card payment:", order.order_code, `base=${totalAmount}`, `total=${cardTotalAmount}`, `${validInstallments}x`);

      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpToken}`,
          "X-Idempotency-Key": `mkt-${order.id}-card-${Date.now()}`,
        },
        body: JSON.stringify(cardPayload),
      });

      paymentResult = await res.json();
      if (!res.ok) {
        console.error("[mk-checkout] Card error:", paymentResult);
        const errorMessages: Record<string, string> = {
          cc_rejected_bad_filled_card_number: "Número do cartão inválido",
          cc_rejected_bad_filled_date: "Data de validade inválida",
          cc_rejected_bad_filled_security_code: "Código de segurança inválido",
          cc_rejected_insufficient_amount: "Saldo insuficiente",
          cc_rejected_high_risk: "Pagamento recusado por segurança",
          cc_rejected_other_reason: "Cartão recusado",
        };
        const cause = paymentResult.cause?.[0]?.code;
        return json({ error: errorMessages[cause] || "Erro ao processar cartão" }, 400);
      }

      // Save card payment data
      await sb.from("vault_marketplace_orders").update({
        mp_payment_id: paymentResult.id?.toString(),
        payment_method: "card",
      }).eq("id", order.id);

      // If approved immediately, mark as paid + set protection
      if (paymentResult.status === "approved") {
        const protEnd = calcProtectionEnd();
        await sb.from("vault_marketplace_orders").update({
          status: "paid",
          paid_at: new Date().toISOString(),
          protection_ends_at: protEnd,
        }).eq("id", order.id);

        console.log("[mk-checkout] Card approved, order paid:", order.order_code);
      }

      return json({
        status: paymentResult.status,
        status_detail: paymentResult.status_detail,
        payment_id: paymentResult.id,
        installments: validInstallments,
        total_amount: cardTotalAmount,
        split: {
          seller_payout: order.seller_payout,
          platform_fee: order.fee_amount,
          fee_percent: order.fee_percent,
        },
      });

    } else {
      return json({ error: "Método de pagamento inválido" }, 400);
    }
  } catch (err: any) {
    console.error("[mk-checkout] Error:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
});
