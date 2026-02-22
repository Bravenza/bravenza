import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Eye, ShoppingBag, DollarSign, TrendingUp, Percent, 
  ArrowUpRight, ArrowDownRight, Target, Package, Star,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, Line
} from "recharts";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-seller`;

interface SellerAnalytics {
  total_views: number;
  active_listings: number;
  total_sales: number;
  total_revenue: number;
  total_fees: number;
  conversion_rate: number;
  average_order_value: number;
  monthly: { month: string; revenue: number; sales: number; views: number }[];
  tier: string;
  fee_percent: number;
  rating: number | null;
  ratings_count: number;
  revenue_growth: number;
  sales_growth: number;
  funnel: {
    views: number;
    checkout_starts: number;
    paid: number;
    completed: number;
  };
  plan_id: string;
}

interface SellerAnalyticsDashboardProps {
  clientCpf: string;
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

export function SellerAnalyticsDashboard({ clientCpf }: SellerAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const res = await fetch(`${FUNCTION_URL}?action=seller-analytics&period=${period}`, { headers });
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (err) {
      console.error("Fetch analytics error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="card-premium">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h3 className="font-medium mb-1">Sem dados ainda</h3>
          <p className="text-sm text-muted-foreground">Comece a vender para ver suas métricas.</p>
        </CardContent>
      </Card>
    );
  }

  const isElite = analytics.plan_id === "elite";
  const isPro = analytics.plan_id === "pro";
  const hasAdvancedAccess = isElite;
  const hasBasicAccess = isPro || isElite;

  const tierColors: Record<string, string> = {
    bronze: "text-amber-700 bg-amber-500/10 border-amber-500/20",
    prata: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    ouro: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    elite: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthLabels: Record<string, string> = {};
  analytics.monthly.forEach((m) => {
    const [, mm] = m.month.split("-");
    monthLabels[m.month] = months[parseInt(mm) - 1] || m.month;
  });

  const LockedOverlay = ({ label }: { label: string }) => (
    <div className="absolute inset-0 z-10 bg-card/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2">
      <Lock className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <Badge variant="outline" className="text-[9px]">Plano Elite</Badge>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analytics
          {!hasBasicAccess && <Badge variant="outline" className="text-[9px] ml-1">Free</Badge>}
          {isPro && !isElite && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] ml-1">Básico</Badge>}
          {isElite && <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] ml-1">Avançado</Badge>}
        </h3>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards — available to all */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { 
            icon: DollarSign, 
            value: formatCurrency(analytics.total_revenue), 
            label: "Receita total",
            trend: `${analytics.revenue_growth >= 0 ? "+" : ""}${analytics.revenue_growth}%`,
            trendUp: analytics.revenue_growth >= 0,
            color: "text-emerald-500"
          },
          { 
            icon: ShoppingBag, 
            value: analytics.total_sales.toString(), 
            label: "Vendas",
            trend: `${analytics.sales_growth >= 0 ? "+" : ""}${analytics.sales_growth}%`,
            trendUp: analytics.sales_growth >= 0,
            color: "text-primary"
          },
          { 
            icon: Eye, 
            value: analytics.total_views.toLocaleString(), 
            label: "Visualizações",
            color: "text-blue-500"
          },
          { 
            icon: Target, 
            value: `${analytics.conversion_rate}%`, 
            label: "Conversão",
            color: "text-violet-500"
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="card-premium group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  {kpi.trend && (
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${kpi.trendUp ? "text-emerald-500" : "text-destructive"}`}>
                      {kpi.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {kpi.trend}
                    </span>
                  )}
                </div>
                <p className="text-xl font-black tracking-tight">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary metrics — Pro+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">{analytics.active_listings}</p>
              <p className="text-[10px] text-muted-foreground">Anúncios ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold">{formatCurrency(analytics.average_order_value)}</p>
              <p className="text-[10px] text-muted-foreground">Ticket médio</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tierColors[analytics.tier] || "bg-muted"}`}>
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold capitalize">{analytics.tier}</p>
              <p className="text-[10px] text-muted-foreground">Nível • {analytics.fee_percent}% taxa</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-bold">{analytics.rating?.toFixed(1) || "—"}</p>
              <p className="text-[10px] text-muted-foreground">{analytics.ratings_count} avaliações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts — tiered access */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="revenue" className="text-xs">Receita</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs">Funil</TabsTrigger>
        </TabsList>

        {/* Revenue chart — Pro+ */}
        <TabsContent value="revenue">
          <Card className="card-premium relative">
            {!hasBasicAccess && <LockedOverlay label="Disponível no plano Pro" />}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Receita vs Vendas</span>
                <Badge variant="outline" className="text-[10px]">
                  Líquido: {formatCurrency(analytics.total_revenue - analytics.total_fees)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={analytics.monthly}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => monthLabels[v] || v} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      name === "revenue" ? formatCurrency(v) : v,
                      name === "revenue" ? "Receita" : "Vendas"
                    ]}
                    labelFormatter={(l) => monthLabels[l] || l}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.9} />
                  <Line type="monotone" dataKey="sales" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance — Elite only */}
        <TabsContent value="performance">
          <Card className="card-premium relative">
            {!hasAdvancedAccess && <LockedOverlay label="Disponível no plano Elite" />}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Visualizações & Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics.monthly}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => monthLabels[v] || v} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    labelFormatter={(l) => monthLabels[l] || l}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(142, 76%, 36%)" fill="url(#salesGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel — Elite only, with REAL data */}
        <TabsContent value="funnel">
          <Card className="card-premium relative">
            {!hasAdvancedAccess && <LockedOverlay label="Disponível no plano Elite" />}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Funil de conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Visualizações", value: analytics.funnel.views, pct: 100, color: "bg-primary" },
                  { label: "Início de checkout", value: analytics.funnel.checkout_starts, pct: analytics.funnel.views > 0 ? Math.round((analytics.funnel.checkout_starts / analytics.funnel.views) * 100) : 0, color: "bg-amber-500" },
                  { label: "Pagamento confirmado", value: analytics.funnel.paid, pct: analytics.funnel.views > 0 ? Math.round((analytics.funnel.paid / analytics.funnel.views) * 100) : 0, color: "bg-blue-500" },
                  { label: "Entrega concluída", value: analytics.funnel.completed, pct: analytics.funnel.views > 0 ? Math.round((analytics.funnel.completed / analytics.funnel.views) * 100) : 0, color: "bg-emerald-500" },
                ].map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="space-y-1"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{step.label}</span>
                      <span className="text-muted-foreground">{step.value.toLocaleString()} ({step.pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(step.pct, 1)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                        className={`h-full rounded-full ${step.color}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fees breakdown — Pro+ */}
      <Card className="card-premium relative">
        {!hasBasicAccess && <LockedOverlay label="Disponível no plano Pro" />}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            Resumo financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-black text-emerald-500">{formatCurrency(analytics.total_revenue)}</p>
              <p className="text-[10px] text-muted-foreground">Receita bruta</p>
            </div>
            <div>
              <p className="text-lg font-black text-destructive">-{formatCurrency(analytics.total_fees)}</p>
              <p className="text-[10px] text-muted-foreground">Taxas ({analytics.fee_percent}%)</p>
            </div>
            <div>
              <p className="text-lg font-black">{formatCurrency(analytics.total_revenue - analytics.total_fees)}</p>
              <p className="text-[10px] text-muted-foreground">Líquido recebido</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
