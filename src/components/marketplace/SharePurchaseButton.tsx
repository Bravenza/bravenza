import { memo, useCallback } from "react";
import { Share2, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useState } from "react";

interface SharePurchaseButtonProps {
  productName: string;
  productImage?: string;
  orderCode?: string;
  className?: string;
}

function SharePurchaseButtonComponent({ productName, productImage, orderCode, className }: SharePurchaseButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = "https://bravenza.com.br/marketplace";
  const shareText = `🔥 Acabei de garantir meu par de ${productName} na BRAVENZA! Cada par é autenticado e certificado. Confira: ${shareUrl}`;

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comprei ${productName} na BRAVENZA!`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }, [productName, shareText]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Texto copiado!");
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  }, [shareText]);

  // Use native share if available (mobile)
  if (navigator.share) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={handleNativeShare}
      >
        <Share2 className="h-3.5 w-3.5 mr-1.5" />
        Compartilhar compra
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Compartilhar compra
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar texto"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const SharePurchaseButton = memo(SharePurchaseButtonComponent);
