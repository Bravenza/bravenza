import { useState } from "react";
import { generateInstallmentOptions, formatPriceBR } from "@/lib/budget-calculator";

interface ProductPriceBlockProps {
  displayPrice: number | null;
  showPrefix: boolean;
}

export function ProductPriceBlock({ displayPrice, showPrefix }: ProductPriceBlockProps) {
  const [showInstallments, setShowInstallments] = useState(false);

  if (!displayPrice) {
    return <p className="text-3xl font-bold text-foreground">Sem ofertas</p>;
  }

  const installments12 = generateInstallmentOptions(displayPrice).find(o => o.installments === 12);

  return (
    <div className="space-y-1">
      {showPrefix && (
        <span className="text-xs text-muted-foreground">A partir de</span>
      )}
      <p className="text-3xl font-bold text-foreground">
        R$ {displayPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
      {installments12 && (
        <p className="text-sm text-muted-foreground">
          ou <span className="font-medium text-foreground">12x de {formatPriceBR(installments12.installmentValue)}</span>
        </p>
      )}
      <button
        onClick={() => setShowInstallments(!showInstallments)}
        className="text-xs text-primary hover:underline mt-0.5"
      >
        {showInstallments ? "Ocultar parcelas" : "Ver todas as parcelas"}
      </button>
      {showInstallments && (
        <div className="mt-2 p-3 bg-muted/20 rounded-xl border border-border/30 space-y-1">
          {generateInstallmentOptions(displayPrice).map((opt) => (
            <div key={opt.installments} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {opt.installments}x de <span className="font-medium text-foreground">{formatPriceBR(opt.installmentValue)}</span>
              </span>
              <span className="text-muted-foreground/60">
                {opt.installments === 1 ? "sem juros" : `total ${formatPriceBR(opt.totalWithInterest)}`}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/50 pt-1 border-t border-border/20 mt-1">
            PIX à vista: {formatPriceBR(displayPrice)} · Cartão 1x sem juros
          </p>
        </div>
      )}
    </div>
  );
}
