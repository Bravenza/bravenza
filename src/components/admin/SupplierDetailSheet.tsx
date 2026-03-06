import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Mail, Phone, Globe, Star, Package, DollarSign,
  TrendingUp, CalendarDays, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Supplier {
  id: string;
  name: string;
  country: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  website: string | null;
  specialties: string[] | null;
  payment_methods: string[] | null;
  average_shipping_days: number | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface OrderRow {
  order_id: string;
  product_name: string | null;
  product_cost: number | null;
  current_status: string | null;
  created_at: string;
}

interface Props {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDetailSheet({ supplier, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!supplier || !open) return;
    fetchOrders(supplier.name);
  }, [supplier, open]);

  const fetchOrders = async (name: string) => {
    setIsLoading(true);
    try {
      // Get count + sum via full query (no limit)
      const allQuery = supabase
        .from("orders")
        .select("product_cost")
        .eq("supplier_name", name);

      const recentQuery = supabase
        .from("orders")
        .select("order_id, product_name, product_cost, current_status, created_at")
        .eq("supplier_name", name)
        .order("created_at", { ascending: false })
        .limit(10);

      const [allRes, recentRes] = await Promise.all([allQuery, recentQuery] as const);

      const allOrders = (allRes.data as { product_cost: number | null }[] | null) || [];
      setTotalOrders(allOrders.length);
      setTotalValue(allOrders.reduce((acc, o) => acc + (o.product_cost || 0), 0));
      setOrders((recentRes.data as OrderRow[] | null) || []);
    } catch (e) {
      console.error("Error fetching supplier orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const avgTicket = totalOrders > 0 ? totalValue / totalOrders : 0;
  const lastOrderDate = orders.length > 0 ? orders[0].created_at : null;

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleViewAll = () => {
    onOpenChange(false);
    navigate(`/admin/pedidos?supplier=${encodeURIComponent(supplier?.name || "")}`);
  };

  if (!supplier) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {supplier.name}
          </SheetTitle>
          <SheetDescription>Detalhes e histórico de pedidos</SheetDescription>
        </SheetHeader>

        {/* Supplier Info */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{supplier.country}</Badge>
            <Badge variant={supplier.is_active ? "default" : "secondary"}>
              {supplier.is_active ? "Ativo" : "Inativo"}
            </Badge>
            {supplier.rating && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {supplier.rating.toFixed(1)}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            {supplier.contact_name && (
              <p className="text-muted-foreground">{supplier.contact_name}</p>
            )}
            {supplier.contact_email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {supplier.contact_email}
              </div>
            )}
            {supplier.contact_phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {supplier.contact_phone}
              </div>
            )}
            {supplier.website && (
              <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline">
                <Globe className="h-3.5 w-3.5" /> {supplier.website}
              </a>
            )}
          </div>

          {supplier.specialties && supplier.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {supplier.specialties.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}

          {supplier.notes && (
            <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">{supplier.notes}</p>
          )}
        </div>

        {/* KPI Cards */}
        <h3 className="text-sm font-semibold mb-3">Histórico de Pedidos</h3>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pedidos</p>
                  <p className="text-lg font-bold">{totalOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <p className="text-lg font-bold">{formatCurrency(avgTicket)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último Pedido</p>
                  <p className="text-sm font-bold">
                    {lastOrderDate
                      ? format(new Date(lastOrderDate), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Orders Table */}
        {!isLoading && orders.length > 0 && (
          <div className="border rounded-lg overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.order_id}>
                    <TableCell className="font-mono text-xs">{o.order_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm max-w-[140px] truncate">{o.product_name || "—"}</TableCell>
                    <TableCell className="text-sm">{o.product_cost ? formatCurrency(o.product_cost) : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{o.current_status || "—"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(o.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum pedido encontrado para este fornecedor.
          </p>
        )}

        {totalOrders > 10 && (
          <Button variant="outline" className="w-full" onClick={handleViewAll}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver todos os {totalOrders} pedidos
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
