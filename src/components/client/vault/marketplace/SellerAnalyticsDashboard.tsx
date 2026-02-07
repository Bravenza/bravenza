import { useState, useEffect } from "react";
import { BarChart3, Eye, ShoppingBag, DollarSign, TrendingUp, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub`;

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
}

interface SellerAnalyticsDashboardProps {
  clientCpf: string;
}

export function SellerAnalyticsDashboard({ clientCpf }: SellerAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=seller-analytics`, {
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": clientCpf,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
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

  const tierColors: Record<string, string> = {
    bronze: "text-amber-700", prata: "text-gray-400", ouro: "text-yellow-500", elite: "text-cyan-400",
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const monthLabels: Record<string, string> = {};
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  analytics.monthly.forEach((m) => {
    const [, mm] = m.month.split("-");
    monthLabels[m.month] = months[parseInt(mm) - 1] || m.month;
  });

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <Eye className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{analytics.total_views.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <ShoppingBag className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{analytics.total_sales}</p>
            <p className="text-[11px] text-muted-foreground">Vendas</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</p>
            <p className="text-[11px] text-muted-foreground">Receita líquida</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{analytics.conversion_rate}%</p>
            <p className="text-[11px] text-muted-foreground">Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Extra metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-bold">{analytics.fee_percent}%</p>
              <p className="text-[10px] text-muted-foreground">Taxa atual</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <Badge className={`text-xs ${tierColors[analytics.tier] || ""}`}>
              {analytics.tier?.charAt(0).toUpperCase() + analytics.tier?.slice(1)}
            </Badge>
            <p className="text-[10px] text-muted-foreground">Nível</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-sm font-bold">{analytics.rating?.toFixed(1) || "—"}</span>
            <p className="text-[10px] text-muted-foreground">⭐ ({analytics.ratings_count})</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Receita mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => monthLabels[v] || v} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), "Receita"]}
                labelFormatter={(l) => monthLabels[l] || l}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      <Card className="card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vendas por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={analytics.monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => monthLabels[v] || v} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(l) => monthLabels[l] || l} />
              <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
