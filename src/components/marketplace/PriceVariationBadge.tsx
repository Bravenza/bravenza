import { TrendingDown, TrendingUp } from "lucide-react";
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

  if (absDiff < 1) return null;

  const isBelow = diff < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold",
        isBelow
          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
          : "bg-red-500/15 text-red-500 border border-red-500/20",
        className
      )}
    >
      {isBelow ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
      {isBelow ? "-" : "+"}{absDiff.toFixed(0)}%
    </span>
  );
}
