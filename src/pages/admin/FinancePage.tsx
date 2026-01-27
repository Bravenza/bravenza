import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Eye,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Payment fee rates
const PAYMENT_FEE_RATES = {
  PIX: 0.0099, // 0.99%
  CREDIT_CARD: 0.0499, // 4.99%
};

interface OrderFinancial {
  order_id: string;
  client_name: string;
  product_name: string;
  current_status: string;
  product_price: number | null;
  product_cost: number | null;
  shipping_cost: number | null;
  other_costs: number | null;
  sinal_paid: boolean;
  sinal_value: number | null;
  sinal_payment_method: string | null;
  balance_paid: boolean;
  balance_value: number | null;
  balance_payment_method: string | null;
  created_at: string;
}

interface OrderCost {
  id: string;
  order_id: string;
  cost_type: string;
  description: string | null;
  amount: number;
  created_at: string;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const FinancePage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderFinancial[]>([]);
  const [orderCosts, setOrderCosts] = useState<OrderCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("current");
  const [statusFilter, setStatusFilter] = useState("all");

  // Calculate date range based on period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (periodFilter) {
      case "current":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "last3":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "last6":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "year":
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [periodFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch orders with financial data
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("order_id, client_name, product_name, current_status, product_price, product_cost, shipping_cost, other_costs, sinal_paid, sinal_value, sinal_payment_method, balance_paid, balance_value, balance_payment_method, created_at")
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString())
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch detailed costs
        const orderIds = (ordersData || []).map(o => o.order_id);
        if (orderIds.length > 0) {
          const { data: costsData, error: costsError } = await supabase
            .from("order_costs")
            .select("*")
            .in("order_id", orderIds);

          if (!costsError) {
            setOrderCosts(costsData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados financeiros.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, toast]);

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    if (statusFilter === "paid") return orders.filter(o => o.sinal_paid && o.balance_paid);
    if (statusFilter === "pending") return orders.filter(o => !o.sinal_paid || !o.balance_paid);
    if (statusFilter === "delivered") return orders.filter(o => o.current_status === "DELIVERED");
    return orders;
  }, [orders, statusFilter]);

  // Calculate payment fee for an order
  const calculatePaymentFee = (value: number | null, paid: boolean, method: string | null) => {
    if (!paid || !value || !method) return 0;
    const rate = method === "PIX" ? PAYMENT_FEE_RATES.PIX : PAYMENT_FEE_RATES.CREDIT_CARD;
    return value * rate;
  };

  // Calculate financial metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalPaymentFees = 0;
    let totalOrders = filteredOrders.length;
    let paidOrders = 0;

    filteredOrders.forEach(order => {
      const revenue = order.product_price || 0;
      const productCost = order.product_cost || 0;
      const shippingCost = order.shipping_cost || 0;
      const otherCosts = order.other_costs || 0;

      // Calculate payment fees
      const sinalFee = calculatePaymentFee(order.sinal_value, order.sinal_paid, order.sinal_payment_method);
      const balanceFee = calculatePaymentFee(order.balance_value, order.balance_paid, order.balance_payment_method);
      const paymentFees = sinalFee + balanceFee;

      // Get additional costs from order_costs table
      const additionalCosts = orderCosts
        .filter(c => c.order_id === order.order_id)
        .reduce((sum, c) => sum + c.amount, 0);

      if (order.sinal_paid || order.balance_paid) {
        totalRevenue += revenue;
        paidOrders++;
      }

      totalCosts += productCost + shippingCost + otherCosts + additionalCosts;
      totalPaymentFees += paymentFees;
    });

    const grossProfit = totalRevenue - totalCosts - totalPaymentFees;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageTicket = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    return {
      totalRevenue,
      totalCosts,
      totalPaymentFees,
      grossProfit,
      profitMargin,
      averageTicket,
      totalOrders,
      paidOrders,
    };
  }, [filteredOrders, orderCosts]);

  // Prepare chart data - monthly breakdown
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string; revenue: number; costs: number; profit: number }> = {};

    filteredOrders.forEach(order => {
      const monthKey = format(parseISO(order.created_at), "yyyy-MM");
      const monthLabel = format(parseISO(order.created_at), "MMM/yy", { locale: ptBR });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, revenue: 0, costs: 0, profit: 0 };
      }

      const revenue = (order.sinal_paid || order.balance_paid) ? (order.product_price || 0) : 0;
      const productCost = order.product_cost || 0;
      const shippingCost = order.shipping_cost || 0;
      const otherCosts = order.other_costs || 0;
      const additionalCosts = orderCosts
        .filter(c => c.order_id === order.order_id)
        .reduce((sum, c) => sum + c.amount, 0);
      
      // Calculate payment fees
      const sinalFee = calculatePaymentFee(order.sinal_value, order.sinal_paid, order.sinal_payment_method);
      const balanceFee = calculatePaymentFee(order.balance_value, order.balance_paid, order.balance_payment_method);
      const paymentFees = sinalFee + balanceFee;

      monthlyData[monthKey].revenue += revenue;
      monthlyData[monthKey].costs += productCost + shippingCost + otherCosts + additionalCosts + paymentFees;
      monthlyData[monthKey].profit = monthlyData[monthKey].revenue - monthlyData[monthKey].costs;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredOrders, orderCosts]);

  // Prepare pie chart data - cost breakdown
  const costBreakdown = useMemo(() => {
    let productCosts = 0;
    let shippingCosts = 0;
    let otherCosts = 0;
    let additionalCosts = 0;
    let paymentFees = 0;

    filteredOrders.forEach(order => {
      productCosts += order.product_cost || 0;
      shippingCosts += order.shipping_cost || 0;
      otherCosts += order.other_costs || 0;
      
      // Calculate payment fees
      const sinalFee = calculatePaymentFee(order.sinal_value, order.sinal_paid, order.sinal_payment_method);
      const balanceFee = calculatePaymentFee(order.balance_value, order.balance_paid, order.balance_payment_method);
      paymentFees += sinalFee + balanceFee;
    });

    additionalCosts = orderCosts.reduce((sum, c) => sum + c.amount, 0);

    return [
      { name: "Custo do Produto", value: productCosts },
      { name: "Frete Nacional", value: shippingCosts },
      { name: "Taxas de Pagamento", value: paymentFees },
      { name: "Outros Custos", value: otherCosts + additionalCosts },
    ].filter(item => item.value > 0);
  }, [filteredOrders, orderCosts]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Pedido",
      "Cliente",
      "Produto",
      "Status",
      "Receita",
      "Custo Produto",
      "Frete",
      "Taxas Pgto",
      "Outros Custos",
      "Lucro Bruto",
      "Margem %",
      "Data",
    ];

    const rows = filteredOrders.map(order => {
      const revenue = order.product_price || 0;
      const productCost = order.product_cost || 0;
      const shippingCost = order.shipping_cost || 0;
      const otherCosts = order.other_costs || 0;
      const additionalCosts = orderCosts
        .filter(c => c.order_id === order.order_id)
        .reduce((sum, c) => sum + c.amount, 0);
      
      // Calculate payment fees
      const sinalFee = calculatePaymentFee(order.sinal_value, order.sinal_paid, order.sinal_payment_method);
      const balanceFee = calculatePaymentFee(order.balance_value, order.balance_paid, order.balance_payment_method);
      const paymentFees = sinalFee + balanceFee;
      
      const totalCosts = productCost + shippingCost + otherCosts + additionalCosts + paymentFees;
      const profit = revenue - totalCosts;
      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

      return [
        order.order_id,
        order.client_name,
        order.product_name,
        ORDER_STATUS_LABELS[order.current_status] || order.current_status,
        revenue.toFixed(2),
        productCost.toFixed(2),
        shippingCost.toFixed(2),
        paymentFees.toFixed(2),
        (otherCosts + additionalCosts).toFixed(2),
        profit.toFixed(2),
        margin,
        formatDate(order.created_at),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({
      title: "Exportado!",
      description: "Planilha financeira baixada com sucesso.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de receitas, custos e lucros dos pedidos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40 bg-secondary/50">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Este mês</SelectItem>
              <SelectItem value="last">Mês passado</SelectItem>
              <SelectItem value="last3">Últimos 3 meses</SelectItem>
              <SelectItem value="last6">Últimos 6 meses</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.paidOrders} pedidos pagos
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custos Totais</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(metrics.totalCosts + metrics.totalPaymentFees)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Produto + frete + taxas pgto ({formatCurrency(metrics.totalPaymentFees)})
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className={`text-2xl font-bold ${metrics.grossProfit >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(metrics.grossProfit)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${metrics.grossProfit >= 0 ? "bg-success/20" : "bg-destructive/20"}`}>
                {metrics.grossProfit >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Margem: {metrics.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.averageTicket)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.totalOrders} pedidos no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar Chart - Monthly */}
        <Card className="card-premium lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Receita vs Custos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" name="Custos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Cost Breakdown */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem custos registrados
              </div>
            )}
            <div className="mt-4 space-y-2">
              {costBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detalhamento por Pedido</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-secondary/50">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Frete</TableHead>
                  <TableHead className="text-right">Taxas</TableHead>
                  <TableHead className="text-right">Outros</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      Nenhum pedido encontrado no período
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => {
                    const revenue = order.product_price || 0;
                    const productCost = order.product_cost || 0;
                    const shippingCost = order.shipping_cost || 0;
                    const otherCosts = order.other_costs || 0;
                    const additionalCosts = orderCosts
                      .filter(c => c.order_id === order.order_id)
                      .reduce((sum, c) => sum + c.amount, 0);
                    
                    // Calculate payment fees
                    const sinalFee = calculatePaymentFee(order.sinal_value, order.sinal_paid, order.sinal_payment_method);
                    const balanceFee = calculatePaymentFee(order.balance_value, order.balance_paid, order.balance_payment_method);
                    const paymentFees = sinalFee + balanceFee;
                    
                    const totalCosts = productCost + shippingCost + otherCosts + additionalCosts + paymentFees;
                    const profit = revenue - totalCosts;
                    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                    return (
                      <TableRow key={order.order_id} className="border-border">
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.order_id}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {order.client_name}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(revenue)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {productCost > 0 ? formatCurrency(productCost) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {shippingCost > 0 ? formatCurrency(shippingCost) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {paymentFees > 0 ? formatCurrency(paymentFees) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(otherCosts + additionalCosts) > 0 ? formatCurrency(otherCosts + additionalCosts) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={profit >= 0 ? "text-success" : "text-destructive"}>
                            {formatCurrency(profit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={margin >= 20 ? "border-success text-success" : margin >= 10 ? "border-warning text-warning" : "border-destructive text-destructive"}
                          >
                            {margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link to={`/admin/pedidos/${order.order_id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary footer */}
      <p className="text-sm text-muted-foreground">
        Mostrando {filteredOrders.length} pedidos no período de{" "}
        {format(dateRange.start, "dd/MM/yyyy")} a {format(dateRange.end, "dd/MM/yyyy")}
      </p>
    </div>
  );
};

export default FinancePage;
