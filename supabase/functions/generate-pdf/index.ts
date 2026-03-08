import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface PDFRequest {
  order_id: string;
  type: "budget" | "sinal_receipt" | "balance_receipt" | "full_receipt";
}

// Generate HTML for PDF
function generateBudgetHTML(order: any): string {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.product_currency || 'BRL' }).format(value);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: #0a0a0a; 
      color: #fff; 
      padding: 40px;
      min-height: 100vh;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .header { 
      text-align: center; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #d4af37;
    }
    .logo { 
      font-size: 32px; 
      font-weight: bold; 
      color: #d4af37;
      letter-spacing: 4px;
    }
    .document-title {
      font-size: 14px;
      color: #888;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .section { margin-bottom: 30px; }
    .section-title { 
      font-size: 12px; 
      color: #888; 
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px;
    }
    .info-item { 
      background: #1a1a1a; 
      padding: 15px;
      border-radius: 8px;
    }
    .info-label { font-size: 12px; color: #888; margin-bottom: 5px; }
    .info-value { font-size: 16px; font-weight: 500; }
    .product-box {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 25px;
    }
    .product-name { 
      font-size: 20px; 
      font-weight: bold;
      margin-bottom: 5px;
    }
    .product-details { 
      color: #888; 
      font-size: 14px;
      margin-bottom: 20px;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-top: 1px solid #333;
    }
    .price-row:first-of-type { border-top: none; }
    .price-label { color: #888; }
    .price-value { font-weight: 500; }
    .price-total {
      font-size: 24px;
      color: #d4af37;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #333;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      background: #d4af37;
      color: #000;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BRAVENZA</div>
      <div class="document-title">Orçamento</div>
    </div>

    <div class="section">
      <div class="section-title">Informações do Pedido</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Número do Pedido</div>
          <div class="info-value">${order.order_id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data</div>
          <div class="info-value">${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Cliente</div>
          <div class="info-value">${order.client_name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Tipo</div>
          <div class="info-value">Encomenda</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Produto</div>
      <div class="product-box">
        <div class="product-name">${order.product_name}</div>
        <div class="product-details">
          ${order.product_brand ? order.product_brand : ''}
          ${order.product_model ? ' ' + order.product_model : ''}
          ${order.product_size ? ' | Tam: ' + order.product_size : ''}
          ${order.product_color ? ' | ' + order.product_color : ''}
        </div>
        
        <div class="price-row">
          <span class="price-label">Valor do Produto</span>
          <span class="price-value">${formatCurrency(order.product_price)}</span>
        </div>
        <div class="price-row">
          <span class="price-label">Sinal (50%)</span>
          <span class="price-value">${formatCurrency(order.sinal_value)}</span>
        </div>
        <div class="price-row">
          <span class="price-label">Saldo Restante</span>
          <span class="price-value">${formatCurrency(order.balance_value)}</span>
        </div>
        <div class="price-row">
          <span class="price-label">Total</span>
          <span class="price-total">${formatCurrency(order.product_price)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Este orçamento é válido por 48 horas.</p>
      <p style="margin-top: 10px;">Bravenza - Sneakers Premium</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateReceiptHTML(order: any, type: string): string {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.product_currency || 'BRL' }).format(value);

  const paymentInfo = type === 'sinal' 
    ? { label: 'Sinal', value: order.sinal_value, date: order.sinal_paid_at, method: order.sinal_payment_method }
    : type === 'balance'
    ? { label: 'Saldo', value: order.balance_value, date: order.balance_paid_at, method: order.balance_payment_method }
    : { label: 'Total', value: order.product_price, date: order.balance_paid_at || order.sinal_paid_at, method: 'Completo' };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: #0a0a0a; 
      color: #fff; 
      padding: 40px;
      min-height: 100vh;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .header { 
      text-align: center; 
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #22c55e;
    }
    .logo { 
      font-size: 32px; 
      font-weight: bold; 
      color: #d4af37;
      letter-spacing: 4px;
    }
    .document-title {
      font-size: 14px;
      color: #22c55e;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .check-icon {
      width: 60px;
      height: 60px;
      background: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px auto;
      font-size: 30px;
    }
    .section { margin-bottom: 30px; }
    .section-title { 
      font-size: 12px; 
      color: #888; 
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px;
    }
    .info-item { 
      background: #1a1a1a; 
      padding: 15px;
      border-radius: 8px;
    }
    .info-label { font-size: 12px; color: #888; margin-bottom: 5px; }
    .info-value { font-size: 16px; font-weight: 500; }
    .amount-box {
      background: linear-gradient(135deg, #1a3a1a 0%, #0a2a0a 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
    }
    .amount-label { color: #22c55e; font-size: 14px; margin-bottom: 10px; }
    .amount-value { font-size: 36px; font-weight: bold; color: #22c55e; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #333;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BRAVENZA</div>
      <div class="document-title">Comprovante de Pagamento</div>
      <div class="check-icon">✓</div>
    </div>

    <div class="section">
      <div class="amount-box">
        <div class="amount-label">Valor Pago - ${paymentInfo.label}</div>
        <div class="amount-value">${formatCurrency(paymentInfo.value)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Detalhes do Pagamento</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Pedido</div>
          <div class="info-value">${order.order_id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data do Pagamento</div>
          <div class="info-value">${paymentInfo.date ? new Date(paymentInfo.date).toLocaleDateString('pt-BR') : '-'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Método</div>
          <div class="info-value">${paymentInfo.method === 'PIX' ? 'Pix' : paymentInfo.method === 'CREDIT_CARD' ? 'Cartão de Crédito' : paymentInfo.method}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Cliente</div>
          <div class="info-value">${order.client_name}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Produto</div>
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">Descrição</div>
        <div class="info-value">
          ${order.product_name}
          ${order.product_brand ? ' - ' + order.product_brand : ''}
          ${order.product_model ? ' ' + order.product_model : ''}
          ${order.product_size ? ' | Tam: ' + order.product_size : ''}
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Este documento é um comprovante de pagamento válido.</p>
      <p style="margin-top: 10px;">Bravenza - Sneakers Premium</p>
      <p style="margin-top: 5px; color: #444;">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Admin guard
    console.log("[generate-pdf] Auth header present:", !!req.headers.get("authorization"));
    try { await requireAdmin(req, supabase); } catch (e) { console.log("[generate-pdf] Auth rejected:", (e as any).message); return authErrorResponse(e); }
    console.log("[generate-pdf] Auth passed");

    let order_id: string;
    let type: string;

    // Support both GET (query params) and POST (body)
    if (req.method === "GET") {
      const url = new URL(req.url);
      order_id = url.searchParams.get("order_id") || "";
      type = url.searchParams.get("type") || "";
    } else {
      const body = await req.json();
      order_id = body.order_id;
      type = body.type;
    }

    if (!order_id || !type) {
      throw new Error("order_id e type são obrigatórios");
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

    // Generate HTML based on type
    let html: string;
    let filename: string;

    switch (type) {
      case "budget":
        html = generateBudgetHTML(order);
        filename = `orcamento-${order_id}.pdf`;
        break;
      case "sinal_receipt":
        html = generateReceiptHTML(order, 'sinal');
        filename = `comprovante-sinal-${order_id}.pdf`;
        break;
      case "balance_receipt":
        html = generateReceiptHTML(order, 'balance');
        filename = `comprovante-saldo-${order_id}.pdf`;
        break;
      case "full_receipt":
        html = generateReceiptHTML(order, 'full');
        filename = `comprovante-${order_id}.pdf`;
        break;
      default:
        throw new Error("Tipo de documento inválido");
    }

    // Return HTML for now - in production, convert to PDF using a service
    // For MVP, we'll return the HTML that can be printed as PDF by the browser
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
