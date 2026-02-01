import { useState } from "react";
import { motion } from "framer-motion";
import { FileDown, Loader2, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CertificateData {
  order_id: string;
  product: {
    name: string;
    brand: string | null;
    model: string | null;
    size: string | null;
    color: string | null;
  };
  client_name: string;
  purchase_date: string;
  verification_count: number;
  verified_at: string;
}

interface CertificateDownloadProps {
  certificate: CertificateData;
  code: string;
}

export function CertificateDownload({ certificate, code }: CertificateDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create a printable HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Certificado de Autenticidade - ${code}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              background: #000;
              color: #fff;
              min-height: 100vh;
              padding: 40px;
            }
            
            .certificate {
              max-width: 800px;
              margin: 0 auto;
              background: linear-gradient(135deg, #1a1a1a, #0d0d0d);
              border: 2px solid #FFD700;
              border-radius: 16px;
              padding: 48px;
              position: relative;
              overflow: hidden;
            }
            
            .certificate::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #FFD700;
              letter-spacing: 4px;
              margin-bottom: 8px;
            }
            
            .title {
              font-size: 24px;
              color: #fff;
              margin-bottom: 8px;
            }
            
            .subtitle {
              color: #888;
              font-size: 14px;
            }
            
            .seal {
              text-align: center;
              margin: 32px 0;
            }
            
            .seal-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: rgba(34, 197, 94, 0.15);
              border: 1px solid rgba(34, 197, 94, 0.3);
              padding: 12px 24px;
              border-radius: 50px;
              color: #22c55e;
              font-weight: 600;
            }
            
            .content {
              margin: 32px 0;
            }
            
            .section {
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid #333;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 20px;
            }
            
            .section-title {
              color: #FFD700;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 12px;
            }
            
            .product-name {
              font-size: 22px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 12px;
            }
            
            .tags {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
            
            .tag {
              background: rgba(255, 215, 0, 0.1);
              border: 1px solid rgba(255, 215, 0, 0.2);
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              color: #FFD700;
            }
            
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            
            .info-block {
              background: rgba(0, 0, 0, 0.2);
              padding: 16px;
              border-radius: 8px;
            }
            
            .info-label {
              color: #888;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            
            .info-value {
              color: #fff;
              font-weight: 500;
            }
            
            .code-section {
              background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
              border: 1px solid rgba(255, 215, 0, 0.3);
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            
            .code {
              font-family: monospace;
              font-size: 24px;
              font-weight: 700;
              color: #FFD700;
              letter-spacing: 4px;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 24px;
              border-top: 1px solid #333;
            }
            
            .footer-text {
              color: #666;
              font-size: 12px;
            }
            
            .qr-note {
              margin-top: 16px;
              color: #888;
              font-size: 11px;
            }
            
            @media print {
              body {
                padding: 0;
                background: #fff;
              }
              .certificate {
                border: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="logo">BRAVENZA</div>
              <div class="title">Certificado de Autenticidade</div>
              <div class="subtitle">Documento oficial de verificação de produto</div>
            </div>
            
            <div class="seal">
              <div class="seal-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                AUTENTICIDADE VERIFICADA
              </div>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">Produto Certificado</div>
                <div class="product-name">${certificate.product.name}</div>
                <div class="tags">
                  ${certificate.product.brand ? `<span class="tag">${certificate.product.brand}</span>` : ""}
                  ${certificate.product.model ? `<span class="tag">${certificate.product.model}</span>` : ""}
                  ${certificate.product.size ? `<span class="tag">Tamanho ${certificate.product.size}</span>` : ""}
                  ${certificate.product.color ? `<span class="tag">${certificate.product.color}</span>` : ""}
                </div>
              </div>
              
              <div class="grid">
                <div class="info-block">
                  <div class="info-label">Proprietário</div>
                  <div class="info-value">${certificate.client_name.split(" ")[0]} ***</div>
                </div>
                <div class="info-block">
                  <div class="info-label">Data de Aquisição</div>
                  <div class="info-value">${formatDate(certificate.purchase_date)}</div>
                </div>
                <div class="info-block">
                  <div class="info-label">ID do Pedido</div>
                  <div class="info-value">#${certificate.order_id.substring(0, 8).toUpperCase()}</div>
                </div>
                <div class="info-block">
                  <div class="info-label">Verificações</div>
                  <div class="info-value">${certificate.verification_count} verificação(ões)</div>
                </div>
              </div>
              
              <div class="code-section">
                <div class="section-title">Código de Certificação</div>
                <div class="code">${code}</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                Este certificado comprova que o produto passou por rigorosa verificação de autenticidade.
              </div>
              <div class="qr-note">
                Verifique online em: bravenza.lovable.app/autenticidade/${code}
              </div>
              <div class="footer-text" style="margin-top: 16px;">
                © ${new Date().getFullYear()} Bravenza. Todos os direitos reservados.
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          setIsGenerated(true);
          toast.success("Certificado pronto para impressão/download!");
        }, 500);
      } else {
        throw new Error("Popup blocked");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erro ao gerar certificado. Verifique se popups estão permitidos.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-gradient-to-br from-black/40 to-black/20 rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Certificado para download</h3>
          <p className="text-sm text-muted-foreground">Salve uma cópia do seu certificado</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Baixe o certificado de autenticidade em formato PDF para guardar ou compartilhar. 
        O documento contém todas as informações de verificação do seu produto.
      </p>

      <Button
        onClick={generatePDF}
        disabled={isGenerating}
        className="w-full h-12 bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Gerando certificado...
          </>
        ) : isGenerated ? (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Certificado gerado!
          </>
        ) : (
          <>
            <FileDown className="h-5 w-5 mr-2" />
            Baixar certificado PDF
          </>
        )}
      </Button>
    </motion.div>
  );
}
