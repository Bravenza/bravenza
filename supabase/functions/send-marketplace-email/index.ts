import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type MarketplaceEmailType =
  | "mk_purchase_confirmed"
  | "mk_new_sale"
  | "mk_seller_shipped"
  | "mk_delivery_confirmed"
  | "mk_inspection_result"
  | "mk_payout_released"
  | "mk_dispute_opened"
  | "mk_dispute_resolved"
  | "mk_watchlist_match"
  | "mk_offer_received"
  | "mk_offer_accepted"
  | "mk_offer_counter"
  | "mk_order_cancelled"
  | "mk_shipping_reminder"
  | "mk_protection_expiring"
  | "mk_review_request"
  | "mk_stale_listing"
  | "mk_subscription_expiring"
  | "mk_offer_rejected"
  | "mk_payment_confirmed"
  | "mk_kyc_approved"
  | "mk_kyc_rejected"
  | "community_welcome"
  | "community_post_reported"
  | "community_new_follower"
  | "community_post_comment"
  | "order_request_received"
  | "budget_rejected";

interface MarketplaceEmailRequest {
  type: MarketplaceEmailType;
  recipient_name: string;
  recipient_email: string;
  order_code?: string;
  product_name?: string;
  price?: number;
  size?: string;
  condition?: string;
  seller_name?: string;
  buyer_name?: string;
  tracking_code?: string;
  carrier?: string;
  shipping_mode?: string;
  inspection_result?: "approved" | "rejected";
  rejection_reason?: string;
  payout_amount?: number;
  payout_method?: string;
  dispute_reason?: string;
  dispute_opened_by?: string;
  dispute_resolution?: string;
  watchlist_product_name?: string;
  watchlist_price?: number;
  watchlist_size?: string;
  post_title?: string;
  report_reason?: string;
  reporter_name?: string;
  member_tier?: string;
  offer_price?: number;
  counter_price?: number;
  counter_message?: string;
  listing_title?: string;
  cancel_reason?: string;
  refund_amount?: number;
  days_pending?: number;
  protection_expires_at?: string;
  review_link?: string;
  follower_name?: string;
  comment_author?: string;
  comment_preview?: string;
  order_id?: string;
  client_name?: string;
  product_brand?: string;
  product_model?: string;
  shoe_size?: string;
  listing_price?: number;
  listing_views?: number;
  days_active?: number;
  plan_name?: string;
  expires_at?: string;
  kyc_rejection_reason?: string;
  payment_amount?: number;
  payment_method_label?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getSubject = (type: MarketplaceEmailType, data: MarketplaceEmailRequest): string => {
  const subjects: Record<MarketplaceEmailType, string> = {
    mk_purchase_confirmed: `Compra confirmada! - ${data.order_code}`,
    mk_new_sale: `🎉 Nova venda! - ${data.order_code}`,
    mk_seller_shipped: `Produto enviado! - ${data.order_code}`,
    mk_delivery_confirmed: `Entrega confirmada! - ${data.order_code}`,
    mk_inspection_result: `Resultado da inspeção - ${data.order_code}`,
    mk_payout_released: `💰 Pagamento liberado! - ${data.order_code}`,
    mk_dispute_opened: `⚠️ Disputa aberta - ${data.order_code}`,
    mk_dispute_resolved: `✅ Disputa resolvida - ${data.order_code}`,
    mk_watchlist_match: `🔔 Produto da sua lista disponível!`,
    mk_offer_received: `💰 Nova oferta recebida - "${data.listing_title}"`,
    mk_offer_accepted: `✅ Sua oferta foi aceita! - "${data.listing_title}"`,
    mk_offer_counter: `🔄 Contra-proposta recebida - "${data.listing_title}"`,
    mk_order_cancelled: `❌ Pedido cancelado - ${data.order_code}`,
    mk_shipping_reminder: `⚠️ Envio pendente! - ${data.order_code}`,
    mk_protection_expiring: `🛡️ Proteção expirando - ${data.order_code}`,
    mk_review_request: `⭐ Como foi sua compra? - ${data.order_code}`,
    mk_stale_listing: `📉 Seu anúncio precisa de atenção`,
    mk_subscription_expiring: `⏰ Seu plano está expirando!`,
    mk_offer_rejected: `❌ Sua oferta não foi aceita - "${data.listing_title}"`,
    mk_payment_confirmed: `✅ Pagamento confirmado! - ${data.order_code}`,
    mk_kyc_approved: `✅ Cadastro de vendedor aprovado!`,
    mk_kyc_rejected: `⚠️ Documentos do cadastro precisam de atenção`,
    community_welcome: `👋 Bem-vindo à Comunidade Bravenza!`,
    community_post_reported: `🚩 Post reportado na comunidade`,
    community_new_follower: `👤 Novo seguidor na comunidade!`,
    community_post_comment: `💬 Novo comentário no seu post!`,
    order_request_received: `📋 Solicitação recebida! - ${data.order_id}`,
    budget_rejected: `Orçamento recusado - ${data.order_id}`,
  };
  return subjects[type];
};

const wrapper = (subtitle: string, firstName: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bravenza</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #0a0a0a;">BRAVENZA</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #333;">${subtitle}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 24px;">
        Olá, <strong>${firstName}</strong>!
      </p>
      ${content}
    </div>
    <div style="background-color: #111; padding: 24px; text-align: center; border-top: 1px solid #333;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Bravenza. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
`;

const successBanner = (text: string) => `
  <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="color: #4ade80; font-size: 14px; margin: 0;">✓ ${text}</p>
  </div>`;

const warningBanner = (text: string) => `
  <div style="background-color: #3d2a0a; border: 1px solid #d4af37; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="color: #ff9500; font-size: 14px; margin: 0;">⚠️ ${text}</p>
  </div>`;

const ctaButton = (text: string, url: string) => `
  <div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      ${text}
    </a>
  </div>`;

const infoCard = (label: string, value: string) => `
  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
    <span style="color: #a0a0a0;">${label}</span>
    <span style="color: #ffffff; font-weight: 600;">${value}</span>
  </div>`;

const getEmailHtml = (type: MarketplaceEmailType, data: MarketplaceEmailRequest): string => {
  const firstName = data.recipient_name.split(" ")[0];
  const appUrl = "https://bravenza.lovable.app";

  const templates: Record<MarketplaceEmailType, { subtitle: string; content: string }> = {
    // ===== MARKETPLACE CORE =====
    mk_purchase_confirmed: {
      subtitle: "Compra Confirmada! 🛒",
      content: `
        ${successBanner("Sua compra foi confirmada com sucesso!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi processado.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Produto", data.product_name || "-")}
          ${infoCard("Tamanho", data.size || "-")}
          ${infoCard("Condição", data.condition || "-")}
          <div style="border-top: 1px solid #333; padding-top: 12px; margin-top: 12px;">
            ${infoCard("Valor Total", formatCurrency(data.price || 0))}
          </div>
        </div>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          ${data.shipping_mode === "bravenza" 
            ? "O vendedor enviará o produto ao Hub Bravenza para inspeção antes do envio a você."
            : "O vendedor enviará o produto diretamente a você."}
        </p>
        ${ctaButton("Acompanhar Pedido", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_new_sale: {
      subtitle: "Nova Venda! 🎉",
      content: `
        ${successBanner("Parabéns! Você realizou uma venda!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi confirmado pelo comprador.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Produto", data.product_name || "-")}
          ${infoCard("Tamanho", data.size || "-")}
          ${infoCard("Valor da Venda", formatCurrency(data.price || 0))}
          ${infoCard("Comprador", data.buyer_name || "-")}
        </div>
        <p style="color: #ff9500; font-size: 14px; margin: 0 0 16px; line-height: 1.6; text-align: center;">
          ⏰ Envie o produto em até <strong>3 dias úteis</strong> 
          ${data.shipping_mode === "bravenza" ? "ao Hub Bravenza" : "ao comprador"}.
        </p>
        ${ctaButton("Ver Detalhes da Venda", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_seller_shipped: {
      subtitle: "Produto Enviado! 📦",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O vendedor enviou o produto do pedido <strong style="color: #d4af37;">${data.order_code}</strong>.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Produto", data.product_name || "-")}
          ${data.tracking_code ? infoCard("Rastreio", data.tracking_code) : ""}
          ${data.carrier ? infoCard("Transportadora", data.carrier) : ""}
        </div>
        ${data.shipping_mode === "bravenza" 
          ? `<p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
              O produto será inspecionado no Hub Bravenza antes de ser enviado a você.
            </p>`
          : `<p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
              O produto está a caminho! Acompanhe pelo código de rastreio.
            </p>`
        }
        ${ctaButton("Acompanhar Pedido", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_delivery_confirmed: {
      subtitle: "Entrega Confirmada! ✅",
      content: `
        ${successBanner("Entrega confirmada com sucesso!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi marcado como entregue.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #fff; font-size: 16px; margin: 0 0 8px;">🛡️ Proteção de Compra</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Você tem <strong style="color: #d4af37;">7 dias</strong> para abrir uma disputa caso haja algum problema.
          </p>
        </div>
        ${ctaButton("Ver Pedido", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_inspection_result: {
      subtitle: data.inspection_result === "approved" ? "Inspeção Aprovada! ✓" : "Resultado da Inspeção ⚠️",
      content: data.inspection_result === "approved" ? `
        ${successBanner("O produto passou na inspeção do Hub Bravenza!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O produto do pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi verificado e aprovado. 
          Ele será enviado a você em breve.
        </p>
        ${ctaButton("Acompanhar Pedido", `${appUrl}/vault/marketplace`)}
      ` : `
        ${warningBanner("O produto não passou na inspeção.")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Infelizmente, o produto do pedido <strong style="color: #d4af37;">${data.order_code}</strong> 
          não foi aprovado na inspeção.
        </p>
        ${data.rejection_reason ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Motivo:</p>
            <p style="color: #fff; font-size: 15px; margin: 0;">${data.rejection_reason}</p>
          </div>
        ` : ""}
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          O valor será estornado integralmente. Entre em contato se tiver dúvidas.
        </p>
        ${ctaButton("Ver Detalhes", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_payout_released: {
      subtitle: "Pagamento Liberado! 💰",
      content: `
        ${successBanner("Seu pagamento foi liberado!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          A transação do pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi finalizada.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Valor Liberado:</p>
          <p style="color: #d4af37; font-size: 28px; font-weight: bold; margin: 0;">
            ${formatCurrency(data.payout_amount || 0)}
          </p>
          ${data.payout_method ? `<p style="color: #a0a0a0; font-size: 12px; margin: 8px 0 0;">Via: ${data.payout_method}</p>` : ""}
        </div>
        <p style="color: #a0a0a0; font-size: 14px; text-align: center; margin: 0; line-height: 1.6;">
          O valor será transferido para sua conta em até 2 dias úteis.
        </p>
      `,
    },

    // ===== DISPUTES =====
    mk_dispute_opened: {
      subtitle: "Disputa Aberta ⚠️",
      content: `
        ${warningBanner("Uma disputa foi aberta para o pedido " + (data.order_code || ""))}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          ${data.dispute_opened_by || "O outro participante"} abriu uma disputa para o pedido 
          <strong style="color: #d4af37;">${data.order_code}</strong>.
        </p>
        ${data.dispute_reason ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Motivo da Disputa:</p>
            <p style="color: #fff; font-size: 15px; margin: 0;">${data.dispute_reason}</p>
          </div>
        ` : ""}
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Nossa equipe irá mediar a situação. Você será notificado sobre o resultado.
        </p>
        ${ctaButton("Ver Disputa", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_dispute_resolved: {
      subtitle: "Disputa Resolvida ✅",
      content: `
        ${successBanner("A disputa do pedido " + (data.order_code || "") + " foi resolvida.")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          A disputa do pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi analisada e resolvida pela equipe Bravenza.
        </p>
        ${data.dispute_resolution ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Resolução:</p>
            <p style="color: #fff; font-size: 15px; margin: 0;">${data.dispute_resolution}</p>
          </div>
        ` : ""}
        ${ctaButton("Ver Detalhes", `${appUrl}/vault/marketplace`)}
      `,
    },

    // ===== OFFERS =====
    mk_offer_received: {
      subtitle: "Nova Oferta Recebida! 💰",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Você recebeu uma nova oferta pelo seu anúncio <strong style="color: #d4af37;">"${data.listing_title || data.product_name || ""}"</strong>!
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Valor da Oferta:</p>
          <p style="color: #d4af37; font-size: 28px; font-weight: bold; margin: 0;">
            ${formatCurrency(data.offer_price || 0)}
          </p>
          ${data.buyer_name ? `<p style="color: #a0a0a0; font-size: 12px; margin: 8px 0 0;">De: ${data.buyer_name}</p>` : ""}
        </div>
        <p style="color: #ff9500; font-size: 14px; text-align: center; margin: 0 0 16px;">
          ⏰ Responda rapidamente para não perder o comprador!
        </p>
        ${ctaButton("Ver Oferta", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_offer_accepted: {
      subtitle: "Oferta Aceita! ✅",
      content: `
        ${successBanner("Sua oferta foi aceita pelo vendedor!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Sua oferta de <strong style="color: #d4af37;">${formatCurrency(data.offer_price || 0)}</strong> pelo 
          <strong style="color: #fff;">"${data.listing_title || data.product_name || ""}"</strong> foi aceita!
        </p>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Finalize a compra para garantir o produto. O anúncio ficará reservado por tempo limitado.
        </p>
        ${ctaButton("Finalizar Compra", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_offer_counter: {
      subtitle: "Contra-Proposta Recebida! 🔄",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O vendedor fez uma contra-proposta pelo <strong style="color: #fff;">"${data.listing_title || data.product_name || ""}"</strong>.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Sua Oferta", formatCurrency(data.offer_price || 0))}
          <div style="border-top: 1px solid #333; padding-top: 12px; margin-top: 12px;">
            ${infoCard("Contra-Proposta", formatCurrency(data.counter_price || 0))}
          </div>
          ${data.counter_message ? `
            <p style="color: #a0a0a0; font-size: 13px; margin: 12px 0 0; font-style: italic;">
              "${data.counter_message}"
            </p>
          ` : ""}
        </div>
        ${ctaButton("Responder Oferta", `${appUrl}/vault/marketplace`)}
      `,
    },

    // ===== ORDER LIFECYCLE =====
    mk_order_cancelled: {
      subtitle: "Pedido Cancelado ❌",
      content: `
        ${warningBanner("Pedido " + (data.order_code || "") + " foi cancelado.")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi cancelado.
        </p>
        ${data.cancel_reason ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Motivo:</p>
            <p style="color: #fff; font-size: 15px; margin: 0;">${data.cancel_reason}</p>
          </div>
        ` : ""}
        ${data.refund_amount ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Reembolso:</p>
            <p style="color: #4ade80; font-size: 24px; font-weight: bold; margin: 0;">
              ${formatCurrency(data.refund_amount)}
            </p>
          </div>
        ` : ""}
        <p style="color: #a0a0a0; font-size: 14px; margin: 0; line-height: 1.6;">
          Se tiver dúvidas, entre em contato conosco.
        </p>
      `,
    },
    mk_shipping_reminder: {
      subtitle: "Envio Pendente! ⚠️",
      content: `
        ${warningBanner("Você tem um envio pendente há " + (data.days_pending || 3) + " dias!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O pedido <strong style="color: #d4af37;">${data.order_code}</strong> precisa ser enviado o mais rápido possível.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Produto", data.product_name || "-")}
          ${infoCard("Destino", data.shipping_mode === "bravenza" ? "Hub Bravenza (PRO)" : "Comprador (Direto)")}
          ${infoCard("Dias desde pagamento", `${data.days_pending || 3} dias`)}
        </div>
        <p style="color: #ff9500; font-size: 14px; text-align: center; margin: 0 0 16px; line-height: 1.6;">
          ⚠️ Atrasos recorrentes afetam seu tier e reputação de vendedor.
        </p>
        ${ctaButton("Marcar como Enviado", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_protection_expiring: {
      subtitle: "Proteção Expirando! 🛡️",
      content: `
        ${warningBanner("Sua janela de proteção de compra está expirando!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O prazo de proteção do pedido <strong style="color: #d4af37;">${data.order_code}</strong> 
          expira em <strong style="color: #ff9500;">${data.protection_expires_at || "breve"}</strong>.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #fff; font-size: 16px; margin: 0 0 8px;">⏰ Ação necessária</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Se houver qualquer problema com o produto, abra uma disputa <strong>antes</strong> do prazo expirar.
            Após a expiração, o pagamento será liberado automaticamente ao vendedor.
          </p>
        </div>
        ${ctaButton("Ver Pedido", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_review_request: {
      subtitle: "Avalie sua Compra! ⭐",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi finalizado com sucesso!
          Que tal compartilhar sua experiência?
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #fff; font-size: 40px; margin: 0 0 8px;">⭐⭐⭐⭐⭐</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Sua avaliação ajuda outros compradores e recompensa bons vendedores!
          </p>
        </div>
        ${ctaButton("Avaliar Agora", data.review_link || `${appUrl}/vault/marketplace`)}
      `,
    },

    // ===== WATCHLIST =====
    mk_watchlist_match: {
      subtitle: "Produto da sua Lista Disponível! 🔔",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Um produto que você está acompanhando foi listado no marketplace!
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Produto", data.watchlist_product_name || "-")}
          ${data.watchlist_size ? infoCard("Tamanho", data.watchlist_size) : ""}
          ${data.watchlist_price ? infoCard("Preço", formatCurrency(data.watchlist_price)) : ""}
        </div>
        <p style="color: #ff9500; font-size: 14px; text-align: center; margin: 0 0 16px;">
          ⏰ Produtos populares são vendidos rapidamente!
        </p>
        ${ctaButton("Ver Anúncio", `${appUrl}/vault/marketplace`)}
      `,
    },

    // ===== STALE LISTING =====
    mk_stale_listing: {
      subtitle: "Anúncio com Poucas Visualizações 📉",
      content: `
        ${warningBanner("Seu anúncio está ativo há " + (data.days_active || 14) + " dias com poucas visualizações.")}
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Preço Atual", formatCurrency(data.listing_price || 0))}
          ${infoCard("Visualizações", String(data.listing_views || 0))}
          ${infoCard("Dias Ativo", (data.days_active || 14) + " dias")}
        </div>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Considere <strong style="color: #d4af37;">reduzir o preço</strong> ou melhorar as fotos para atrair mais compradores.
        </p>
        ${ctaButton("Editar Anúncio", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_subscription_expiring: {
      subtitle: "Plano Expirando! ⏰",
      content: `
        ${warningBanner("Seu plano " + (data.plan_name || "") + " expira em " + (data.expires_at || "breve") + "!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Renove para manter seus benefícios: destaque na busca, boost slots, taxa reduzida e mais.
        </p>
        ${ctaButton("Renovar Plano", `${appUrl}/marketplace/planos`)}
      `,
    },
    mk_offer_rejected: {
      subtitle: "Oferta Não Aceita ❌",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Sua oferta de <strong style="color: #d4af37;">${formatCurrency(data.offer_price || 0)}</strong> pelo 
          <strong style="color: #fff;">"${data.listing_title || ""}"</strong> não foi aceita pelo vendedor.
        </p>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Que tal tentar um valor diferente ou explorar outros anúncios?
        </p>
        ${ctaButton("Ver Mais Anúncios", `${appUrl}/marketplace`)}
      `,
    },
    mk_payment_confirmed: {
      subtitle: "Pagamento Confirmado! ✅",
      content: `
        ${successBanner("Pagamento processado com sucesso!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          O pagamento do pedido <strong style="color: #d4af37;">${data.order_code}</strong> foi confirmado.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${infoCard("Valor", formatCurrency(data.payment_amount || data.price || 0))}
          ${data.payment_method_label ? infoCard("Método", data.payment_method_label) : ""}
          ${data.product_name ? infoCard("Produto", data.product_name) : ""}
        </div>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          O vendedor foi notificado e enviará o produto em até <strong style="color: #d4af37;">3 dias úteis</strong>.
        </p>
        ${ctaButton("Acompanhar Pedido", `${appUrl}/vault/marketplace`)}
      `,
    },
    mk_kyc_approved: {
      subtitle: "Cadastro Aprovado! ✅",
      content: `
        ${successBanner("Parabéns! Sua verificação de identidade foi aprovada!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Agora você pode publicar anúncios e vender no marketplace Bravenza.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #fff; font-size: 40px; margin: 0 0 8px;">🎉</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Personalize sua loja e publique seu primeiro anúncio!
          </p>
        </div>
        ${ctaButton("Ir para Minha Loja", `${appUrl}/marketplace/minha-loja`)}
      `,
    },
    mk_kyc_rejected: {
      subtitle: "Documentos Precisam de Atenção ⚠️",
      content: `
        ${warningBanner("Sua verificação de identidade não foi aprovada.")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Infelizmente, seus documentos não atenderam aos nossos critérios de verificação.
        </p>
        ${data.kyc_rejection_reason ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Motivo:</p>
            <p style="color: #fff; font-size: 15px; margin: 0;">${data.kyc_rejection_reason}</p>
          </div>
        ` : ""}
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Você pode enviar novos documentos para uma nova análise.
        </p>
        ${ctaButton("Reenviar Documentos", `${appUrl}/marketplace/minha-loja`)}
      `,
    },

    // ===== COMMUNITY =====
    community_welcome: {
      subtitle: "Bem-vindo à Comunidade! 👋",
      content: `
        ${successBanner("Você agora faz parte da comunidade Bravenza!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          A comunidade é o espaço para conectar-se com outros entusiastas de sneakers, 
          compartilhar coleções e descobrir tendências.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #fff; font-size: 16px; margin: 0 0 16px; font-weight: bold;">✨ O que você pode fazer:</p>
          <ul style="color: #a0a0a0; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
             <li>Publicar fotos e textos sobre sua coleção</li>
            <li>Conectar-se com outros membros e colecionadores</li>
            <li>Participar de discussões sobre o universo dos sneakers</li>
            <li>Ficar por dentro de drops e lançamentos</li>
          </ul>
        </div>
        ${ctaButton("Acessar Comunidade", `${appUrl}/vault/comunidade`)}
      `,
    },
    community_post_reported: {
      subtitle: "Post Reportado 🚩",
      content: `
        ${warningBanner("Um post foi reportado na comunidade")}
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${data.post_title ? infoCard("Post", data.post_title) : ""}
          ${data.reporter_name ? infoCard("Reportado por", data.reporter_name) : ""}
          ${data.report_reason ? infoCard("Motivo", data.report_reason) : ""}
        </div>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Revise o conteúdo reportado e tome as medidas necessárias.
        </p>
        ${ctaButton("Revisar no Painel Admin", `${appUrl}/admin/vault-community`)}
      `,
    },
    community_new_follower: {
      subtitle: "Novo Seguidor! 👤",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          <strong style="color: #d4af37;">${data.follower_name || "Alguém"}</strong> começou a seguir você na comunidade Bravenza!
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #fff; font-size: 40px; margin: 0 0 8px;">🤝</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Continue compartilhando sua paixão por sneakers para crescer sua rede!
          </p>
        </div>
        ${ctaButton("Ver Perfil", `${appUrl}/vault/comunidade`)}
      `,
    },
    community_post_comment: {
      subtitle: "Novo Comentário! 💬",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          <strong style="color: #d4af37;">${data.comment_author || "Alguém"}</strong> comentou no seu post${data.post_title ? ` "${data.post_title}"` : ""}!
        </p>
        ${data.comment_preview ? `
          <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 3px solid #d4af37;">
            <p style="color: #fff; font-size: 14px; margin: 0; font-style: italic;">
              "${data.comment_preview}"
            </p>
          </div>
        ` : ""}
        ${ctaButton("Ver Comentário", `${appUrl}/vault/comunidade`)}
      `,
    },

    // ===== ORDERS (CURADORIA) =====
    order_request_received: {
      subtitle: "Solicitação Recebida! 📋",
      content: `
        ${successBanner("Sua solicitação de pedido foi recebida com sucesso!")}
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Recebemos sua solicitação e nossa equipe irá analisar os detalhes para preparar seu orçamento personalizado.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          ${data.product_brand ? infoCard("Marca", data.product_brand) : ""}
          ${data.product_model ? infoCard("Modelo", data.product_model) : ""}
          ${data.shoe_size ? infoCard("Tamanho", data.shoe_size) : ""}
        </div>
        <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Você receberá um email com o orçamento assim que ele estiver pronto. Prazo estimado: <strong style="color: #d4af37;">24-48 horas</strong>.
        </p>
        ${ctaButton("Acompanhar na Minha Conta", `${appUrl}/minha-conta`)}
      `,
    },
    budget_rejected: {
      subtitle: "Orçamento Recusado",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Entendemos que o orçamento do pedido <strong style="color: #d4af37;">${data.order_id}</strong> 
          não atendeu suas expectativas neste momento.
        </p>
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #fff; font-size: 16px; margin: 0 0 8px;">Podemos ajudar!</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Se deseja explorar outras opções ou precisa de um modelo diferente, ficaremos felizes em ajudar.
          </p>
        </div>
        ${ctaButton("Fazer Nova Solicitação", `${appUrl}/solicitar`)}
      `,
    },
  };

  const template = templates[type];
  return wrapper(template.subtitle, firstName, template.content);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping marketplace email");
      return new Response(
        JSON.stringify({ message: "Email não configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const resend = new Resend(resendKey);
    const data: MarketplaceEmailRequest = await req.json();

    const subject = getSubject(data.type, data);
    const html = getEmailHtml(data.type, data);

    console.log(`[send-marketplace-email] Sending ${data.type} to ${data.recipient_email}`);

    const { data: emailData, error } = await resend.emails.send({
      from: "Bravenza <noreply@bravenza.com.br>",
      to: [data.recipient_email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("[send-marketplace-email] Email sent:", emailData);
    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[send-marketplace-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
