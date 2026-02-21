import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Timer,
} from "lucide-react";

interface MetricsData {
  totalRevenue: number;
  pendingRevenue: number;
  sinalReceived: number;
  balanceReceived: number;
  ordersByMonth: { name: string; pedidos: number; faturamento: number }[];
  ordersByStatus: { name: string; value: number; color: string }[];
  conversionRate: number;
  approvedBudgets: number;
  rejectedBudgets: number;
  pendingBudgets: number;
  avgTimeToApproval: number;
  avgTimeToClose: number;
  funnelData: { name: string; value: number; fill: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  "Em Processamento": "#3b82f6",
  "Aguardando Pagamento": "#f59e0b",
  "Em Trânsito": "#8b5cf6",
  "Entregue": "#22c55e",
  "Outros": "#6b7280",
};

const FUNNEL_COLORS = ["hsl(var(--primary))", "#3b82f6", "#22c55e", "#10b981"];

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch all data from RPCs in parallel
      const [kpiRes, monthRes, statusRes] = await Promise.all([
        supabase.rpc("get_admin_dashboard_metrics" as any),
        supabase.rpc("get_admin_orders_by_month" as any),
        supabase.rpc("get_admin_orders_by_status" as any),
      ]);

      if (kpiRes.error) throw kpiRes.error;
      if (monthRes.error) throw monthRes.error;
      if (statusRes.error) throw statusRes.error;

      const kpi = kpiRes.data?.[0] || kpiRes.data;
      if (!kpi) return;

      const totalBudgets = Number(kpi.approved_budgets) + Number(kpi.rejected_budgets);
      const conversionRate = totalBudgets > 0 ? (Number(kpi.approved_budgets) / totalBudgets) * 100 : 0;

      const ordersByMonth = ((monthRes.data || []) as any[]).map((m: any) => ({
        name: m.month_key,
        pedidos: Number(m.pedidos),
        faturamento: Number(m.faturamento),
      }));

      const ordersByStatus = ((statusRes.data || []) as any[])
        .map((s: any) => ({
          name: s.status_group,
          value: Number(s.count),
          color: STATUS_COLORS[s.status_group] || "#6b7280",
        }));

      const funnelData = [
        { name: "Orçamentos Enviados", value: Number(kpi.total_budgets_sent), fill: FUNNEL_COLORS[0] },
        { name: "Orçamentos Aprovados", value: Number(kpi.approved_budgets), fill: FUNNEL_COLORS[1] },
        { name: "Sinal Pago", value: Number(kpi.sinal_paid_count), fill: FUNNEL_COLORS[2] },
        { name: "Entregues", value: Number(kpi.delivered_count), fill: FUNNEL_COLORS[3] },
      ];

      setMetrics({
        totalRevenue: Number(kpi.total_revenue),
        pendingRevenue: Number(kpi.pending_revenue),
        sinalReceived: Number(kpi.sinal_received),
        balanceReceived: Number(kpi.balance_received),
        approvedBudgets: Number(kpi.approved_budgets),
        rejectedBudgets: Number(kpi.rejected_budgets),
        pendingBudgets: Number(kpi.pending_budgets),
        avgTimeToApproval: Number(kpi.avg_time_to_approval_hours),
        avgTimeToClose: Number(kpi.avg_time_to_close_days),
        conversionRate,
        ordersByMonth,
        ordersByStatus,
        funnelData,
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const kpiCards = [
    {
      title: "Faturamento Total",
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Receita confirmada",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: `${metrics.approvedBudgets} de ${metrics.approvedBudgets + metrics.rejectedBudgets} orçamentos`,
    },
    {
      title: "Tempo Médio p/ Aprovar",
      value: metrics.avgTimeToApproval > 0 ? `${metrics.avgTimeToApproval.toFixed(0)}h` : "-",
      icon: Timer,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Orçamento → Aprovação",
    },
    {
      title: "Tempo Médio p/ Fechar",
      value: metrics.avgTimeToClose > 0 ? `${metrics.avgTimeToClose.toFixed(0)} dias` : "-",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      description: "Criação → Sinal pago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-premium h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1 truncate">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{kpi.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg shrink-0 ${kpi.bgColor}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Month */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
          <Card className="card-premium h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pedidos por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number, name: string) => [
                      name === "faturamento" ? formatCurrency(value) : value,
                      name === "pedidos" ? "Pedidos" : "Faturamento"
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="h-full">
          <Card className="card-premium h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={metrics.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {metrics.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Detalhamento de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="h-6 w-6 mx-auto text-success mb-2" />
                <p className="text-xs text-muted-foreground">Sinal Recebido</p>
                <p className="text-lg font-bold text-success truncate">{formatCurrency(metrics.sinalReceived)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <CheckCircle2 className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Saldo Recebido</p>
                <p className="text-lg font-bold text-primary truncate">{formatCurrency(metrics.balanceReceived)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                <Clock className="h-6 w-6 mx-auto text-warning mb-2" />
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-lg font-bold text-warning truncate">{formatCurrency(metrics.pendingRevenue)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30 border border-border">
                <AlertTriangle className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Orçamentos Abertos</p>
                <p className="text-lg font-bold">{metrics.pendingBudgets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Funnel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.funnelData.map((item, index) => {
                const prevValue = index > 0 ? metrics.funnelData[index - 1].value : item.value;
                const funnelConversionRate = prevValue > 0 ? ((item.value / prevValue) * 100).toFixed(0) : "100";
                return (
                  <div key={item.name} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${item.fill}15` }}>
                    <p className="text-2xl font-bold" style={{ color: item.fill }}>
                      {item.value}
                    </p>
                    <p className="text-xs font-medium mt-1 truncate">{item.name}</p>
                    {index > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {funnelConversionRate}% do anterior
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
