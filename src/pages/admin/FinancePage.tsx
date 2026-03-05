import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
  Calendar,
  Filter,
  Eye,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
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
import { useSystemSettings } from "@/hooks/useSystemSettings";
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
  Legend,
} from "recharts";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

interface KPIs {
  total_revenue: number;
  total_costs: number;
  total_payment_fees: number;
  gross_profit: number;
  profit_margin: number;
  average_ticket: number;
  total_orders: number;
  paid_orders: number;
}

interface ChartRow { month: string; revenue: number; costs: number; profit: number }
interface CostRow { category: string; total: number }
interface OrderRow {
  order_id: string; client_name: string; product_name: string; current_status: string;
  revenue: number; product_cost: number; shipping_cost: number; payment_fees: number;
  other_costs: number; profit: number; margin: number; created_at: string;
}

const MONTH_LABELS: Record<string, string> = {};
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthLabel(ym: string) {
  if (MONTH_LABELS[ym]) return MONTH_LABELS[ym];
  const [, mm] = ym.split("-");
  const label = `${months[parseInt(mm) - 1]}/${ym.slice(2, 4)}`;
  MONTH_LABELS[ym] = label;
  return label;
}

const FinancePage = () => {
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("current");
  const [statusFilter, setStatusFilter] = useState("all");

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (periodFilter) {
      case "current": return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last": { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
      case "last3": return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "last6": return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "year": return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [periodFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const s = dateRange.start.toISOString();
        const e = dateRange.end.toISOString();
        const fp = settings.payment_fee_pix;
        const fc = settings.payment_fee_credit_card;

        const [kpiRes, chartRes, costRes, ordersRes] = await Promise.all([
          supabase.rpc("get_admin_finance_kpis", { p_start: s, p_end: e, p_fee_pix: fp, p_fee_card: fc }),
          supabase.rpc("get_admin_finance_chart", { p_start: s, p_end: e, p_fee_pix: fp, p_fee_card: fc }),
          supabase.rpc("get_admin_finance_cost_breakdown", { p_start: s, p_end: e, p_fee_pix: fp, p_fee_card: fc }),
          supabase.rpc("get_admin_finance_orders", { p_start: s, p_end: e, p_status: statusFilter, p_fee_pix: fp, p_fee_card: fc }),
        ]);

        if (kpiRes.data?.[0]) setKpis(kpiRes.data[0]);
        setChartData((chartRes.data || []).map((r: any) => ({ ...r, month: monthLabel(r.month) })));
        setCostBreakdown((costRes.data || []).filter((r: any) => r.total > 0));
        setOrders(ordersRes.data || []);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados financeiros.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange, statusFilter, settings]);

  // CSV Export via RPC (no row limit)
  const handleExportCSV = async () => {
    try {
      const s = dateRange.start.toISOString();
      const e = dateRange.end.toISOString();
      const { data, error } = await supabase.rpc("get_admin_finance_orders", {
        p_start: s, p_end: e, p_status: statusFilter,
        p_fee_pix: settings.payment_fee_pix, p_fee_card: settings.payment_fee_credit_card,
      });
      if (error) throw error;

      const headers = ["Pedido", "Cliente", "Produto", "Status", "Receita", "Custo Produto", "Frete", "Taxas Pgto", "Outros Custos", "Lucro Bruto", "Margem %", "Data"];
      const rows = (data || []).map((o: OrderRow) => [
        o.order_id, o.client_name, o.product_name,
        ORDER_STATUS_LABELS[o.current_status] || o.current_status,
        o.revenue.toFixed(2), o.product_cost.toFixed(2), o.shipping_cost.toFixed(2),
        o.payment_fees.toFixed(2), o.other_costs.toFixed(2), o.profit.toFixed(2),
        o.margin.toFixed(1), formatDate(o.created_at),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row: string[]) => row.map(c => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `financeiro_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      toast({ title: "Exportado!", description: `${(data || []).length} pedidos exportados.` });
    } catch {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando dados financeiros…</span>
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const m = kpis || { total_revenue: 0, total_costs: 0, total_payment_fees: 0, gross_profit: 0, profit_margin: 0, average_ticket: 0, total_orders: 0, paid_orders: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle de receitas, custos e lucros dos pedidos</p>
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
        <Card className="card-premium h-full">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-base md:text-xl font-bold text-primary tabular-nums mt-1">{formatCurrency(m.total_revenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.paid_orders} pedidos pagos</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg bg-primary/10 shrink-0">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium h-full">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Custos Totais</p>
                <p className="text-base md:text-xl font-bold text-destructive whitespace-nowrap mt-1">{formatCurrency(m.total_costs + m.total_payment_fees)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Produto + frete + taxas
                </p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg bg-destructive/10 shrink-0">
                <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium h-full">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className={`text-base md:text-xl font-bold whitespace-nowrap mt-1 ${m.gross_profit >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(m.gross_profit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Margem: {m.profit_margin.toFixed(1)}%</p>
              </div>
              <div className={`p-2.5 md:p-3 rounded-lg shrink-0 ${m.gross_profit >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                {m.gross_profit >= 0 ? <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-success" /> : <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-destructive" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium h-full">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-base md:text-xl font-bold whitespace-nowrap mt-1">{formatCurrency(m.average_ticket)}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.total_orders} pedidos no período</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg bg-muted/30 shrink-0">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="card-premium lg:col-span-2 h-full">
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
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" name="Custos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados para o período selecionado</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-premium h-full">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={costBreakdown.map(c => ({ name: c.category, value: c.total }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={5} dataKey="value" label={false}>
                    {costBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem custos registrados</div>
            )}
            <div className="mt-4 space-y-2">
              {costBreakdown.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span>{item.category}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
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
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
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
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      Nenhum pedido encontrado no período
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map(order => (
                    <TableRow key={order.order_id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.order_id}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{order.client_name}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.revenue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{order.product_cost > 0 ? formatCurrency(order.product_cost) : "-"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : "-"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{order.payment_fees > 0 ? formatCurrency(order.payment_fees) : "-"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{order.other_costs > 0 ? formatCurrency(order.other_costs) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <span className={order.profit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(order.profit)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={order.margin >= 20 ? "border-success text-success" : order.margin >= 10 ? "border-warning text-warning" : "border-destructive text-destructive"}>
                          {order.margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/pedidos/${order.order_id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum pedido encontrado no período
              </div>
            ) : (
              orders.map(order => (
                <Link
                  key={order.order_id}
                  to={`/admin/pedidos/${order.order_id}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">{order.order_id}</span>
                    <Badge variant="outline" className={order.margin >= 20 ? "border-success text-success" : order.margin >= 10 ? "border-warning text-warning" : "border-destructive text-destructive"}>
                      {order.margin.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{order.client_name}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Receita: </span>
                      <span className="font-medium">{formatCurrency(order.revenue)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lucro: </span>
                      <span className={`font-medium ${order.profit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(order.profit)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(order.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Mostrando {orders.length} pedidos no período de {format(dateRange.start, "dd/MM/yyyy")} a {format(dateRange.end, "dd/MM/yyyy")}
      </p>
    </div>
  );
};

export default FinancePage;