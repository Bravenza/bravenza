import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ProductOffer } from "@/hooks/useMarketplaceCatalog";

interface SizePriceGridProps {
  allOffers: ProductOffer[];
  sizes: string[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  conditionFilter: "all" | "novo" | "usado";
}

export function SizePriceGrid({ allOffers, sizes, selectedSize, onSelectSize, conditionFilter }: SizePriceGridProps) {
  const sizeMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const offer of allOffers) {
      if (conditionFilter === "novo" && offer.condition !== "novo") continue;
      if (conditionFilter === "usado" && offer.condition === "novo") continue;
      const current = map[offer.size];
      if (current === undefined || offer.price < current) {
        map[offer.size] = offer.price;
      }
    }
    return map;
  }, [allOffers, conditionFilter]);

  const filteredSizes = sizes.filter((s) => sizeMap[s] !== undefined);

  if (filteredSizes.length === 0) return null;

  return (
    <div>
      <label className="sr-only">
        Selecione o tamanho
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {filteredSizes.map((size) => {
          const price = sizeMap[size];
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              onClick={() => onSelectSize(size)}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2.5 rounded-xl border text-center transition-all",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/30 hover:border-primary/30 hover:bg-muted/10"
              )}
            >
              <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                {size}
              </span>
              {price !== undefined && (
                <span className={cn("text-[10px] mt-0.5", isSelected ? "text-primary/80" : "text-muted-foreground")}>
                  R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
