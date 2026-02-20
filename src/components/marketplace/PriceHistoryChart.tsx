import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, History, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface PricePoint {
  recorded_date: string;
  min_price: number;
  avg_price: number;
  max_price: number;
  offers_count: number;
}

interface PriceHistoryChartProps {
  productId: string;
  cpf?: string;
  className?: string;
}

export function PriceHistoryChart({ productId, cpf, className }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [live, setLive] = useState<{ min: number; max: number; avg: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await marketplaceRequest(cpf || "visitor", "price-history", "GET", undefined, {
          product_id: productId, days: days.toString(),
        });
        setHistory(res.history || []);
        setLive(res.live || null);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [productId, cpf, days]);

  const chartData = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map(p => p.min_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 320;
    const height = 100;
    const pad = 8;

    const points = prices.map((price, i) => {
      const x = pad + (i / (prices.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (price - min) / range) * (height - pad * 2);
      return { x, y, price, date: history[i].recorded_date };
    });

    const pathD = `M${points.map(p => `${p.x},${p.y}`).join(" L")}`;
    const fillD = `${pathD} L${width - pad},${height - pad} L${pad},${height - pad} Z`;

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const trendPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
    const trend = trendPercent < -2 ? "down" : trendPercent > 2 ? "up" : "stable";

    return { points, pathD, fillD, width, height, trend, trendPercent, min, max };
  }, [history]);

  if (loading) {
    return (
      <Card className={cn("card-premium", className)}>
        <CardContent className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData && !live) return null;

  const strokeColor = chartData?.trend === "down" ? "#10b981" : chartData?.trend === "up" ? "#f87171" : "hsl(var(--primary))";
  const fillColor = chartData?.trend === "down" ? "rgba(16,185,129,0.08)" : chartData?.trend === "up" ? "rgba(248,113,113,0.08)" : "rgba(var(--primary-rgb),0.06)";
  const TrendIcon = chartData?.trend === "down" ? TrendingDown : chartData?.trend === "up" ? TrendingUp : Minus;
  const trendColor = chartData?.trend === "down" ? "text-emerald-500" : chartData?.trend === "up" ? "text-red-400" : "text-muted-foreground";

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <Card className={cn("card-premium overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Histórico de Preço
          </CardTitle>
          <div className="flex gap-1">
            {[30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                  days === d ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Live stats */}
        {live && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-emerald-500/5">
              <p className="text-[10px] text-muted-foreground">Menor</p>
              <p className="text-sm font-bold text-emerald-600">{fmt(live.min)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20">
              <p className="text-[10px] text-muted-foreground">Média</p>
              <p className="text-sm font-bold">{fmt(live.avg)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-500/5">
              <p className="text-[10px] text-muted-foreground">Maior</p>
              <p className="text-sm font-bold text-red-400">{fmt(live.max)}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <svg width="100%" viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="rounded-lg">
              <path d={chartData.fillD} fill={fillColor} />
              <path d={chartData.pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Last point dot */}
              {chartData.points.length > 0 && (
                <circle
                  cx={chartData.points[chartData.points.length - 1].x}
                  cy={chartData.points[chartData.points.length - 1].y}
                  r="3" fill={strokeColor}
                />
              )}
            </svg>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {history[0]?.recorded_date} — {history[history.length - 1]?.recorded_date}
              </span>
              <span className={cn("flex items-center gap-0.5 text-xs font-semibold", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                {chartData.trend === "stable" ? "Estável" : `${Math.abs(chartData.trendPercent).toFixed(0)}%`}
              </span>
            </div>
          </motion.div>
        )}

        {!chartData && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Dados históricos serão disponibilizados em breve
          </p>
        )}
      </CardContent>
    </Card>
  );
}
