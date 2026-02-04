import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Eye,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ORDER_STATUS_LABELS,
  VAULT_STATUSES,
  formatDate,
  formatCPF,
} from "@/lib/constants";

interface Order {
  order_id: string;
  order_type: string;
  current_status: string;
  client_name: string;
  client_cpf: string;
  product_name: string;
  sla_vault_due_date: string | null;
  created_at: string;
}

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setOrders(data || []);
        setFilteredOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    let result = [...orders];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (order) =>
          order.order_id.toLowerCase().includes(searchLower) ||
          order.client_name.toLowerCase().includes(searchLower) ||
          order.client_cpf.includes(search.replace(/\D/g, "")) ||
          order.product_name.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.current_status === statusFilter);
    }

    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  const getStatusColor = (status: string) => {
    if (status === "DELIVERED") return "bg-success/20 text-success";
    if (["ORDER_CONFIRMED", "SOURCING", "NEGOTIATING"].includes(status))
      return "bg-primary/20 text-primary";
    if (status === "BALANCE_DUE") return "bg-warning/20 text-warning";
    return "bg-secondary text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
            Gerencie todos os pedidos do sistema
          </p>
        </div>
        <Link to="/admin/pedidos/novo">
          <Button className="btn-gold">
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente, CPF ou produto..."
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
            {VAULT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
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
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.order_id}
                  className="border-border cursor-pointer hover:bg-secondary/30"
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
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.current_status
                      )}`}
                    >
                      {ORDER_STATUS_LABELS[order.current_status] ||
                        order.current_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.sla_vault_due_date
                      ? formatDate(order.sla_vault_due_date)
                      : "-"}
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/pedidos/${order.order_id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredOrders.length} de {orders.length} pedidos
      </p>
    </div>
  );
};

export default OrdersList;
