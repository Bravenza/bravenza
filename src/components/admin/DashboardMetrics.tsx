import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
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
  AlertTriangle
} from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderData {
  order_id: string;
  order_type: string;
  current_status: string;
  product_price: number | null;
  sinal_value: number | null;
  sinal_paid: boolean | null;
  balance_value: number | null;
  balance_paid: boolean | null;
  budget_status: string | null;
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
}

const STATUS_COLORS: Record<string, string> = {
  "Em Processamento": "#3b82f6",
  "Aguardando Pagamento": "#f59e0b",
  "Em Trânsito": "#8b5cf6",
  "Entregue": "#22c55e",
  "Outros": "#6b7280",
};

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
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (orders) {
        const metricsData = calculateMetrics(orders as OrderData[]);
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
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

    const statusGroups: Record<string, number> = {
      "Em Processamento": 0,
      "Aguardando Pagamento": 0,
      "Em Trânsito": 0,
      "Entregue": 0,
      "Outros": 0,
    };

    const monthlyData: Record<string, { pedidos: number; faturamento: number }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const key = format(month, "MMM/yy", { locale: ptBR });
      monthlyData[key] = { pedidos: 0, faturamento: 0 };
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

      // Budget status
      if (order.budget_status === "APPROVED") approvedBudgets++;
      else if (order.budget_status === "REJECTED") rejectedBudgets++;
      else if (order.budget_status === "SENT" || order.budget_status === "PENDING") pendingBudgets++;

      // Status grouping
      const status = order.current_status;
      if (["ORDER_CONFIRMED", "SOURCING", "NEGOTIATING", "PURCHASE_COMPLETED"].includes(status)) {
        statusGroups["Em Processamento"]++;
      } else if (["BALANCE_DUE", "BALANCE_PENDING"].includes(status)) {
        statusGroups["Aguardando Pagamento"]++;
      } else if (["PACKAGE_EN_ROUTE", "INTERNATIONAL_TRANSIT", "CUSTOMS", "NATIONAL_TRANSIT", "DISPATCHED"].includes(status)) {
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
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "Receita confirmada",
    },
    {
      title: "Receita Pendente",
      value: formatCurrency(metrics.pendingRevenue),
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      description: "Aguardando pagamento",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: `${metrics.approvedBudgets} aprovados de ${metrics.approvedBudgets + metrics.rejectedBudgets}`,
    },
    {
      title: "Orçamentos Pendentes",
      value: metrics.pendingBudgets,
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "Aguardando resposta",
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">Sinal Recebido</p>
                <p className="text-2xl font-bold text-green-500">
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
              <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {formatCurrency(metrics.pendingRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
