import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, FunnelChart, Funnel, LabelList } from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Timer,
  Users
} from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderData {
  order_id: string;
  current_status: string;
  product_price: number | null;
  sinal_value: number | null;
  sinal_paid: boolean | null;
  sinal_paid_at: string | null;
  balance_value: number | null;
  balance_paid: boolean | null;
  budget_status: string | null;
  budget_sent_at: string | null;
  budget_approved_at: string | null;
  created_at: string;
}

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
  // New conversion metrics
  avgTimeToApproval: number; // hours
  avgTimeToClose: number; // days
  funnelData: { name: string; value: number; fill: string }[];
  weeklyConversion: { week: string; rate: number; approved: number; total: number }[];
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
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("order_id, current_status, product_price, sinal_value, sinal_paid, sinal_paid_at, balance_value, balance_paid, budget_status, budget_sent_at, budget_approved_at, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (orders) {
        const metricsData = calculateMetrics(orders as OrderData[]);
        setMetrics(metricsData);
      }
    } catch (error) {
      // Silent fail - metrics are non-critical
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (orders: OrderData[]): MetricsData => {
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let sinalReceived = 0;
    let balanceReceived = 0;
    let approvedBudgets = 0;
    let rejectedBudgets = 0;
    let pendingBudgets = 0;
    let totalTimeToApproval = 0;
    let approvalCount = 0;
    let totalTimeToClose = 0;
    let closeCount = 0;

    const statusGroups: Record<string, number> = {
      "Em Processamento": 0,
      "Aguardando Pagamento": 0,
      "Em Trânsito": 0,
      "Entregue": 0,
      "Outros": 0,
    };

    const monthlyData: Record<string, { pedidos: number; faturamento: number }> = {};
    const weeklyConversionData: Record<string, { approved: number; total: number }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const key = format(month, "MMM/yy", { locale: ptBR });
      monthlyData[key] = { pedidos: 0, faturamento: 0 };
    }

    // Initialize last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = subMonths(new Date(), 0);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const key = format(weekStart, "dd/MM", { locale: ptBR });
      weeklyConversionData[key] = { approved: 0, total: 0 };
    }

    orders.forEach((order) => {
      // Revenue calculations
      if (order.sinal_paid && order.sinal_value) {
        sinalReceived += order.sinal_value;
        totalRevenue += order.sinal_value;
      }
      if (order.balance_paid && order.balance_value) {
        balanceReceived += order.balance_value;
        totalRevenue += order.balance_value;
      }
      if (!order.sinal_paid && order.sinal_value) {
        pendingRevenue += order.sinal_value;
      }
      if (!order.balance_paid && order.balance_value) {
        pendingRevenue += order.balance_value;
      }

      // Budget status and time calculations
      if (order.budget_status === "APPROVED") {
        approvedBudgets++;
        if (order.budget_sent_at && order.budget_approved_at) {
          const hours = differenceInHours(new Date(order.budget_approved_at), new Date(order.budget_sent_at));
          if (hours > 0 && hours < 720) { // Exclude outliers (> 30 days)
            totalTimeToApproval += hours;
            approvalCount++;
          }
        }
      } else if (order.budget_status === "REJECTED") {
        rejectedBudgets++;
      } else if (order.budget_status === "SENT" || order.budget_status === "PENDING") {
        pendingBudgets++;
      }

      // Time to close (from creation to sinal paid)
      if (order.sinal_paid && order.sinal_paid_at) {
        const days = differenceInDays(new Date(order.sinal_paid_at), new Date(order.created_at));
        if (days >= 0 && days < 90) { // Exclude outliers
          totalTimeToClose += days;
          closeCount++;
        }
      }

      // Status grouping
      const status = order.current_status;
      if (["ORDER_CONFIRMED", "SOURCING", "NEGOTIATING", "PURCHASE_COMPLETED", "REQUEST_RECEIVED", "BUDGET_SENT", "DEPOSIT_CONFIRMED", "SEARCH_SELECTION", "PRODUCT_FOUND"].includes(status)) {
        statusGroups["Em Processamento"]++;
      } else if (["BALANCE_DUE", "BALANCE_PENDING"].includes(status)) {
        statusGroups["Aguardando Pagamento"]++;
      } else if (["PACKAGE_EN_ROUTE", "INTERNATIONAL_TRANSIT", "CUSTOMS", "NATIONAL_TRANSIT", "DISPATCHED", "PREPARING_INTERNATIONAL", "ARRIVED_BRAZIL", "PRODUCT_INSPECTED", "SHIPPED_TO_CLIENT"].includes(status)) {
        statusGroups["Em Trânsito"]++;
      } else if (status === "DELIVERED") {
        statusGroups["Entregue"]++;
      } else {
        statusGroups["Outros"]++;
      }

      // Monthly data
      const orderMonth = format(new Date(order.created_at), "MMM/yy", { locale: ptBR });
      if (monthlyData[orderMonth]) {
        monthlyData[orderMonth].pedidos++;
        if (order.product_price) {
          monthlyData[orderMonth].faturamento += order.product_price;
        }
      }
    });

    const totalBudgets = approvedBudgets + rejectedBudgets;
    const conversionRate = totalBudgets > 0 ? (approvedBudgets / totalBudgets) * 100 : 0;
    const avgTimeToApproval = approvalCount > 0 ? totalTimeToApproval / approvalCount : 0;
    const avgTimeToClose = closeCount > 0 ? totalTimeToClose / closeCount : 0;

    // Funnel data
    const funnelData = [
      { name: "Orçamentos Enviados", value: approvedBudgets + rejectedBudgets + pendingBudgets, fill: FUNNEL_COLORS[0] },
      { name: "Orçamentos Aprovados", value: approvedBudgets, fill: FUNNEL_COLORS[1] },
      { name: "Sinal Pago", value: orders.filter(o => o.sinal_paid).length, fill: FUNNEL_COLORS[2] },
      { name: "Entregues", value: orders.filter(o => o.current_status === "DELIVERED").length, fill: FUNNEL_COLORS[3] },
    ];

    return {
      totalRevenue,
      pendingRevenue,
      sinalReceived,
      balanceReceived,
      ordersByMonth: Object.entries(monthlyData).map(([name, data]) => ({
        name,
        ...data,
      })),
      ordersByStatus: Object.entries(statusGroups)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
          color: STATUS_COLORS[name] || "#6b7280",
        })),
      conversionRate,
      approvedBudgets,
      rejectedBudgets,
      pendingBudgets,
      avgTimeToApproval,
      avgTimeToClose,
      funnelData,
      weeklyConversion: Object.entries(weeklyConversionData).map(([week, data]) => ({
        week,
        rate: data.total > 0 ? (data.approved / data.total) * 100 : 0,
        approved: data.approved,
        total: data.total,
      })),
    };
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
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card-premium">
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
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      name === "faturamento" ? formatCurrency(value) : value,
                      name === "pedidos" ? "Pedidos" : "Faturamento"
                    ]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="pedidos" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Pedidos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-premium">
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
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {metrics.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Detalhamento de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
                <p className="text-sm text-muted-foreground">Sinal Recebido</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(metrics.sinalReceived)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CheckCircle2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-muted-foreground">Saldo Recebido</p>
                <p className="text-2xl font-bold text-blue-500">
                  {formatCurrency(metrics.balanceReceived)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                <Clock className="h-8 w-8 mx-auto text-warning mb-2" />
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(metrics.pendingRevenue)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30 border border-border">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Orçamentos Abertos</p>
                <p className="text-2xl font-bold">
                  {metrics.pendingBudgets}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {metrics.funnelData.map((item, index) => {
                const prevValue = index > 0 ? metrics.funnelData[index - 1].value : item.value;
                const conversionRate = prevValue > 0 ? ((item.value / prevValue) * 100).toFixed(0) : "100";
                return (
                  <div key={item.name} className="text-center">
                    <div 
                      className="mx-auto mb-3 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${item.fill}20`,
                        width: `${Math.max(60, 100 - index * 15)}%`,
                        height: "80px"
                      }}
                    >
                      <span className="text-2xl font-bold" style={{ color: item.fill }}>
                        {item.value}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {index > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversionRate}% do anterior
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
