import { TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetailComparisonProps {
  currentPrice: number | null;
  retailPrice: number | null;
}

export function RetailComparison({ currentPrice, retailPrice }: RetailComparisonProps) {
  if (!currentPrice || !retailPrice || retailPrice <= 0) return null;

  const diff = ((currentPrice - retailPrice) / retailPrice) * 100;
  const absDiff = Math.abs(diff);

  // Only show when below retail
  if (diff >= 0 || absDiff < 1) return null;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
      "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
    )}>
      <TrendingDown className="h-3.5 w-3.5" />
      <span>
        {absDiff.toFixed(0)}% abaixo do varejo
      </span>
    </div>
  );
}
