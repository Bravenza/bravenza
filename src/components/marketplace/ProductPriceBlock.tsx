import { useState } from "react";
import { generateInstallmentOptions, formatPriceBR } from "@/lib/budget-calculator";
import { ChevronDown, ChevronUp, CreditCard, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductPriceBlockProps {
  displayPrice: number | null;
  showPrefix: boolean;
}

export function ProductPriceBlock({ displayPrice, showPrefix }: ProductPriceBlockProps) {
  const [showInstallments, setShowInstallments] = useState(false);

  if (!displayPrice) {
    return <p className="text-3xl font-black text-foreground tracking-tight">Sem ofertas</p>;
  }

  const installments12 = generateInstallmentOptions(displayPrice).find(o => o.installments === 12);

  return (
    <div className="space-y-2">
      {showPrefix && (
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">A partir de</span>
      )}
      <p className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
        R$ {displayPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {installments12 && (
          <span className="inline-flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5" />
            12x de <span className="font-semibold text-foreground">{formatPriceBR(installments12.installmentValue)}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <QrCode className="h-3.5 w-3.5" />
          PIX à vista
        </span>
      </div>
      <button
        onClick={() => setShowInstallments(!showInstallments)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium mt-1"
      >
        {showInstallments ? "Ocultar parcelas" : "Ver todas as parcelas"}
        {showInstallments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <AnimatePresence>
        {showInstallments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 bg-muted/10 rounded-xl border border-border/20 space-y-1.5">
              {generateInstallmentOptions(displayPrice).map((opt) => (
                <div key={opt.installments} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {opt.installments}x de <span className="font-semibold text-foreground">{formatPriceBR(opt.installmentValue)}</span>
                  </span>
                  <span className="text-muted-foreground/50">
                    {opt.installments === 1 ? "sem juros" : `total ${formatPriceBR(opt.totalWithInterest)}`}
                  </span>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground/50 pt-2 border-t border-border/20 mt-2">
                PIX à vista: {formatPriceBR(displayPrice)} · Cartão 1x sem juros
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
