import { useMemo } from "react";
import { TrendingDown, TrendingUp, BarChart3, Activity, DollarSign, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PricePoint {
  date: string;
  min_price: number;
  avg_price: number;
  max_price: number;
  offers_count: number;
}

export interface ProductAnalytics {
  price_history: PricePoint[];
  total_sold: number;
  avg_sale_price: number | null;
  price_trend: "up" | "down" | "stable";
  trend_percent: number;
}

interface ProductAnalyticsChartProps {
  analytics: ProductAnalytics | null;
  isLoading: boolean;
  productName?: string;
}

export function ProductAnalyticsChart({
  analytics,
  isLoading,
  productName,
}: ProductAnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (!analytics?.price_history?.length) return [];
    return analytics.price_history.map((p) => ({
      ...p,
      label: format(parseISO(p.date), "dd/MM", { locale: ptBR }),
    }));
  }, [analytics]);

  if (isLoading) {
    return (
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="h-48 bg-muted/20 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics || chartData.length === 0) {
    return null;
  }

  const TrendIcon = analytics.price_trend === "down" ? TrendingDown : TrendingUp;
  const trendColor =
    analytics.price_trend === "down"
      ? "text-emerald-400"
      : analytics.price_trend === "up"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
        <BarChart3 className="h-4 w-4 text-primary" />
        Histórico de preços
      </h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-muted/20 rounded-xl border border-border/30 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">
            {analytics.avg_sale_price
              ? `R$ ${analytics.avg_sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
              : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">Preço médio</p>
        </div>
        <div className="p-3 bg-muted/20 rounded-xl border border-border/30 text-center">
          <ShoppingBag className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{analytics.total_sold}</p>
          <p className="text-[10px] text-muted-foreground">Vendidos</p>
        </div>
        <div className="p-3 bg-muted/20 rounded-xl border border-border/30 text-center">
          <TrendIcon className={cn("h-4 w-4 mx-auto mb-1", trendColor)} />
          <p className={cn("text-lg font-bold", trendColor)}>
            {analytics.price_trend === "stable"
              ? "0%"
              : `${analytics.price_trend === "down" ? "-" : "+"}${analytics.trend_percent.toFixed(0)}%`}
          </p>
          <p className="text-[10px] text-muted-foreground">Tendência 30d</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card className="card-premium overflow-hidden">
          <CardContent className="p-3 pb-1">
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Histórico de preços (últimos 90 dias)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    `R$ ${value.toLocaleString("pt-BR")}`,
                    name === "min_price" ? "Mínimo" : name === "avg_price" ? "Médio" : "Máximo",
                  ]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="min_price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="avg_price"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="none"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
