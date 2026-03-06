import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  MoreVertical,
  Download,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfDay } from "date-fns";
import { typedRpc, type AdminOrdersCsvRow } from "@/integrations/supabase/typed-rpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ORDER_STATUS_LABELS,
  VAULT_STATUSES,
  formatDate,
  formatCPF,
  formatCurrency,
} from "@/lib/constants";
import { format } from "date-fns";

type SlaStatus = "overdue" | "critical" | "ok" | "none";

function getSlaStatus(date: string | null): SlaStatus {
  if (!date) return "none";
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(date));
  if (due < today) return "overdue";
  if (differenceInDays(due, today) <= 3) return "critical";
  return "ok";
}

function getSlaStatusLabel(s: SlaStatus): string {
  switch (s) {
    case "overdue": return "Vencido";
    case "critical": return "Crítico";
    case "ok": return "Ok";
    case "none": return "Sem prazo";
  }
}

function SlaCell({ date }: { date: string | null }) {
  const status = getSlaStatus(date);
  if (status === "none") return <span className="text-muted-foreground">—</span>;
  if (status === "overdue") {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">VENCIDO</Badge>
        <span className="text-xs text-destructive font-medium">{formatDate(date!)}</span>
      </div>
    );
  }
  if (status === "critical") {
    const days = differenceInDays(startOfDay(new Date(date!)), startOfDay(new Date()));
    return (
      <div className="flex items-center gap-1.5">
        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] px-1.5 py-0 hover:bg-amber-500/20">
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          {days === 0 ? "Hoje" : `${days}d`}
        </Badge>
        <span className="text-xs">{formatDate(date!)}</span>
      </div>
    );
  }
  return <span className="text-sm">{formatDate(date!)}</span>;
}

interface Order {
  order_id: string;
  current_status: string;
  client_name: string;
  client_cpf: string;
  product_name: string;
  product_price: number | null;
  sla_vault_due_date: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;

const OrdersList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input (400ms)
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  // Fetch orders with server-side pagination
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("orders")
          .select("order_id, current_status, client_name, client_cpf, product_name, product_price, sla_vault_due_date, created_at", { count: "exact" })
          .order("created_at", { ascending: false });

        // Status filter
        if (statusFilter === "overdue") {
          const today = new Date().toISOString().split("T")[0];
          query = query
            .lt("sla_vault_due_date", today)
            .not("current_status", "in", '("DELIVERED","CANCELLED")');
        } else if (statusFilter !== "all") {
          query = query.eq("current_status", statusFilter as any);
        }

        // Date filter
        if (dateFilter !== "all") {
          const now = new Date();
          let startDate: Date;
          switch (dateFilter) {
            case "today":
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case "week":
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "month":
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case "quarter":
              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            default:
              startDate = new Date(0);
          }
          query = query.gte("created_at", startDate.toISOString());
        }

        // Search filter (server-side for order_id and client_name)
        if (debouncedSearch) {
          query = query.or(`order_id.ilike.%${debouncedSearch}%,client_name.ilike.%${debouncedSearch}%,product_name.ilike.%${debouncedSearch}%`);
        }

        // Pagination
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        setOrders(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, statusFilter, dateFilter, debouncedSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, dateFilter, debouncedSearch]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getStatusColor = (status: string) => {
    if (status === "DELIVERED") return "bg-success/20 text-success";
    if (["ORDER_CONFIRMED", "SOURCING", "NEGOTIATING"].includes(status))
      return "bg-primary/20 text-primary";
    if (status === "BALANCE_DUE" || status === "BALANCE_PENDING") return "bg-warning/20 text-warning";
    return "bg-secondary text-muted-foreground";
  };

  // CSV Export via RPC (no row limit)
  const handleExportCSV = async () => {
    try {
      const dateFrom = dateFilter !== "all" ? (() => {
        const now = new Date();
        switch (dateFilter) {
          case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          case "week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          case "month": return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          case "quarter": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
          default: return null;
        }
      })() : null;

      const { data, error } = await typedRpc<AdminOrdersCsvRow[]>("get_admin_orders_csv", {
        p_status: statusFilter,
        p_search: search,
        p_date_from: dateFrom,
      });
      if (error) throw error;

      const headers = ["Pedido", "Cliente", "CPF", "Produto", "Preço", "Status", "Prazo SLA", "SLA Status", "Criado em"];
      const rows = (data || []).map((o) => [
        o.order_id,
        o.client_name,
        formatCPF(o.client_cpf),
        o.product_name,
        o.product_price ? formatCurrency(o.product_price) : "-",
        ORDER_STATUS_LABELS[o.current_status] || o.current_status,
        o.sla_vault_due_date ? formatDate(o.sla_vault_due_date) : "-",
        getSlaStatusLabel(getSlaStatus(o.sla_vault_due_date)),
        formatDate(o.created_at),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pedidos_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();

      toast({ title: "Exportado!", description: `${(data || []).length} pedidos exportados.` });
    } catch (error) {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando pedidos…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            {totalCount} pedidos no total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Link to="/admin/pedidos/novo">
            <Button className="btn-gold">
              <Plus className="mr-2 h-4 w-4" />
              Novo Pedido
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 bg-secondary/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="overdue">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                Vencidos (SLA)
              </span>
            </SelectItem>
            {VAULT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full md:w-44 bg-secondary/50">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Últimos 7 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="card-premium overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const slaStatus = getSlaStatus(order.sla_vault_due_date);
                return (
                <TableRow
                  key={order.order_id}
                  className={`border-border cursor-pointer hover:bg-secondary/30 ${slaStatus === "overdue" ? "bg-destructive/5" : ""}`}
                  onClick={() => navigate(`/admin/pedidos/${order.order_id}`)}
                >
                  <TableCell className="font-medium">{order.order_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCPF(order.client_cpf)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.product_name}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.current_status)}`}>
                      {ORDER_STATUS_LABELS[order.current_status] || order.current_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SlaCell date={order.sla_vault_due_date} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/pedidos/${order.order_id}`); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground card-premium rounded-lg">
            Nenhum pedido encontrado
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              className="card-premium p-4 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/admin/pedidos/${order.order_id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-medium">{order.order_id}</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.current_status)}`}>
                  {ORDER_STATUS_LABELS[order.current_status] || order.current_status}
                </span>
              </div>
              <p className="font-medium text-sm truncate">{order.product_name}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{order.client_name}</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
