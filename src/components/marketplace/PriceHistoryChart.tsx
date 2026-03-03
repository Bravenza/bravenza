import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, History, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { useConfig } from "@/hooks/useConfig";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PERIODS = [
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 365, label: "1a" },
] as const;

export function PriceHistoryChart({ productId, cpf, className }: PriceHistoryChartProps) {
  const { isEnabled } = useConfig();
  const isV2 = isEnabled("enable_price_history_v2");

  const [history, setHistory] = useState<PricePoint[]>([]);
  const [live, setLive] = useState<{ min: number; max: number; avg: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; price: number; date: string; idx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const res = await marketplaceRequest(cpf || "visitor", "price-history", "GET", undefined, {
          product_id: productId, days: days.toString(),
        });
        setHistory(res.history || []);
        setLive(res.live || null);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [productId, cpf, days]);

  // Compute chart geometry
  const chartData = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map(p => p.min_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 320;
    const height = 120;
    const pad = 12;

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
    const trend: "down" | "up" | "stable" = trendPercent < -2 ? "down" : trendPercent > 2 ? "up" : "stable";

    // Check if current price is 90-day low
    const is90DayLow = live && history.length > 7 && live.min <= Math.min(...prices);

    return { points, pathD, fillD, width, height, trend, trendPercent, min, max, is90DayLow };
  }, [history, live]);

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

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData || !svgRef.current || !isV2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartData.width;
    // Find nearest point
    let closest = chartData.points[0];
    let closestIdx = 0;
    let closestDist = Infinity;
    chartData.points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < closestDist) { closestDist = dist; closest = p; closestIdx = i; }
    });
    if (closestDist < 20) {
      setTooltip({ x: closest.x, y: closest.y, price: closest.price, date: closest.date, idx: closestIdx });
    } else {
      setTooltip(null);
    }
  };

  const formatDateStr = (d: string) => {
    try { return format(parseISO(d), "dd MMM yyyy", { locale: ptBR }); } catch { return d; }
  };

  return (
    <Card className={cn("card-premium overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Histórico de Preço
            </CardTitle>
            {isV2 && chartData?.is90DayLow && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[10px] px-1.5 py-0">
                <Award className="h-3 w-3" />
                Menor preço 90d
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {(isV2 ? PERIODS : PERIODS.slice(0, 2)).map(p => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                  days === p.days ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats cards */}
        {live && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] text-muted-foreground">Menor</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(live.min)}</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-[10px] text-muted-foreground">Média</p>
              <p className="text-sm font-bold">{fmt(live.avg)}</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
              <p className="text-[10px] text-muted-foreground">Maior</p>
              <p className="text-sm font-bold text-red-400">{fmt(live.max)}</p>
            </div>
          </div>
        )}

        {/* Chart with interactive tooltip */}
        {chartData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <svg
              ref={svgRef}
              width="100%"
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="rounded-lg cursor-crosshair"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setTooltip(null)}
            >
              <path d={chartData.fillD} fill={fillColor} />
              <path d={chartData.pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Tooltip vertical line + dot */}
              {isV2 && tooltip && (
                <>
                  <line x1={tooltip.x} y1={12} x2={tooltip.x} y2={chartData.height - 12} stroke={strokeColor} strokeWidth="1" strokeDasharray="3,3" opacity={0.4} />
                  <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={strokeColor} stroke="hsl(var(--card))" strokeWidth="2" />
                </>
              )}

              {/* Last point (when no tooltip) */}
              {(!tooltip || !isV2) && chartData.points.length > 0 && (
                <circle
                  cx={chartData.points[chartData.points.length - 1].x}
                  cy={chartData.points[chartData.points.length - 1].y}
                  r="3" fill={strokeColor}
                />
              )}
            </svg>

            {/* Floating tooltip */}
            {isV2 && tooltip && (
              <div
                className="absolute pointer-events-none bg-card border border-border/50 rounded-lg px-2.5 py-1.5 shadow-lg z-10 -translate-x-1/2"
                style={{
                  left: `${(tooltip.x / chartData.width) * 100}%`,
                  top: `${Math.max(0, (tooltip.y / chartData.height) * 100 - 30)}%`,
                }}
              >
                <p className="text-[10px] text-muted-foreground">{formatDateStr(tooltip.date)}</p>
                <p className="text-xs font-bold">{fmt(tooltip.price)}</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {formatDateStr(history[0]?.recorded_date)} — {formatDateStr(history[history.length - 1]?.recorded_date)}
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

        {/* Offers count */}
        {live && live.count > 0 && (
          <p className="text-[10px] text-muted-foreground text-center">
            {live.count} oferta{live.count !== 1 ? "s" : ""} ativa{live.count !== 1 ? "s" : ""} agora
          </p>
        )}
      </CardContent>
    </Card>
  );
}
