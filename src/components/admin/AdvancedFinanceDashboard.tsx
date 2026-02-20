import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/constants";

interface MonthlyData {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  orders: number;
}

export function AdvancedFinanceDashboard() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.rpc("get_admin_finance_monthly" as any);
        if (error) throw error;

        const mapped: MonthlyData[] = ((data || []) as any[]).map((row: any) => ({
          month: row.month_key,
          revenue: Number(row.revenue),
          costs: Number(row.costs),
          profit: Number(row.profit),
          margin: Number(row.margin),
          orders: Number(row.orders_count),
        }));

        setMonthlyData(mapped);
      } catch (error) {
        console.error("Error fetching finance data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // MoM comparison
  const comparison = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    const revenueChange = previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
    const profitChange = previous.profit !== 0 ? ((current.profit - previous.profit) / Math.abs(previous.profit)) * 100 : 0;

    return { current, previous, revenueChange, profitChange };
  }, [monthlyData]);

  // Projection (simple linear)
  const projection = useMemo(() => {
    if (monthlyData.length < 3) return null;
    const last3 = monthlyData.slice(-3);
    const avgGrowth = last3.reduce((sum, m, i, arr) => {
      if (i === 0) return sum;
      const prev = arr[i - 1].revenue;
      return sum + (prev > 0 ? (m.revenue - prev) / prev : 0);
    }, 0) / 2;
    const currentRevenue = monthlyData[monthlyData.length - 1].revenue;
    return currentRevenue * (1 + avgGrowth);
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const kpis = comparison
    ? [
        {
          title: "Receita Mês Atual",
          value: formatCurrency(comparison.current.revenue),
          change: comparison.revenueChange,
          icon: DollarSign,
        },
        {
          title: "Lucro Líquido",
          value: formatCurrency(comparison.current.profit),
          change: comparison.profitChange,
          icon: comparison.current.profit >= 0 ? TrendingUp : TrendingDown,
        },
        {
          title: "Projeção Próximo Mês",
          value: projection ? formatCurrency(projection) : "-",
          change: null,
          icon: Target,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* MoM KPIs */}
      <div className="grid md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    {kpi.change !== null && (
                      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.change >= 0 ? "text-success" : "text-destructive"}`}>
                        {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(kpi.change).toFixed(1)}% vs mês anterior
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <kpi.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue vs Costs vs Profit chart */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Receita vs Custos vs Lucro — Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Legend />
              <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Custos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Lucro" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Margin trend */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Evolução da Margem de Lucro (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Margem"]}
              />
              <Area
                type="monotone"
                dataKey="margin"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-order profitability */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Margem por Pedido — Mês Atual</CardTitle>
        </CardHeader>
        <CardContent>
          {comparison && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Pedidos</p>
                <p className="text-xl font-bold">{comparison.current.orders}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="text-xs text-muted-foreground">Margem Média</p>
                <p className="text-xl font-bold">{comparison.current.margin.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold">
                  {comparison.current.orders > 0
                    ? formatCurrency(comparison.current.revenue / comparison.current.orders)
                    : "-"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Lucro/Pedido</p>
                <p className="text-xl font-bold">
                  {comparison.current.orders > 0
                    ? formatCurrency(comparison.current.profit / comparison.current.orders)
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
