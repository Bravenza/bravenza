import { useMemo } from "react";
import { ArrowDown, ArrowUp, Minus, BarChart3, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductOffer } from "@/hooks/useMarketplaceCatalog";

interface PriceComparatorProps {
  allOffers: ProductOffer[];
  sizes: string[];
  retailPrice: number | null;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

interface SizeStats {
  size: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  offersCount: number;
  vsRetail: number | null; // percent diff from retail
  trend: "best" | "good" | "neutral" | "high";
}

export function PriceComparator({
  allOffers,
  sizes,
  retailPrice,
  selectedSize,
  onSelectSize,
}: PriceComparatorProps) {
  const sizeStats = useMemo<SizeStats[]>(() => {
    return sizes
      .map((size) => {
        const sizeOffers = allOffers.filter((o) => o.size === size);
        if (sizeOffers.length === 0) return null;

        const prices = sizeOffers.map((o) => o.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const vsRetail = retailPrice ? ((min - retailPrice) / retailPrice) * 100 : null;

        let trend: SizeStats["trend"] = "neutral";
        if (vsRetail !== null) {
          if (vsRetail <= -15) trend = "best";
          else if (vsRetail <= 0) trend = "good";
          else if (vsRetail > 20) trend = "high";
        }

        return {
          size,
          minPrice: min,
          maxPrice: max,
          avgPrice: avg,
          offersCount: sizeOffers.length,
          vsRetail,
          trend,
        };
      })
      .filter(Boolean) as SizeStats[];
  }, [allOffers, sizes, retailPrice]);

  if (sizeStats.length < 2) return null;

  const globalMin = Math.min(...sizeStats.map((s) => s.minPrice));

  const trendColors: Record<SizeStats["trend"], string> = {
    best: "text-emerald-500",
    good: "text-emerald-400",
    neutral: "text-muted-foreground",
    high: "text-red-400",
  };

  const trendBg: Record<SizeStats["trend"], string> = {
    best: "bg-emerald-500/10",
    good: "bg-emerald-500/5",
    neutral: "bg-muted/10",
    high: "bg-red-500/5",
  };

  return (
    <div className="bg-white rounded-2xl border border-border/20 p-6">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-1 tracking-tight">
        <Scale className="h-4 w-4 text-primary" />
        Comparador de Preços por Tamanho
      </h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        Compare os melhores preços disponíveis em cada tamanho
      </p>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/20">
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Tam.</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Menor</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Média</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Ofertas</th>
              {retailPrice && (
                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">vs Varejo</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sizeStats.map((stat) => {
              const isBest = stat.minPrice === globalMin;
              const isSelected = stat.size === selectedSize;
              return (
                <tr
                  key={stat.size}
                  onClick={() => onSelectSize(stat.size)}
                  className={cn(
                    "border-b border-border/10 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/20",
                    isBest && !isSelected && trendBg[stat.trend]
                  )}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-semibold", isSelected && "text-primary")}>
                        {stat.size}
                      </span>
                      {isBest && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                          Melhor
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={cn("font-bold", isBest ? "text-emerald-600" : "text-foreground")}>
                      R$ {stat.minPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground hidden sm:table-cell">
                    R$ {stat.avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-muted-foreground">{stat.offersCount}</span>
                  </td>
                  {retailPrice && (
                    <td className="py-2.5 px-3 text-right">
                      {stat.vsRetail !== null && (
                        <span className={cn("flex items-center justify-end gap-0.5 text-xs font-semibold", trendColors[stat.trend])}>
                          {stat.vsRetail < 0 ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : stat.vsRetail > 0 ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {Math.abs(stat.vsRetail).toFixed(0)}%
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
