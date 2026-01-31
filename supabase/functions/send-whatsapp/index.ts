import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WhatsAppRequest {
  order_id?: string;
  message_type: "budget_sent" | "sinal_confirmed" | "balance_confirmed" | "status_update" | "review_request" | "referral_confirmed" | "cashback_expiring" | "custom";
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
}

// Message templates
const MESSAGE_TEMPLATES: Record<string, (data: any) => string> = {
  budget_sent: (data) => 
    `🔔 *Olá ${data.client_name}!*\n\n` +
    `Seu orçamento para *${data.product_name}* está pronto!\n\n` +
    `💰 Valor: R$ ${data.product_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Acesse o link abaixo para aprovar:\n${data.budget_url}\n\n` +
    `_Bravenza - Sua loja de tênis premium_`,

  sinal_confirmed: (data) =>
    `✅ *Pagamento Confirmado!*\n\n` +
    `Olá ${data.client_name}, recebemos o sinal do seu pedido *${data.order_id}*.\n\n` +
    `📦 Produto: ${data.product_name}\n` +
    `💰 Sinal: R$ ${data.sinal_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Já estamos trabalhando na sua encomenda!\n\n` +
    `_Bravenza - Sua loja de tênis premium_`,

  balance_confirmed: (data) =>
    `✅ *Pagamento Final Confirmado!*\n\n` +
    `Olá ${data.client_name}, recebemos o pagamento completo do pedido *${data.order_id}*.\n\n` +
    `📦 Produto: ${data.product_name}\n` +
    `💰 Saldo: R$ ${data.balance_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Seu produto será enviado em breve!\n\n` +
    `_Bravenza - Sua loja de tênis premium_`,

  status_update: (data) =>
    `📦 *Atualização do Pedido ${data.order_id}*\n\n` +
    `Olá ${data.client_name}!\n\n` +
    `Novo status: *${data.status_label}*\n` +
    `${data.notes ? `📝 ${data.notes}\n` : ''}` +
    `${data.tracking ? `🚚 Rastreio: ${data.tracking}\n` : ''}\n` +
    `_Bravenza - Sua loja de tênis premium_`,

  review_request: (data) =>
    `⭐ *Avalie sua Experiência!*\n\n` +
    `Olá ${data.client_name}!\n\n` +
    `Seu pedido *${data.order_id}* foi entregue! 🎉\n\n` +
    `Como foi sua experiência com o *${data.product_name}*?\n\n` +
    `Sua opinião é muito importante para nós! Avalie em apenas 1 minuto:\n` +
    `${data.review_url}\n\n` +
    `Obrigado por escolher a Bravenza! ❤️\n\n` +
    `_Bravenza - Sua loja de tênis premium_`,

  referral_confirmed: (data) =>
    `🎉 *Parabéns, ${data.referrer_name}!*\n\n` +
    `Sua indicação foi confirmada! 🎁\n\n` +
    `Seu amigo(a) *${data.referred_name}* acabou de fazer uma compra usando seu código de indicação.\n\n` +
    `💰 Você ganhou *${data.discount_percentage || 5}% de desconto* no seu próximo pedido!\n\n` +
    `📱 Seu código: *${data.referral_code}*\n` +
    `Continue indicando e acumule mais descontos!\n\n` +
    `Acesse sua conta para ver suas indicações:\nhttps://bravenza.com.br/minha-conta\n\n` +
    `_Bravenza - Sua loja de tênis premium_`,

  cashback_expiring: (data) =>
    `⏰ *Atenção, ${data.referrer_name}!*\n\n` +
    `Seu cashback está prestes a expirar! ⚠️\n\n` +
    `Você tem *${data.cashback_amount || data.discount_percentage || 5}% de desconto* acumulado que expira em *${data.days_until_expiration || 7} dias*.\n\n` +
    `💰 Use antes que perca!\n` +
    `O desconto pode ser aplicado no seu próximo pedido (limite de 25% do valor total).\n\n` +
    `🛒 Faça um novo pedido: https://bravenza.com.br/solicitar\n\n` +
    `_Bravenza - Sua loja de tênis premium_`,
};

// Status labels for WhatsApp messages
const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Pedido Confirmado",
  SOURCING: "Buscando seu Produto",
  NEGOTIATING: "Em Negociação",
  PURCHASE_COMPLETED: "Compra Realizada",
  PACKAGE_EN_ROUTE: "Em Trânsito Internacional",
  ARRIVED: "Chegou no Brasil",
  INSPECTION_APPROVED: "Inspeção Aprovada",
  BALANCE_DUE: "Aguardando Pagamento do Saldo",
  INTERNATIONAL_DISPATCH: "Enviado Internacionalmente",
  CUSTOMS: "Na Alfândega",
  NATIONAL_TRANSIT: "Em Trânsito Nacional",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { order_id, message_type, custom_message, referrer_phone, referrer_name, referred_name, discount_percentage, referral_code, days_until_expiration, cashback_amount } = requestData;

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
