import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductAnalytics } from "./ProductAnalyticsChart";

interface PriceSparklineProps {
  analytics: ProductAnalytics | null;
  isLoading: boolean;
}

export function PriceSparkline({ analytics, isLoading }: PriceSparklineProps) {
  const points = useMemo(() => {
    if (!analytics?.price_history?.length) return [];
    return analytics.price_history.slice(-14); // last 14 data points
  }, [analytics]);

  if (isLoading) {
    return <div className="h-8 w-24 bg-muted/20 rounded animate-pulse" />;
  }

  if (points.length < 2 || !analytics) return null;

  // Build SVG path
  const prices = points.map((p) => p.min_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 2;

  const pathPoints = prices.map((price, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (price - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M${pathPoints.join(" L")}`;
  const fillD = `${pathD} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  const TrendIcon =
    analytics.price_trend === "down" ? TrendingDown
    : analytics.price_trend === "up" ? TrendingUp
    : Minus;

  const trendColor =
    analytics.price_trend === "down" ? "text-emerald-500"
    : analytics.price_trend === "up" ? "text-red-400"
    : "text-muted-foreground";

  const strokeColor =
    analytics.price_trend === "down" ? "#10b981"
    : analytics.price_trend === "up" ? "#f87171"
    : "hsl(var(--muted-foreground))";

  const fillColor =
    analytics.price_trend === "down" ? "rgba(16,185,129,0.1)"
    : analytics.price_trend === "up" ? "rgba(248,113,113,0.1)"
    : "rgba(128,128,128,0.05)";

  return (
    <div className="flex items-center gap-2 mt-1">
      <svg width={width} height={height} className="flex-shrink-0">
        <path d={fillD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={cn("flex items-center gap-0.5 text-[11px] font-semibold", trendColor)}>
        <TrendIcon className="h-3 w-3" />
        {analytics.price_trend === "stable"
          ? "Estável"
          : `${analytics.trend_percent.toFixed(0)}%`}
      </div>
      <span className="text-[10px] text-muted-foreground">30d</span>
    </div>
  );
}
