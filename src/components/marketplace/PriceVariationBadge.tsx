import { TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceVariationBadgeProps {
  currentPrice: number | null;
  retailPrice: number | null;
  className?: string;
}

export function PriceVariationBadge({ currentPrice, retailPrice, className }: PriceVariationBadgeProps) {
  if (!currentPrice || !retailPrice || retailPrice <= 0) return null;

  const diff = ((currentPrice - retailPrice) / retailPrice) * 100;
  const absDiff = Math.abs(diff);

  // Only show when below retail (positive diff = above retail, hide it)
  if (diff >= 0 || absDiff < 1) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20",
        className
      )}
    >
      <TrendingDown className="h-2.5 w-2.5" />
      -{absDiff.toFixed(0)}%
    </span>
  );
}
