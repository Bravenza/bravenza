import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceDot,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SellerOffer {
  id: string;
  price: number;
  product_id: string;
  product?: { brand: string; model: string; images?: string[] | null };
}

interface PricePoint {
  recorded_date: string;
  min_price: number;
  avg_price: number;
  max_price: number;
}

interface ProductHistory {
  offer: SellerOffer;
  history: PricePoint[];
  live: { min: number; avg: number; max: number; count: number } | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });

function computeTrend(history: PricePoint[]): "up" | "down" | "stable" {
  if (history.length < 2) return "stable";
  const first = history[0].min_price;
  const last = history[history.length - 1].min_price;
  const pct = ((last - first) / first) * 100;
  return pct > 2 ? "up" : pct < -2 ? "down" : "stable";
}

const TREND_CFG = {
  up: { icon: TrendingUp, label: "↑ Subindo", color: "text-destructive" },
  down: { icon: TrendingDown, label: "↓ Caindo", color: "text-emerald-500" },
  stable: { icon: Minus, label: "→ Estável", color: "text-muted-foreground" },
} as const;

export function SellerPriceCharts({ cpf }: { cpf: string }) {
  const [items, setItems] = useState<ProductHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Get seller profile
        const { data: profile } = await supabase
          .from("client_profiles")
          .select("cpf")
          .eq("cpf", cpf)
          .maybeSingle();

        // Get seller's active offers with product info
        const { data: sp } = await supabase
          .from("vault_seller_profiles" as any)
          .select("id")
          .eq("cpf", cpf)
          .maybeSingle();

        if (!sp) { setLoading(false); return; }

        const { data: offers } = await supabase
          .from("marketplace_offers")
          .select("id, price, product_id, product:marketplace_products!inner(brand, model, images)")
          .eq("seller_id", (sp as any).id)
          .eq("status", "active")
          .limit(6);

        if (!offers || offers.length === 0) { setLoading(false); return; }

        // Dedupe by product_id, keep cheapest offer
        const byProduct = new Map<string, SellerOffer>();
        for (const o of offers) {
          const existing = byProduct.get(o.product_id);
          if (!existing || o.price < existing.price) {
            byProduct.set(o.product_id, {
              id: o.id,
              price: o.price,
              product_id: o.product_id,
              product: o.product as any,
            });
          }
        }

        // Fetch price history for each product
        const results: ProductHistory[] = [];
        await Promise.all(
          Array.from(byProduct.values()).map(async (offer) => {
            try {
              const res = await marketplaceRequest(cpf, "price-history", "GET", undefined, {
                product_id: offer.product_id,
                days: "90",
              });
              results.push({
                offer,
                history: res.history || [],
                live: res.live || null,
              });
            } catch { /* skip */ }
          })
        );

        setItems(results.filter(r => r.history.length >= 2));
      } catch (err) {
        console.error("SellerPriceCharts error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cpf]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-blue-500/40 via-blue-500/20 to-transparent" />
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
          <BarChart3 className="h-3.5 w-3.5" /> Histórico de preços
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {items.map((item) => (
          <MiniPriceChart key={item.offer.product_id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

function MiniPriceChart({ item }: { item: ProductHistory }) {
  const { offer, history, live } = item;
  const trend = computeTrend(history);
  const trendCfg = TREND_CFG[trend];
  const TrendIcon = trendCfg.icon;

  const chartData = history.map((p) => ({
    date: p.recorded_date,
    min: p.min_price,
    label: format(parseISO(p.recorded_date), "dd/MM", { locale: ptBR }),
  }));

  // Add seller price as reference on last point
  const lastPoint = chartData[chartData.length - 1];

  const productName = offer.product
    ? `${offer.product.brand} ${offer.product.model}`
    : "Produto";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold truncate max-w-[65%]">{productName}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-border/40 font-mono">
            Seu: {fmt(offer.price)}
          </Badge>
          <span className={cn("flex items-center gap-0.5 text-[10px] font-semibold", trendCfg.color)}>
            <TrendIcon className="h-3 w-3" />
            {trendCfg.label}
          </span>
        </div>
      </div>

      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
            <RTooltip
              contentStyle={{
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
              formatter={(value: number) => [fmt(value), "Menor preço"]}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="min"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "hsl(217 91% 60%)" }}
            />
            {lastPoint && (
              <ReferenceDot
                x={lastPoint.label}
                y={offer.price}
                r={5}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {live && (
        <div className="flex gap-3 text-[10px]">
          <span className="text-muted-foreground">
            Menor: <span className="font-semibold text-emerald-500">{fmt(live.min)}</span>
          </span>
          <span className="text-muted-foreground">
            Média: <span className="font-semibold text-foreground">{fmt(live.avg)}</span>
          </span>
          <span className="text-muted-foreground">
            {live.count} oferta{live.count !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
