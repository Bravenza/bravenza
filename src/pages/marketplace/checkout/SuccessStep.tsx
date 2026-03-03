import { motion } from "framer-motion";
import { CheckCircle2, Copy, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useCountdown } from "./useCountdown";
import type { CartGroup } from "@/hooks/useMarketplaceCart";

interface SuccessStepProps {
  paymentMethod: string;
  orderCodes: string[];
  group: CartGroup;
  pixData: { qr_code?: string; copy_paste?: string; expiration?: string } | null;
}

export function SuccessStep({ paymentMethod, orderCodes, group, pixData }: SuccessStepProps) {
  const navigate = useNavigate();
  const [pixCopied, setPixCopied] = useState(false);
  const { remaining: pixTimer, isExpired: pixExpired } = useCountdown(pixData?.expiration || null);

  const handleCopyPix = () => {
    if (pixData?.copy_paste) {
      navigator.clipboard.writeText(pixData.copy_paste);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  return (
    <div className="bg-background rounded-2xl border border-border/20 p-8 space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 mb-4"
        >
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </motion.div>
        <h2 className="font-bold text-xl mb-1">
          {paymentMethod === "pix" ? "PIX gerado!" : "Pagamento aprovado!"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {orderCodes.length} pedido{orderCodes.length !== 1 ? "s" : ""} criado{orderCodes.length !== 1 ? "s" : ""} — pagamento único consolidado
        </p>
      </div>

      {paymentMethod === "pix" && pixData?.copy_paste && (
        <div className="space-y-3">
          {pixData.expiration && (
            <div className={cn(
              "flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium border",
              pixExpired
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-accent/50 text-accent-foreground border-accent/30"
            )}>
              <Timer className="h-4 w-4" />
              {pixExpired ? "PIX expirado — gere um novo" : `Expira em ${pixTimer}`}
            </div>
          )}

          {pixData.qr_code && (
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${pixData.qr_code}`}
                alt="QR Code PIX"
                className="w-48 h-48 rounded-xl border border-border/20"
              />
            </div>
          )}

          <div className="relative">
            <Input readOnly value={pixData.copy_paste} className="pr-20 text-xs font-mono" />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1 h-7 text-xs gap-1"
              onClick={handleCopyPix}
            >
              {pixCopied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {pixCopied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            ✅ Pagamento único para todos os itens. Escaneie o QR Code ou copie o código PIX.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {orderCodes.map((code, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/10">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                {group.items[i]?.offer?.product ? `${group.items[i].offer!.product!.brand} ${group.items[i].offer!.product!.model}` : "Item"}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px]">{code}</Badge>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => navigate("/app/pedidos")}>
          Ver meus pedidos
        </Button>
        <Button className="flex-1 btn-gold rounded-xl h-11" onClick={() => navigate("/app")}>
          Continuar comprando
        </Button>
      </div>
    </div>
  );
}
