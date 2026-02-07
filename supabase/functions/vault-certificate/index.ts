import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { vault_item_id } = await req.json();

    if (!vault_item_id) {
      return new Response(
        JSON.stringify({ error: "vault_item_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch vault item with member info
    const { data: item, error: itemError } = await supabase
      .from("vault_items")
      .select(`
        *,
        vault_members!vault_items_user_id_fkey (
          client_name,
          client_cpf,
          tier
        )
      `)
      .eq("id", vault_item_id)
      .single();

    if (itemError || !item) {
      console.error("Error fetching vault item:", itemError);
      return new Response(
        JSON.stringify({ error: "Item não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const member = item.vault_members;

    // Generate HTML certificate
    const certificateHtml = generateCertificateHtml({
      vaultId: item.vault_id,
      title: item.title,
      brand: item.brand,
      model: item.model,
      colorway: item.colorway,
      size: item.size,
      purchaseDate: item.purchase_date,
      purchaseValue: item.purchase_value,
      verifiedAt: item.verified_at,
      ownerName: member?.client_name || "Membro Vault",
      inspectionPhotos: item.inspection_photos || [],
      qrUrl: item.qr_private_url,
    });

    // Return HTML for now - can be converted to PDF with external service
    return new Response(certificateHtml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Error generating certificate:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar certificado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateCertificateHtml(data: {
  vaultId: string;
  title: string;
  brand: string | null;
  model: string | null;
  colorway: string | null;
  size: string | null;
  purchaseDate: string | null;
  purchaseValue: number | null;
  verifiedAt: string | null;
  ownerName: string;
  inspectionPhotos: string[];
  qrUrl: string | null;
}): string {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const qrCodeUrl = data.qrUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qrUrl)}&bgcolor=0a0a0a&color=f59e0b&format=png`
    : null;

  const mainPhoto = data.inspectionPhotos[0] || null;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado Vault - ${data.vaultId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      color: #fff;
      min-height: 100vh;
      padding: 40px;
    }
    
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(180deg, #111 0%, #0a0a0a 100%);
      border: 2px solid #f59e0b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 0 60px rgba(245, 158, 11, 0.15);
    }
    
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      padding: 32px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 14px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #000;
      margin-bottom: 8px;
    }
    
    .header .vault-id {
      font-size: 28px;
      font-weight: 700;
      color: #000;
      font-family: monospace;
    }
    
    .content {
      padding: 40px;
    }
    
    .product-section {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
    }
    
    .product-image {
      width: 200px;
      height: 200px;
      border-radius: 16px;
      overflow: hidden;
      background: #1a1a1a;
      flex-shrink: 0;
    }
    
    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .product-info {
      flex: 1;
    }
    
    .product-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .product-subtitle {
      color: #a1a1aa;
      margin-bottom: 24px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .detail-item {
      background: #1a1a1a;
      padding: 16px;
      border-radius: 12px;
    }
    
    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #71717a;
      margin-bottom: 4px;
    }
    
    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #f59e0b;
    }
    
    .owner-section {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    
    .owner-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #71717a;
      margin-bottom: 8px;
    }
    
    .owner-name {
      font-size: 20px;
      font-weight: 600;
    }
    
    .verification-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid #27272a;
    }
    
    .verification-info {
      flex: 1;
    }
    
    .verification-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #71717a;
      margin-bottom: 4px;
    }
    
    .verification-text {
      font-size: 14px;
      color: #a1a1aa;
    }
    
    .qr-code {
      width: 120px;
      height: 120px;
      background: #0a0a0a;
      border-radius: 12px;
      padding: 8px;
    }
    
    .qr-code img {
      width: 100%;
      height: 100%;
    }
    
    .footer {
      text-align: center;
      padding: 24px;
      background: #0a0a0a;
      border-top: 1px solid #27272a;
    }
    
    .footer-logo {
      font-size: 18px;
      font-weight: 700;
      color: #f59e0b;
      margin-bottom: 8px;
    }
    
    .footer-text {
      font-size: 12px;
      color: #52525b;
    }
    
    .seal {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #000;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    @media print {
      body {
        padding: 0;
        background: #fff;
      }
      .certificate {
        box-shadow: none;
        border: 1px solid #ccc;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>Certificado de autenticidade</h1>
      <div class="vault-id">${data.vaultId}</div>
    </div>
    
    <div class="content">
      <div class="seal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        Autenticidade verificada
      </div>
      
      <div class="product-section">
        ${mainPhoto ? `
        <div class="product-image">
          <img src="${mainPhoto}" alt="${data.title}">
        </div>
        ` : ''}
        
        <div class="product-info">
          <h2 class="product-title">${data.title}</h2>
          <p class="product-subtitle">${[data.brand, data.model].filter(Boolean).join(' • ')}</p>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Tamanho</div>
              <div class="detail-value">${data.size || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Colorway</div>
              <div class="detail-value">${data.colorway || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Data de compra</div>
              <div class="detail-value">${formatDate(data.purchaseDate)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Valor</div>
              <div class="detail-value">${formatCurrency(data.purchaseValue)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="owner-section">
        <div class="owner-label">Proprietário certificado</div>
        <div class="owner-name">${data.ownerName}</div>
      </div>
      
      <div class="verification-section">
        <div class="verification-info">
          <div class="verification-title">Verificação</div>
          <div class="verification-text">
            Este certificado atesta a autenticidade do produto acima,<br>
            verificado pela equipe de curadoria do Bravenza Vault Club<br>
            em ${formatDate(data.verifiedAt)}.
          </div>
        </div>
        
        ${qrCodeUrl ? `
        <div class="qr-code">
          <img src="${qrCodeUrl}" alt="QR Code de verificação">
        </div>
        ` : ''}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">BRAVENZA VAULT CLUB</div>
      <div class="footer-text">
        Este documento é emitido exclusivamente pelo Bravenza Vault Club.<br>
        Verifique a autenticidade em bravenza.com/vault/verify
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
