import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetailComparisonProps {
  currentPrice: number | null;
  retailPrice: number | null;
}

export function RetailComparison({ currentPrice, retailPrice }: RetailComparisonProps) {
  if (!currentPrice || !retailPrice || retailPrice <= 0) return null;

  const diff = ((currentPrice - retailPrice) / retailPrice) * 100;
  const absDiff = Math.abs(diff);

  if (absDiff < 1) return null; // too small to show

  const isBelow = diff < 0;
  const isAbove = diff > 0;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
      isBelow
        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
        : "bg-red-500/10 text-red-500 border border-red-500/20"
    )}>
      {isBelow ? (
        <TrendingDown className="h-3.5 w-3.5" />
      ) : (
        <TrendingUp className="h-3.5 w-3.5" />
      )}
      <span>
        {absDiff.toFixed(0)}% {isBelow ? "abaixo" : "acima"} do varejo
      </span>
    </div>
  );
}
