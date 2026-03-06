import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, DollarSign, TrendingUp, Users, Package, AlertTriangle,
  ShoppingBag, ArrowUpRight, ArrowDownRight, Store, ShieldCheck,
  Crown, Percent, Activity, Eye, Download, Trophy, CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-order-ops`;

interface MarketplaceMetrics {
  gmv: number;
  totalOrders: number;
  totalSellers: number;
  activeSellers: number;
  activeListings: number;
  takeRate: number;
  platformRevenue: number;
  openDisputes: number;
  avgOrderValue: number;
  conversionRate: number;
  sellersByTier: { tier: string; count: number }[];
  topProducts: { name: string; brand: string; sales: number; revenue: number }[];
  monthlyGMV: { month: string; gmv: number; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topSellers: { name: string; plan: string; sales: number; revenue: number; rating: number; fee: number }[];
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TIER_COLORS: Record<string, string> = {
  free: "hsl(var(--muted-foreground))",
  starter: "hsl(38, 92%, 50%)",
  pro: "hsl(var(--primary))",
  elite: "hsl(190, 90%, 50%)",
};

const STATUS_COLORS = [
  "hsl(var(--primary))", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)",
  "hsl(var(--destructive))", "hsl(262, 83%, 58%)", "hsl(190, 90%, 50%)",
];

type PeriodFilter = "current" | "last" | "quarter" | "year" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(period: PeriodFilter, custom: DateRange): DateRange {
  const now = new Date();
  switch (period) {
    case "current": return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last": { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
    case "quarter": return { start: subMonths(now, 3), end: now };
    case "year": return { start: new Date(now.getFullYear(), 0, 1), end: now };
    case "custom": return custom;
  }
}

function getPreviousRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - duration), end: new Date(range.start.getTime() - 1) };
}

export default function MarketplaceAnalyticsPage() {
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [rawSellers, setRawSellers] = useState<any[]>([]);
  const [rawListings, setRawListings] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("current");
  const [customRange, setCustomRange] = useState<DateRange>({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });

  const dateRange = useMemo(() => getDateRange(periodFilter, customRange), [periodFilter, customRange]);
  const prevRange = useMemo(() => getPreviousRange(dateRange), [dateRange]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      
      const [ordersRes, sellersRes, listingsRes, productsRes] = await Promise.all([
        fetch(`${FUNCTION_URL}?action=admin-orders&status=all`, { headers }).then(r => r.json()),
        supabase.from("vault_seller_profiles").select("id, plan_id, total_sales_count, total_sales_value, current_fee_percent, kyc_status"),
        supabase.from("marketplace_offers").select("id, status, price, views_count").eq("status", "active"),
        supabase.from("marketplace_products").select("id, brand, model, total_offers, lowest_price").eq("is_active", true).order("total_offers", { ascending: false }).limit(10),
      ]);

      setRawOrders(ordersRes.orders || []);
      setRawSellers(sellersRes.data || []);
      setRawListings(listingsRes.data || []);
      setRawProducts(productsRes.data || []);
    } catch (err) {
      console.error("Error fetching marketplace data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByRange = (orders: any[], range: DateRange) =>
    orders.filter((o: any) => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      return d >= range.start && d <= range.end;
    });

  const computeMetrics = (orders: any[], sellers: any[], listings: any[], products: any[]): MarketplaceMetrics => {
    const completedOrders = orders.filter((o: any) => ["completed", "delivered", "payout_released"].includes(o.status));
    const gmv = completedOrders.reduce((sum: number, o: any) => sum + (o.sale_price || 0), 0);
    const platformRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.fee_amount || 0), 0);
    const openDisputes = orders.filter((o: any) => o.dispute_status === "open").length;
    const avgOrderValue = completedOrders.length > 0 ? gmv / completedOrders.length : 0;
    const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
    const conversionRate = totalViews > 0 ? ((completedOrders.length / totalViews) * 100) : 0;
    const takeRate = gmv > 0 ? ((platformRevenue / gmv) * 100) : 0;

    const tierCounts: Record<string, number> = {};
    sellers.forEach(s => { tierCounts[s.plan_id || "free"] = (tierCounts[s.plan_id || "free"] || 0) + 1; });
    const sellersByTier = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }));

    const topProducts = products.slice(0, 5).map(p => ({
      name: p.model || "Unknown", brand: p.brand || "",
      sales: p.total_offers || 0, revenue: (p.lowest_price || 0) * (p.total_offers || 0),
    }));

    const monthlyMap = new Map<string, { gmv: number; revenue: number; orders: number }>();
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    completedOrders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyMap.get(key) || { gmv: 0, revenue: 0, orders: 0 };
      existing.gmv += o.sale_price || 0;
      existing.revenue += o.fee_amount || 0;
      existing.orders += 1;
      monthlyMap.set(key, existing);
    });
    const monthlyGMV = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month: months[parseInt(month.split("-")[1]) - 1] || month, ...data }));

    const statusCounts: Record<string, number> = {};
    orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count).slice(0, 6);

    const topSellers = sellers.filter(s => s.total_sales_count > 0)
      .sort((a, b) => (b.total_sales_value || 0) - (a.total_sales_value || 0))
      .slice(0, 10)
      .map(s => ({
        name: `Seller #${(s.id as string).slice(0, 6)}`, plan: s.plan_id || "free",
        sales: s.total_sales_count || 0, revenue: s.total_sales_value || 0, rating: 0, fee: s.current_fee_percent || 14,
      }));

    return {
      gmv, totalOrders: orders.length, totalSellers: sellers.length,
      activeSellers: sellers.filter(s => s.total_sales_count > 0).length,
      activeListings: listings.length, takeRate: parseFloat(takeRate.toFixed(1)),
      platformRevenue, openDisputes, avgOrderValue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      sellersByTier, topProducts, monthlyGMV, ordersByStatus, topSellers,
    };
  };

  const metrics = useMemo(() => {
    if (isLoading) return null;
    const filtered = filterByRange(rawOrders, dateRange);
    return computeMetrics(filtered, rawSellers, rawListings, rawProducts);
  }, [rawOrders, rawSellers, rawListings, rawProducts, dateRange, isLoading]);

  const prevMetrics = useMemo(() => {
    if (isLoading || rawOrders.length === 0) return null;
    const filtered = filterByRange(rawOrders, prevRange);
    return computeMetrics(filtered, rawSellers, rawListings, rawProducts);
  }, [rawOrders, rawSellers, rawListings, rawProducts, prevRange, isLoading]);

  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!metrics) return null;

  const gmvChange = prevMetrics ? pctChange(metrics.gmv, prevMetrics.gmv) : null;
  const revenueChange = prevMetrics ? pctChange(metrics.platformRevenue, prevMetrics.platformRevenue) : null;
  const ordersChange = prevMetrics ? pctChange(metrics.totalOrders, prevMetrics.totalOrders) : null;

  const ChangeIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return null;
    const isPositive = value >= 0;
    return (
      <span className={`inline-flex items-center text-[10px] font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Marketplace Analytics
          </h1>
          <p className="text-muted-foreground">Visão geral da performance do marketplace</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-44 bg-secondary/50">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês atual</SelectItem>
              <SelectItem value="last">Mês anterior</SelectItem>
              <SelectItem value="quarter">Últimos 3 meses</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {periodFilter === "custom" && (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-32 justify-start text-left text-xs")}>
                    {format(customRange.start, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customRange.start} onSelect={(d) => d && setCustomRange(prev => ({ ...prev, start: d }))} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-32 justify-start text-left text-xs")}>
                    {format(customRange.end, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customRange.end} onSelect={(d) => d && setCustomRange(prev => ({ ...prev, end: d }))} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportFinanceXLSX(rawOrders, false)}>
            <Download className="h-4 w-4" /> Financeiro
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportFinanceXLSX(rawOrders, true)}>
            <Download className="h-4 w-4" /> Repasses
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "GMV Total", value: formatCurrency(metrics.gmv), color: "text-success", bg: "bg-success/10", change: gmvChange },
          { icon: Percent, label: "Receita Plataforma", value: formatCurrency(metrics.platformRevenue), color: "text-primary", bg: "bg-primary/10", sub: `Take rate: ${metrics.takeRate}%`, change: revenueChange },
          { icon: ShoppingBag, label: "Pedidos", value: metrics.totalOrders.toString(), color: "text-info", bg: "bg-info/10", sub: `Ticket médio: ${formatCurrency(metrics.avgOrderValue)}`, change: ordersChange },
          { icon: AlertTriangle, label: "Disputas Abertas", value: metrics.openDisputes.toString(), color: metrics.openDisputes > 0 ? "text-destructive" : "text-success", bg: metrics.openDisputes > 0 ? "bg-destructive/10" : "bg-success/10" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  {"change" in kpi && kpi.change !== undefined && <ChangeIndicator value={kpi.change ?? null} />}
                </div>
                <p className="text-2xl font-black tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                {kpi.sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{kpi.sub}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Vendedores", value: metrics.totalSellers },
          { icon: Activity, label: "Ativos", value: metrics.activeSellers },
          { icon: Package, label: "Anúncios ativos", value: metrics.activeListings },
          { icon: Eye, label: "Conversão", value: `${metrics.conversionRate}%` },
          { icon: TrendingUp, label: "Take rate", value: `${metrics.takeRate}%` },
        ].map((item) => (
          <Card key={item.label} className="card-premium">
            <CardContent className="p-3 flex items-center gap-2">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="gmv" className="w-full">
        <TabsList className="w-full h-auto">
          <TabsTrigger value="gmv" className="text-xs">GMV</TabsTrigger>
          <TabsTrigger value="sellers" className="text-xs">Sellers</TabsTrigger>
          <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Top Produtos</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs">Status</TabsTrigger>
        </TabsList>

        {/* GMV Chart */}
        <TabsContent value="gmv">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">GMV vs Receita Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.monthlyGMV.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={metrics.monthlyGMV}>
                    <defs>
                      <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number, name: string) => [formatCurrency(v), name === "gmv" ? "GMV" : name === "revenue" ? "Receita" : "Pedidos"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                    <Area type="monotone" dataKey="gmv" fill="url(#gmvGradient)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} yAxisId={0} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Sem dados de GMV ainda</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sellers by Tier */}
        <TabsContent value="sellers">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vendedores por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.sellersByTier.length > 0 ? (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={220}>
                    <PieChart>
                      <Pie
                        data={metrics.sellersByTier}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {metrics.sellersByTier.map((entry, i) => (
                          <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || STATUS_COLORS[i % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {metrics.sellersByTier.map((t, i) => (
                      <div key={t.tier} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: TIER_COLORS[t.tier] || STATUS_COLORS[i % STATUS_COLORS.length] }}
                          />
                          <span className="text-sm capitalize font-medium">{t.tier}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{t.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhum vendedor cadastrado</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products */}
        <TabsContent value="products">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Produtos por Ofertas</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {metrics.topProducts.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.brand} {p.name}</p>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mt-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((p.sales / (metrics.topProducts[0]?.sales || 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold">{p.sales} ofertas</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Sem produtos ainda</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders by Status */}
        <TabsContent value="orders">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pedidos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={metrics.ordersByStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Sem pedidos ainda</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Top Sellers Ranking */}
        <TabsContent value="ranking">
          <Card className="card-premium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Top Vendedores por Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topSellers.length > 0 ? (
                <div className="space-y-3">
                  {metrics.topSellers.map((s, i) => (
                    <motion.div
                      key={s.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3"
                    >
                      <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-primary" : i === 1 ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{s.name}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{s.plan}</Badge>
                        </div>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mt-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((s.revenue / (metrics.topSellers[0]?.revenue || 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-xs font-bold">{formatCurrency(s.revenue)}</p>
                        <p className="text-[10px] text-muted-foreground">{s.sales} vendas · {s.fee}% taxa</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhum vendedor com vendas ainda</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function exportFinanceXLSX(orders: any[], payoutsOnly: boolean) {
  const XLSX = await import("xlsx");
  
  let filtered = orders;
  if (payoutsOnly) {
    filtered = orders.filter((o: any) => ["payout_released", "payout_pending"].includes(o.status));
  }

  const rows = filtered.map((o: any) => ({
    "Código": o.order_code || "",
    "Criado em": o.created_at ? new Date(o.created_at).toLocaleDateString("pt-BR") : "",
    "Pago em": o.paid_at ? new Date(o.paid_at).toLocaleDateString("pt-BR") : "",
    "Comprador": o.buyer_name || "",
    "Produto": o.listing?.title || "",
    "Valor venda": o.sale_price || 0,
    "Taxa (%)": o.fee_percent || 0,
    "Taxa (R$)": o.fee_amount || 0,
    "Repasse vendedor": o.seller_payout || 0,
    "Frete": o.shipping_cost || 0,
    "Pagamento": o.payment_method || "",
    "Status": o.status || "",
    "Vendedor": o.seller_name || `Seller #${(o.seller_id || "").slice(0, 6)}`,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Bold header
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = { font: { bold: true } };
    }
  }

  // Currency format for monetary columns (F, H, I, J = cols 5,7,8,9)
  const currencyCols = [5, 7, 8, 9];
  for (let r = 1; r <= range.e.r; r++) {
    for (const c of currencyCols) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].z = '#.##0,00';
      }
    }
  }

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
    { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 10 },
    { wch: 12 }, { wch: 16 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = payoutsOnly ? "Repasses" : "Financeiro";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const suffix = payoutsOnly ? "repasses" : "financeiro";
  XLSX.writeFile(wb, `bravenza-${suffix}-${month}-${year}.xlsx`);
}
