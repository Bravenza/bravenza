import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BudgetEmailRequest {
  order_id: string;
  client_name: string;
  client_email: string;
  product_price: number;
  sinal_value: number;
  balance_value: number;
  approval_link: string;
  expires_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ message: "Email não configurado, link disponível para compartilhamento manual" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const resend = new Resend(resendKey);

    const {
      order_id,
      client_name,
      client_email,
      product_price,
      sinal_value,
      balance_value,
      approval_link,
      expires_at,
    }: BudgetEmailRequest = await req.json();

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

    const firstName = client_name.split(" ")[0];

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Orçamento - Bravenza Vault</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #0a0a0a;">BRAVENZA VAULT</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #333;">Seu orçamento está pronto!</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 24px;">
        Olá, <strong>${firstName}</strong>!
      </p>
      
      <p style="color: #a0a0a0; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
        Preparamos o orçamento do seu pedido <strong style="color: #d4af37;">${order_id}</strong>. 
        Confira os valores abaixo e aprove para prosseguir com a compra.
      </p>
      
      <!-- Values -->
      <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #333;">
          <span style="color: #a0a0a0;">Valor Total</span>
          <span style="color: #d4af37; font-size: 20px; font-weight: bold;">${formatCurrency(product_price)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #a0a0a0;">Sinal (50%) - Pix imediato</span>
          <span style="color: #ffffff; font-weight: 600;">${formatCurrency(sinal_value)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #a0a0a0;">Saldo (50%) - Na chegada</span>
          <span style="color: #ffffff; font-weight: 600;">${formatCurrency(balance_value)}</span>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${approval_link}" 
           style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4e5a3 50%, #d4af37 100%); 
                  color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 8px; 
                  font-weight: bold; font-size: 16px;">
          Ver Orçamento e Aprovar
        </a>
      </div>
      
      <!-- Expiration -->
      <p style="color: #ff9500; font-size: 14px; text-align: center; margin: 0 0 24px;">
        ⏰ Este orçamento expira em <strong>${formatDate(expires_at)}</strong>
      </p>
      
      <!-- Footer note -->
        <p style="color: #666; font-size: 13px; text-align: center; margin: 0; line-height: 1.5;">
          Ao aprovar o orçamento, você será direcionado para efetuar o pagamento do sinal via Pix.
          O saldo poderá ser pago via Pix ou Cartão de Crédito quando o produto chegar.
        </p>
        
        <p style="color: #666; font-size: 12px; text-align: center; margin: 24px 0 0; line-height: 1.5;">
          Dúvidas? Fale conosco pelo <a href="https://wa.me/5551999999999" style="color: #d4af37; text-decoration: none;">WhatsApp</a>.
        </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #111; padding: 24px; text-align: center; border-top: 1px solid #333;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Bravenza Vault. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Bravenza Vault <noreply@bravenza.com.br>",
      to: [client_email],
      subject: `Seu orçamento está pronto - ${order_id}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
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
