import { motion } from "framer-motion";
import { QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface CertificateQRCodeProps {
  code: string;
  verificationUrl: string;
}

export function CertificateQRCode({ code, verificationUrl }: CertificateQRCodeProps) {
  const [copied, setCopied] = useState(false);
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}&bgcolor=1a1a1a&color=FFD700&format=png`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(verificationUrl);
    if (copied) {
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Erro ao copiar");
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-gradient-to-br from-black/40 to-black/20 rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <QrCode className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">QR Code do certificado</h3>
          <p className="text-sm text-muted-foreground">Escaneie ou compartilhe</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* QR Code */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative bg-[#1a1a1a] p-4 rounded-xl border-2 border-primary/30">
            <img
              src={qrCodeUrl}
              alt="QR Code do certificado"
              className="w-36 h-36 md:w-44 md:h-44"
            />
          </div>
          
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg -translate-x-1 -translate-y-1" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg translate-x-1 -translate-y-1" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg -translate-x-1 translate-y-1" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg translate-x-1 translate-y-1" />
        </div>

        {/* Info and actions */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Compartilhe este certificado
            </p>
            <p className="text-xs text-muted-foreground/70">
              Qualquer pessoa pode verificar a autenticidade do seu produto escaneando este QR Code ou acessando o link abaixo
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Link de verificação</p>
            <p className="text-sm font-mono text-primary/80 break-all">
              {verificationUrl}
            </p>
          </div>

          <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/30 hover:bg-primary/10"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar link
                </>
              )}
            </Button>
        </div>
      </div>
    </motion.div>
  );
}
