import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailType = 
  | "budget_sent"
  | "budget_approved"
  | "sinal_confirmed"
  | "product_found"
  | "package_shipped"
  | "arrived_inspection"
  | "balance_due"
  | "balance_confirmed"
  | "dispatched"
  | "delivered"
  | "balance_reminder"
  | "review_request"
  | "referral_confirmed";

interface EmailRequest {
  type: EmailType;
  order_id: string;
  client_name: string;
  client_email: string;
  product_name?: string;
  product_price?: number;
  sinal_value?: number;
  balance_value?: number;
  approval_link?: string;
  payment_link?: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  international_tracking?: string;
  national_tracking?: string;
  national_carrier?: string;
  sla_vault_due_date?: string;
  expires_at?: string;
  review_link?: string;
  // Referral fields
  referred_name?: string;
  discount_percentage?: number;
  referral_code?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getEmailSubject = (type: EmailType, orderId: string, data?: EmailRequest): string => {
  const subjects: Record<EmailType, string> = {
    budget_sent: `Seu orçamento está pronto - ${orderId}`,
    budget_approved: `Orçamento aprovado! Próximo passo: Pagamento do sinal - ${orderId}`,
    sinal_confirmed: `Pagamento confirmado! Iniciando busca - ${orderId}`,
    product_found: `Ótima notícia! Seu produto foi encontrado - ${orderId}`,
    package_shipped: `Seu pacote está a caminho do Brasil! - ${orderId}`,
    arrived_inspection: `Produto aprovado na inspeção! - ${orderId}`,
    balance_due: `Pague o saldo e receba seu produto! - ${orderId}`,
    balance_confirmed: `Pagamento completo! Preparando envio - ${orderId}`,
    dispatched: `Seu pedido está a caminho! - ${orderId}`,
    delivered: `Pedido entregue! Obrigado pela confiança - ${orderId}`,
    balance_reminder: `Lembrete: Pagamento pendente - ${orderId}`,
    review_request: `Como foi sua experiência? Avalie seu pedido! - ${orderId}`,
    referral_confirmed: `🎉 Parabéns! Sua indicação foi confirmada!`,
  };
  return subjects[type];
};

const getEmailHtml = (type: EmailType, data: EmailRequest): string => {
  const firstName = data.client_name.split(" ")[0];
  
  const header = `
    <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #0a0a0a;">BRAZ VAULT</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #333;">{subtitle}</p>
    </div>
  `;

  const footer = `
    <div style="background-color: #111; padding: 24px; text-align: center; border-top: 1px solid #333;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Braz Vault. Todos os direitos reservados.
      </p>
    </div>
  `;

  const wrapper = (subtitle: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Braz Vault</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    ${header.replace("{subtitle}", subtitle)}
    <div style="padding: 32px;">
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 24px;">
        Olá, <strong>${firstName}</strong>!
      </p>
      ${content}
    </div>
    ${footer}
  </div>
</body>
</html>
  `;

  const templates: Record<EmailType, { subtitle: string; content: string }> = {
    budget_sent: {
      subtitle: "Seu orçamento está pronto!",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Preparamos o orçamento do seu pedido <strong style="color: #d4af37;">${data.order_id}</strong>. 
          Confira os valores abaixo e aprove para prosseguir com a compra.
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #333;">
            <span style="color: #a0a0a0;">Valor Total</span>
            <span style="color: #d4af37; font-size: 20px; font-weight: bold;">${formatCurrency(data.product_price || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #a0a0a0;">Sinal (50%) - Pix imediato</span>
            <span style="color: #ffffff; font-weight: 600;">${formatCurrency(data.sinal_value || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #a0a0a0;">Saldo (50%) - Na chegada</span>
            <span style="color: #ffffff; font-weight: 600;">${formatCurrency(data.balance_value || 0)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.approval_link}" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Ver Orçamento e Aprovar
          </a>
        </div>
        
        <p style="color: #ff9500; font-size: 14px; text-align: center; margin: 0 0 24px;">
          ⏰ Este orçamento expira em <strong>${data.expires_at ? formatDate(data.expires_at) : "3 dias"}</strong>
        </p>
      `,
    },
    budget_approved: {
      subtitle: "Orçamento Aprovado! ✓",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #4ade80; font-size: 14px; margin: 0;">✓ Seu orçamento foi aprovado com sucesso!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Para iniciarmos a busca do seu produto, efetue o pagamento do sinal via Pix:
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #d4af37; font-size: 24px; font-weight: bold; margin: 0 0 16px;">${formatCurrency(data.sinal_value || 0)}</p>
          ${data.pix_qr_code ? `<img src="${data.pix_qr_code}" alt="QR Code Pix" style="width: 200px; height: 200px; margin-bottom: 16px;" />` : ""}
          <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 8px;">Ou copie o código Pix:</p>
          <code style="display: block; background-color: #333; padding: 12px; border-radius: 8px; color: #fff; font-size: 11px; word-break: break-all;">
            ${data.pix_copy_paste || "Código será gerado ao acessar a página de pagamento"}
          </code>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.payment_link}" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Pagar Sinal
          </a>
        </div>
      `,
    },
    sinal_confirmed: {
      subtitle: "Pagamento Confirmado! 💰",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #4ade80; font-size: 14px; margin: 0;">✓ Pagamento do sinal confirmado!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Iniciamos a busca do seu <strong style="color: #fff;">${data.product_name}</strong>.
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Previsão de conclusão:</p>
          <p style="color: #d4af37; font-size: 18px; font-weight: bold; margin: 0;">
            ${data.sla_vault_due_date ? formatDate(data.sla_vault_due_date) : "30 dias úteis"}
          </p>
        </div>
        
        <p style="color: #666; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
          Você receberá atualizações por email a cada nova etapa do processo.
        </p>
      `,
    },
    product_found: {
      subtitle: "Produto Encontrado! 🎯",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #4ade80; font-size: 14px; margin: 0;">✓ Encontramos seu produto!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Ótima notícia! O seu <strong style="color: #fff;">${data.product_name}</strong> foi encontrado e a compra foi realizada.
        </p>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Agora aguardamos o envio do produto para nossa central no Brasil. Você será notificado assim que o pacote estiver a caminho!
        </p>
      `,
    },
    package_shipped: {
      subtitle: "Pacote Enviado! ✈️",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu pacote está a caminho do Brasil!
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Código de Rastreio Internacional:</p>
          <p style="color: #d4af37; font-size: 18px; font-weight: bold; font-family: monospace; margin: 0;">
            ${data.international_tracking || "A informar"}
          </p>
        </div>
        
        <p style="color: #666; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
          Quando o pacote chegar ao Brasil, faremos uma inspeção de qualidade antes de liberar para pagamento do saldo.
        </p>
      `,
    },
    arrived_inspection: {
      subtitle: "Inspeção Aprovada! ✓",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #4ade80; font-size: 14px; margin: 0;">✓ Produto chegou e passou na inspeção de qualidade!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu <strong style="color: #fff;">${data.product_name}</strong> está pronto para ser enviado. 
          Efetue o pagamento do saldo para liberarmos o envio.
        </p>
      `,
    },
    balance_due: {
      subtitle: "Pagamento do Saldo 💳",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu produto está pronto para envio! Para liberar, efetue o pagamento do saldo:
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Valor do Saldo:</p>
          <p style="color: #d4af37; font-size: 28px; font-weight: bold; margin: 0;">
            ${formatCurrency(data.balance_value || 0)}
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.payment_link}" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Pagar Saldo
          </a>
        </div>
        
        <p style="color: #666; font-size: 13px; text-align: center; margin: 24px 0 0; line-height: 1.5;">
          Você pode pagar via Pix ou Cartão de Crédito.
        </p>
      `,
    },
    balance_confirmed: {
      subtitle: "Pagamento Completo! 🎉",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #4ade80; font-size: 14px; margin: 0;">✓ Pagamento do saldo confirmado!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu <strong style="color: #fff;">${data.product_name}</strong> será enviado em breve. 
          Você receberá o código de rastreio assim que o pacote for despachado.
        </p>
      `,
    },
    dispatched: {
      subtitle: "Pedido Enviado! 🚚",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Seu pedido <strong style="color: #d4af37;">${data.order_id}</strong> está a caminho!
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Código de Rastreio:</p>
          <p style="color: #d4af37; font-size: 20px; font-weight: bold; font-family: monospace; margin: 0 0 12px;">
            ${data.national_tracking || "A informar"}
          </p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Transportadora: <strong style="color: #fff;">${data.national_carrier || "Correios"}</strong>
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://www.linkcorreto.com.br/rastreio" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Rastrear Pedido
          </a>
        </div>
      `,
    },
    delivered: {
      subtitle: "Pedido Entregue! 🎉",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="color: #4ade80; font-size: 16px; margin: 0;">✓ Pedido entregue com sucesso!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6; text-align: center;">
          Obrigado por confiar na <strong style="color: #d4af37;">Braz Vault</strong>!<br />
          Esperamos que você aproveite seu <strong style="color: #fff;">${data.product_name}</strong>.
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #fff; font-size: 16px; margin: 0 0 16px;">⭐ Sua opinião é muito importante!</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 16px;">
            Avalie sua experiência e ajude outros clientes a conhecer nosso trabalho.
          </p>
          <a href="${data.review_link || '#'}" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                    font-weight: bold; font-size: 14px;">
            Avaliar Minha Experiência
          </a>
        </div>
        
        <p style="color: #666; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
          Alguma dúvida? Entre em contato conosco.
        </p>
      `,
    },
    balance_reminder: {
      subtitle: "Lembrete de Pagamento ⏰",
      content: `
        <p style="color: #ff9500; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
          Notamos que o pagamento do saldo do seu pedido <strong>${data.order_id}</strong> ainda está pendente.
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a0a0a0; font-size: 14px; margin: 0 0 8px;">Valor Pendente:</p>
          <p style="color: #d4af37; font-size: 28px; font-weight: bold; margin: 0;">
            ${formatCurrency(data.balance_value || 0)}
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.payment_link}" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Pagar Agora
          </a>
        </div>
      `,
    },
    review_request: {
      subtitle: "Como foi sua experiência? ⭐",
      content: `
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6; text-align: center;">
          Seu <strong style="color: #fff;">${data.product_name}</strong> foi entregue há alguns dias.<br />
          Gostaríamos muito de saber como foi sua experiência!
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #d4af37; font-size: 40px; margin: 0 0 16px;">⭐⭐⭐⭐⭐</p>
          <p style="color: #fff; font-size: 16px; margin: 0 0 8px;">Sua avaliação nos ajuda a melhorar!</p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            Leva apenas 1 minuto para avaliar.
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.review_link}" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Avaliar Agora
          </a>
        </div>
        
        <p style="color: #666; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
          Obrigado por escolher a Braz Vault! ❤️
        </p>
      `,
    },
    referral_confirmed: {
      subtitle: "Sua Indicação foi Confirmada! 🎉",
      content: `
        <div style="background-color: #0a3d0a; border: 1px solid #0d6d0d; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="color: #4ade80; font-size: 16px; margin: 0;">✓ Indicação confirmada com sucesso!</p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6; text-align: center;">
          Parabéns! Seu amigo(a) <strong style="color: #fff;">${data.referred_name || "indicado"}</strong> 
          concluiu uma compra usando seu código de indicação.
        </p>
        
        <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #d4af37; font-size: 48px; margin: 0 0 16px;">🎁</p>
          <p style="color: #fff; font-size: 18px; margin: 0 0 8px;">Você ganhou um desconto!</p>
          <p style="color: #d4af37; font-size: 32px; font-weight: bold; margin: 0 0 8px;">
            ${data.discount_percentage || 5}% OFF
          </p>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0;">
            no seu próximo pedido
          </p>
        </div>
        
        <div style="background-color: #1a1a2e; border: 1px dashed #d4af37; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="color: #a0a0a0; font-size: 12px; margin: 0 0 8px;">Seu código de indicação:</p>
          <p style="color: #d4af37; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0;">
            ${data.referral_code || "---"}
          </p>
        </div>
        
        <p style="color: #a0a0a0; font-size: 14px; text-align: center; margin: 0 0 24px; line-height: 1.6;">
          Continue indicando amigos e acumule mais descontos!<br />
          Cada indicação confirmada = mais economia pra você.
        </p>
        
        <div style="text-align: center;">
          <a href="https://bravenza.lovable.app/minha-conta" 
             style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                    color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Ver Minhas Indicações
          </a>
        </div>
        
        <p style="color: #666; font-size: 13px; text-align: center; margin: 24px 0 0; line-height: 1.5;">
          Obrigado por recomendar a Braz Vault! ❤️
        </p>
      `,
    },
  };

  const template = templates[type];
  return wrapper(template.subtitle, template.content);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ message: "Email não configurado, notificação não enviada" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const resend = new Resend(resendKey);
    const data: EmailRequest = await req.json();

    const subject = getEmailSubject(data.type, data.order_id);
    const html = getEmailHtml(data.type, data);

    console.log(`Sending ${data.type} email to ${data.client_email}`);

    const { data: emailData, error } = await resend.emails.send({
      from: "Braz Vault <noreply@resend.dev>",
      to: [data.client_email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, messageId: emailData?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
