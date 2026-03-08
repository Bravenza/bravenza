import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceOrAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WhatsAppRequest {
  order_id?: string;
  message_type: "budget_sent" | "budget_expiring" | "sinal_confirmed" | "sinal_reminder" | "balance_confirmed" | "status_update" | "review_request" | "referral_confirmed" | "cashback_expiring" | "vault_welcome" | "custom"
    | "mk_purchase_confirmed" | "mk_new_sale" | "mk_seller_shipped" | "mk_delivery_confirmed"
    | "mk_dispute_opened" | "mk_dispute_resolved" | "mk_payout_released" | "mk_payment_confirmed"
    | "mk_kyc_approved" | "mk_kyc_rejected" | "mk_review_request"
    | "mk_hub_received" | "mk_hub_shipped_to_buyer" | "mk_shipping_reminder"
    | "mk_order_cancelled" | "mk_inspection_result"
    | "mk_offer_received" | "mk_offer_accepted" | "mk_offer_rejected" | "mk_offer_counter"
    | "mk_watchlist_match" | "mk_protection_expiring" | "mk_stale_listing" | "mk_subscription_expiring";
  custom_message?: string;
  // For referral notifications
  referrer_phone?: string;
  referrer_name?: string;
  referred_name?: string;
  discount_percentage?: number;
  referral_code?: string;
  // For cashback expiration
  days_until_expiration?: number;
  cashback_amount?: number;
  // For vault welcome
  member_name?: string;
  member_phone?: string;
  member_tier?: string;
  // For marketplace notifications
  recipient_phone?: string;
  recipient_name?: string;
  order_code?: string;
  product_name?: string;
  price?: number;
  buyer_name?: string;
  seller_name?: string;
  tracking_code?: string;
  shipping_mode?: string;
  dispute_reason?: string;
  payout_amount?: number;
  payment_amount?: number;
  payment_method_label?: string;
  kyc_rejection_reason?: string;
}

// Message templates
const MESSAGE_TEMPLATES: Record<string, (data: any) => string> = {
  budget_sent: (data) => 
    `🔔 *Olá ${data.client_name}!*\n\n` +
    `Seu orçamento para *${data.product_name}* está pronto!\n\n` +
    `💰 Valor: R$ ${data.product_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Acesse o link abaixo para aprovar:\n${data.budget_url}\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  budget_expiring: (data) =>
    `⏰ *Último Dia, ${data.client_name}!*\n\n` +
    `Seu orçamento para *${data.product_name}* expira amanhã!\n\n` +
    `💰 Valor: R$ ${data.product_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Não perca essa oportunidade!\n` +
    `Aprove agora: ${data.budget_url}\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  sinal_confirmed: (data) =>
    `✅ *Pagamento Confirmado!*\n\n` +
    `Olá ${data.client_name}, recebemos o sinal do seu pedido *${data.order_id}*.\n\n` +
    `📦 Produto: ${data.product_name}\n` +
    `💰 Sinal: R$ ${data.sinal_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Já estamos trabalhando na sua encomenda!\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  sinal_reminder: (data) =>
    `⏰ *Lembrete: Pagamento do Sinal*\n\n` +
    `Olá ${data.client_name}!\n\n` +
    `Você aprovou o orçamento do pedido *${data.order_id}*, mas ainda não pagou o sinal.\n\n` +
    `📦 Produto: ${data.product_name}\n` +
    `💰 Sinal: R$ ${data.sinal_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Pague agora para iniciarmos a busca!\n` +
    `Acesse: https://bravenza.com.br/minha-conta\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  balance_confirmed: (data) =>
    `✅ *Pagamento Final Confirmado!*\n\n` +
    `Olá ${data.client_name}, recebemos o pagamento completo do pedido *${data.order_id}*.\n\n` +
    `📦 Produto: ${data.product_name}\n` +
    `💰 Saldo: R$ ${data.balance_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Seu produto será enviado em breve!\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  status_update: (data) =>
    `📦 *Atualização do Pedido ${data.order_id}*\n\n` +
    `Olá ${data.client_name}!\n\n` +
    `Novo status: *${data.status_label}*\n` +
    `${data.notes ? `📝 ${data.notes}\n` : ''}` +
    `${data.tracking ? `🚚 Rastreio: ${data.tracking}\n` : ''}\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  review_request: (data) =>
    `⭐ *Avalie sua Experiência!*\n\n` +
    `Olá ${data.client_name}!\n\n` +
    `Seu pedido *${data.order_id}* foi entregue! 🎉\n\n` +
    `Como foi sua experiência com o *${data.product_name}*?\n\n` +
    `Sua opinião é muito importante para nós! Avalie em apenas 1 minuto:\n` +
    `${data.review_url}\n\n` +
    `Obrigado por escolher a Bravenza! ❤️\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  referral_confirmed: (data) =>
    `🎉 *Parabéns, ${data.referrer_name}!*\n\n` +
    `Sua indicação foi confirmada! 🎁\n\n` +
    `Seu amigo(a) *${data.referred_name}* acabou de fazer uma compra usando seu código de indicação.\n\n` +
    `💰 Você ganhou *${data.discount_percentage || 5}% de desconto* no seu próximo pedido!\n\n` +
    `📱 Seu código: *${data.referral_code}*\n` +
    `Continue indicando e acumule mais descontos!\n\n` +
    `Acesse sua conta para ver suas indicações:\nhttps://bravenza.com.br/minha-conta\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  cashback_expiring: (data) =>
    `⏰ *Atenção, ${data.referrer_name}!*\n\n` +
    `Seu cashback está prestes a expirar! ⚠️\n\n` +
    `Você tem *${data.cashback_amount || data.discount_percentage || 5}% de desconto* acumulado que expira em *${data.days_until_expiration || 7} dias*.\n\n` +
    `💰 Use antes que perca!\n` +
    `O desconto pode ser aplicado no seu próximo pedido (limite de 25% do valor total).\n\n` +
    `🛒 Faça um novo pedido: https://bravenza.com.br/solicitar\n\n` +
    `_Bravenza - Sua loja de sneakers premium_`,

  vault_welcome: (data) =>
    `🏆 *Bem-vindo ao Vault Club, ${data.member_name || data.referrer_name}!*\n\n` +
    `Você agora faz parte do clube exclusivo da Bravenza! 🎉\n\n` +
    `✨ *Seus benefícios:*\n` +
    `• Curadoria Premium de peças raras\n` +
    `• SLA garantido em todas as buscas\n` +
    `• Match Room para comparar opções\n` +
    `• Certificados de autenticidade\n` +
    `• Conteúdo exclusivo Vault Intel\n\n` +
    `Acesse agora e adicione sua primeira wishlist!\n` +
    `https://bravenza.com.br/vault\n\n` +
    `_Bravenza Vault Club - Exclusividade Premium_`,

  // ===== MARKETPLACE TEMPLATES =====
  mk_purchase_confirmed: (data: any) =>
    `✅ *Compra Confirmada!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `Seu pedido *${data.order_code}* foi confirmado.\n\n` +
    `📦 Produto: ${data.product_name || "-"}\n` +
    `💰 Valor: R$ ${(data.price || 0).toFixed(2)}\n\n` +
    `O vendedor tem até 3 dias úteis para enviar.\n` +
    `Acompanhe: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_new_sale: (data: any) =>
    `🎉 *Nova Venda!*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Pedido *${data.order_code}* confirmado pelo comprador *${data.buyer_name || ""}*.\n\n` +
    `📦 Produto: ${data.product_name || "-"}\n` +
    `💰 Valor: R$ ${(data.price || 0).toFixed(2)}\n\n` +
    `⏰ Envie em até *3 dias úteis*${data.shipping_mode === "bravenza" ? " ao Hub Bravenza" : ""}.\n\n` +
    `_Bravenza Marketplace_`,

  mk_seller_shipped: (data: any) =>
    `📦 *Produto Enviado!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `O vendedor enviou o produto do pedido *${data.order_code}*.\n\n` +
    `${data.tracking_code ? `🚚 Rastreio: ${data.tracking_code}\n` : ""}` +
    `${data.shipping_mode === "bravenza" ? "O produto será inspecionado no Hub Bravenza antes do envio a você.\n" : "O produto está a caminho!\n"}\n` +
    `_Bravenza Marketplace_`,

  mk_delivery_confirmed: (data: any) =>
    `✅ *Entrega Confirmada!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `Pedido *${data.order_code}* foi entregue!\n\n` +
    `🛡️ Você tem *7 dias* para abrir uma disputa caso haja algum problema.\n\n` +
    `_Bravenza Marketplace_`,

  mk_dispute_opened: (data: any) =>
    `⚠️ *Disputa Aberta*\n\n` +
    `Olá ${data.recipient_name || ""}!\n\n` +
    `Uma disputa foi aberta para o pedido *${data.order_code}*.\n\n` +
    `${data.dispute_reason ? `📝 Motivo: ${data.dispute_reason}\n\n` : ""}` +
    `Nossa equipe irá mediar a situação.\n\n` +
    `_Bravenza Marketplace_`,

  mk_dispute_resolved: (data: any) =>
    `✅ *Disputa Resolvida*\n\n` +
    `Olá ${data.recipient_name || ""}!\n\n` +
    `A disputa do pedido *${data.order_code}* foi resolvida.\n\n` +
    `Acesse sua conta para ver os detalhes.\n\n` +
    `_Bravenza Marketplace_`,

  mk_payout_released: (data: any) =>
    `💰 *Pagamento Liberado!*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Pedido *${data.order_code}* — R$ ${(data.payout_amount || 0).toFixed(2)} será transferido via PIX em até 2 dias úteis.\n\n` +
    `_Bravenza Marketplace_`,

  mk_payment_confirmed: (data: any) =>
    `✅ *Pagamento Confirmado!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `O pagamento de R$ ${(data.payment_amount || 0).toFixed(2)} do pedido *${data.order_code}* foi aprovado.\n\n` +
    `O vendedor foi notificado para envio.\n\n` +
    `_Bravenza Marketplace_`,

  mk_kyc_approved: (data: any) =>
    `✅ *Cadastro de Vendedor Aprovado!*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Seus documentos foram verificados e aprovados! 🎉\n\n` +
    `Agora você pode publicar anúncios no marketplace.\n` +
    `Acesse: https://bravenza.lovable.app/marketplace/minha-loja\n\n` +
    `_Bravenza Marketplace_`,

  mk_kyc_rejected: (data: any) =>
    `⚠️ *Documentos Não Aprovados*\n\n` +
    `Olá ${data.recipient_name || ""}!\n\n` +
    `Sua verificação de identidade não foi aprovada.\n\n` +
    `${data.kyc_rejection_reason ? `📝 Motivo: ${data.kyc_rejection_reason}\n\n` : ""}` +
    `Você pode enviar novos documentos para análise.\n` +
    `Acesse: https://bravenza.lovable.app/marketplace/minha-loja\n\n` +
    `_Bravenza Marketplace_`,

  mk_review_request: (data: any) =>
    `⭐ *Avalie sua Compra!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `Pedido *${data.order_code}* finalizado com sucesso! 🎉\n\n` +
    `Sua opinião é muito importante. Avalie em apenas 1 minuto!\n` +
    `Acesse: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_hub_received: (data: any) =>
    `📦 *Pedido Recebido no Hub!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `Seu pedido *${data.order_code}* chegou ao Hub Bravenza e será inspecionado pela nossa equipe.\n\n` +
    `Você será notificado assim que a inspeção for concluída.\n\n` +
    `_Bravenza Marketplace_`,

  mk_hub_shipped_to_buyer: (data: any) =>
    `🚚 *Pedido Enviado do Hub!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `Pedido *${data.order_code}* aprovado na inspeção e enviado para você! 🎉\n\n` +
    `${data.tracking_code ? `📦 Rastreio: ${data.tracking_code}\n\n` : ""}` +
    `_Bravenza Marketplace_`,

  mk_shipping_reminder: (data: any) =>
    `⚠️ *Lembrete de Envio!*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Pedido *${data.order_code}* está pendente de envio há *${data.days_pending || 3}+ dias*.\n\n` +
    `${data.shipping_mode === "bravenza" ? "Envie ao Hub Bravenza" : "Envie ao comprador"} o mais rápido possível para evitar cancelamento.\n\n` +
    `_Bravenza Marketplace_`,

  mk_order_cancelled: (data: any) =>
    `❌ *Pedido Cancelado*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `O pedido *${data.order_code}* foi cancelado.\n\n` +
    `${data.cancel_reason ? `📝 Motivo: ${data.cancel_reason}\n\n` : ""}` +
    `Se houve pagamento, o estorno será processado automaticamente.\n\n` +
    `_Bravenza Marketplace_`,

  mk_inspection_result: (data: any) =>
    data.inspection_result === "approved"
      ? `✅ *Inspeção Aprovada!*\n\n` +
        `Olá ${data.recipient_name || "Cliente"}!\n\n` +
        `O produto do pedido *${data.order_code}* foi autenticado e aprovado no Hub Bravenza! 🎉\n\n` +
        `O envio será feito em breve.\n\n` +
        `_Bravenza Marketplace_`
      : `❌ *Inspeção Reprovada*\n\n` +
        `Olá ${data.recipient_name || ""}!\n\n` +
        `O produto do pedido *${data.order_code}* não passou na inspeção.\n\n` +
        `${data.rejection_reason ? `📝 Motivo: ${data.rejection_reason}\n\n` : ""}` +
        `Entre em contato para mais detalhes.\n\n` +
        `_Bravenza Marketplace_`,

  mk_offer_received: (data: any) =>
    `💰 *Nova Oferta Recebida!*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Você recebeu uma oferta de R$ ${(data.offer_price || 0).toFixed(2)} por "${data.listing_title || ""}".\n\n` +
    `${data.buyer_name ? `👤 Comprador: ${data.buyer_name}\n\n` : ""}` +
    `Responda rápido para não perder a venda!\n` +
    `Acesse: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_offer_accepted: (data: any) =>
    `✅ *Oferta Aceita!*\n\n` +
    `Olá ${data.recipient_name || "Comprador"}!\n\n` +
    `Sua oferta de R$ ${(data.offer_price || 0).toFixed(2)} por "${data.listing_title || ""}" foi aceita! 🎉\n\n` +
    `Finalize a compra agora!\n` +
    `Acesse: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_offer_rejected: (data: any) =>
    `❌ *Oferta Recusada*\n\n` +
    `Olá ${data.recipient_name || "Comprador"}!\n\n` +
    `Sua oferta de R$ ${(data.offer_price || 0).toFixed(2)} por "${data.listing_title || ""}" não foi aceita.\n\n` +
    `Que tal tentar um novo valor?\n` +
    `Acesse: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_offer_counter: (data: any) =>
    `🔄 *Contra-proposta Recebida!*\n\n` +
    `Olá ${data.recipient_name || "Comprador"}!\n\n` +
    `O vendedor fez uma contra-proposta de R$ ${(data.counter_price || 0).toFixed(2)} para "${data.listing_title || ""}".\n\n` +
    `⏰ Responda em até 48h!\n` +
    `Acesse: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_watchlist_match: (data: any) =>
    `🔔 *Produto da Watchlist Disponível!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `Uma oferta de R$ ${(data.watchlist_price || 0).toFixed(2)} foi publicada para *${data.watchlist_product_name || "um produto que você acompanha"}*!\n\n` +
    `${data.watchlist_size ? `📏 Tamanho: ${data.watchlist_size}\n\n` : ""}` +
    `Acesse: https://bravenza.lovable.app/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_protection_expiring: (data: any) =>
    `🛡️ *Proteção Expirando!*\n\n` +
    `Olá ${data.recipient_name || "Cliente"}!\n\n` +
    `A proteção do pedido *${data.order_code}* expira em *${data.protection_expires_at || "breve"}*.\n\n` +
    `Se houver qualquer problema com o produto, abra uma disputa antes do prazo.\n\n` +
    `Acesse: https://bravenza.lovable.app/vault/marketplace\n\n` +
    `_Bravenza Marketplace_`,

  mk_stale_listing: (data: any) =>
    `📉 *Anúncio com Poucas Visualizações*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Seu anúncio de R$ ${(data.listing_price || 0).toFixed(2)} está ativo há ${data.days_active || 14}+ dias com apenas ${data.listing_views || 0} views.\n\n` +
    `💡 Dica: reduza o preço ou atualize as fotos para atrair mais compradores!\n\n` +
    `_Bravenza Marketplace_`,

  mk_subscription_expiring: (data: any) =>
    `⏰ *Plano Expirando!*\n\n` +
    `Olá ${data.recipient_name || "Vendedor"}!\n\n` +
    `Seu plano *${data.plan_name || ""}* expira em *${data.expires_at || "breve"}*.\n\n` +
    `Renove para manter seus benefícios e anúncios ativos!\n` +
    `Acesse: https://bravenza.lovable.app/marketplace/planos\n\n` +
    `_Bravenza Marketplace_`,
};
const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Pedido Confirmado",
  SOURCING: "Localizando seu Produto",
  NEGOTIATING: "Em Negociação",
  PURCHASE_COMPLETED: "Compra Realizada",
  PACKAGE_EN_ROUTE: "Em Trânsito até o Hub",
  ARRIVED: "Recebido no Hub Bravenza",
  INSPECTION_APPROVED: "Autenticidade Confirmada",
  BALANCE_DUE: "Aguardando Pagamento do Saldo",
  INTERNATIONAL_DISPATCH: "Em Preparação para Envio",
  CUSTOMS: "Em Processamento",
  NATIONAL_TRANSIT: "Em Trânsito",
  DISPATCHED: "Saiu para Entrega",
  DELIVERED: "Entregue! 🎉",
};

// Twilio helper to send WhatsApp message
async function sendTwilioWhatsApp(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append("From", `whatsapp:${fromNumber}`);
  formData.append("To", `whatsapp:+${toNumber}`);
  formData.append("Body", message);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twilio API error:", errorText);
    return { success: false, error: `Twilio error: ${response.status}` };
  }

  const data = await response.json();
  return { success: true, messageId: data.sid };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: only service-role, cron, or admin can invoke this internal function
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    try { await requireServiceOrAdmin(req, sb); } catch (e) { return authErrorResponse(e); }

    // Check if Twilio is configured
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.log("Twilio WhatsApp not configured - skipping notification");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Twilio WhatsApp não configurado. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER.",
          skipped: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: WhatsAppRequest = await req.json();
    const { order_id, message_type, custom_message, referrer_phone, referrer_name, referred_name, discount_percentage, referral_code, days_until_expiration, cashback_amount, member_name, member_phone, member_tier } = requestData;

    if (!message_type) {
      throw new Error("message_type é obrigatório");
    }

    // Handle referral confirmation (doesn't need order_id)
    if (message_type === "referral_confirmed") {
      if (!referrer_phone) {
        console.log("No referrer phone for referral notification");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Telefone do indicador não fornecido",
            skipped: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Format phone number
      let phone = referrer_phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      const templateFn = MESSAGE_TEMPLATES.referral_confirmed;
      const message = templateFn({
        referrer_name: referrer_name || "Cliente",
        referred_name: referred_name || "seu indicado",
        discount_percentage: discount_percentage || 5,
        referral_code: referral_code || "---",
      });

      const result = await sendTwilioWhatsApp(
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppNumber,
        phone,
        message
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao enviar WhatsApp via Twilio");
      }

      console.log(`Referral WhatsApp sent to +${phone}: ${result.messageId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: result.messageId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle cashback expiring notification (doesn't need order_id)
    if (message_type === "cashback_expiring") {
      if (!referrer_phone) {
        console.log("No referrer phone for cashback expiring notification");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Telefone do cliente não fornecido",
            skipped: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Format phone number
      let phone = referrer_phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      const templateFn = MESSAGE_TEMPLATES.cashback_expiring;
      const message = templateFn({
        referrer_name: referrer_name || "Cliente",
        cashback_amount: cashback_amount || discount_percentage || 5,
        days_until_expiration: days_until_expiration || 7,
      });

      const result = await sendTwilioWhatsApp(
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppNumber,
        phone,
        message
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao enviar WhatsApp via Twilio");
      }

      console.log(`Cashback expiring WhatsApp sent to +${phone}: ${result.messageId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: result.messageId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle vault welcome notification (doesn't need order_id)
    if (message_type === "vault_welcome") {
      const phoneToUse = member_phone || referrer_phone;
      if (!phoneToUse) {
        console.log("No phone for vault welcome notification");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Telefone do membro não fornecido",
            skipped: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Format phone number
      let phone = phoneToUse.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      const templateFn = MESSAGE_TEMPLATES.vault_welcome;
      const message = templateFn({
        member_name: member_name || referrer_name || "Membro",
        member_tier: member_tier || "Vault Access",
      });

      const result = await sendTwilioWhatsApp(
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppNumber,
        phone,
        message
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao enviar WhatsApp via Twilio");
      }

      console.log(`Vault welcome WhatsApp sent to +${phone}: ${result.messageId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: result.messageId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle marketplace notifications (use recipient_phone)
    const mkTypes = ["mk_purchase_confirmed", "mk_new_sale", "mk_seller_shipped", "mk_delivery_confirmed",
      "mk_dispute_opened", "mk_dispute_resolved", "mk_payout_released", "mk_payment_confirmed",
      "mk_kyc_approved", "mk_kyc_rejected", "mk_review_request",
      "mk_hub_received", "mk_hub_shipped_to_buyer", "mk_shipping_reminder",
      "mk_order_cancelled", "mk_inspection_result",
      "mk_offer_received", "mk_offer_accepted", "mk_offer_rejected", "mk_offer_counter",
      "mk_watchlist_match", "mk_protection_expiring", "mk_stale_listing", "mk_subscription_expiring"];

    // Transactional types always sent
    const waTransactional = new Set([
      "mk_purchase_confirmed", "mk_new_sale", "mk_payment_confirmed",
      "mk_seller_shipped", "mk_delivery_confirmed", "mk_hub_received",
      "mk_hub_shipped_to_buyer", "mk_inspection_result",
      "mk_dispute_opened", "mk_dispute_resolved", "mk_order_cancelled",
      "mk_payout_released", "mk_kyc_approved", "mk_kyc_rejected",
      "mk_protection_expiring", "mk_shipping_reminder",
    ]);
    const waTypeToPref: Record<string, string> = {
      mk_offer_received: "chat", mk_offer_accepted: "chat",
      mk_offer_rejected: "chat", mk_offer_counter: "chat",
      mk_watchlist_match: "price_alerts", mk_review_request: "marketing",
      mk_stale_listing: "seller_tips", mk_subscription_expiring: "seller_tips",
    };
    
    if (mkTypes.includes(message_type)) {
      const phoneToUse = requestData.recipient_phone;
      if (!phoneToUse) {
        console.log(`No recipient_phone for ${message_type}`);
        return new Response(
          JSON.stringify({ success: false, message: "Telefone do destinatário não fornecido", skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check notification preferences for optional types
      if (!waTransactional.has(message_type) && waTypeToPref[message_type]) {
        try {
          const cleanPhone = phoneToUse.replace(/\D/g, '');
          const { data: member } = await supabase.from("vault_members").select("client_cpf").eq("client_phone", cleanPhone).maybeSingle();
          if (!member?.client_cpf) { /* no member, try without country code */ }
          if (member?.client_cpf) {
            const { data: pref } = await supabase.from("client_preferences").select("notification_prefs").eq("client_cpf", member.client_cpf).maybeSingle();
            if (pref?.notification_prefs) {
              const prefs = pref.notification_prefs as Record<string, boolean>;
              if (prefs[waTypeToPref[message_type]] === false) {
                console.log(`[send-whatsapp] Skipped ${message_type} for ${cleanPhone} (user opted out)`);
                return new Response(
                  JSON.stringify({ success: true, skipped: true, reason: "user_opted_out" }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          }
        } catch (e) { console.error("[send-whatsapp] Pref check error:", e); }
      }

      let phone = phoneToUse.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = phone.substring(1);
      if (!phone.startsWith('55')) phone = '55' + phone;

      const templateFn = MESSAGE_TEMPLATES[message_type];
      if (!templateFn) {
        return new Response(
          JSON.stringify({ success: false, message: "Template não encontrado", skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const message = templateFn(requestData);
      const result = await sendTwilioWhatsApp(twilioAccountSid, twilioAuthToken, twilioWhatsAppNumber, phone, message);
      if (!result.success) throw new Error(result.error || "Erro ao enviar WhatsApp via Twilio");

      console.log(`MKT WhatsApp (${message_type}) sent to +${phone}: ${result.messageId}`);
      return new Response(
        JSON.stringify({ success: true, message_id: result.messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For order-based messages, order_id is required
    if (!order_id) {
      throw new Error("order_id é obrigatório para este tipo de mensagem");
    }

    // Get order data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado");
    }

    if (!order.client_phone) {
      console.log(`No phone number for order ${order_id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Cliente sem telefone cadastrado",
          skipped: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number (remove non-digits, ensure country code)
    let phone = order.client_phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    // Build message
    let message: string;
    
    if (message_type === "custom" && custom_message) {
      message = custom_message;
    } else {
      const templateFn = MESSAGE_TEMPLATES[message_type];
      if (!templateFn) {
        throw new Error("Tipo de mensagem inválido");
      }

      const templateData = {
        ...order,
        budget_url: `https://bravenza.com.br/orcamento/${order.budget_approval_token}`,
        review_url: `https://bravenza.com.br/minha-conta`,
        status_label: STATUS_LABELS[order.current_status] || order.current_status,
        tracking: order.national_tracking || order.international_tracking,
      };

      message = templateFn(templateData);
    }

    // Send via Twilio WhatsApp
    const result = await sendTwilioWhatsApp(
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsAppNumber,
      phone,
      message
    );

    if (!result.success) {
      throw new Error(result.error || "Erro ao enviar WhatsApp via Twilio");
    }

    console.log(`WhatsApp sent via Twilio to +${phone} for order ${order_id}: ${result.messageId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: result.messageId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("WhatsApp notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
