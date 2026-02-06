import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertTriangle,
  DollarSign,
  Eye,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface AdminOrder {
  id: string;
  order_code: string;
  listing_id: string;
  buyer_cpf: string;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  seller_id: string;
  sale_price: number;
  fee_percent: number;
  fee_amount: number;
  seller_payout: number;
  shipping_mode: string;
  shipping_cost: number;
  tracking_code: string | null;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  protection_ends_at: string | null;
  payout_released_at: string | null;
  payout_method: string | null;
  payout_proof_url: string | null;
  buyer_rating: number | null;
  buyer_review: string | null;
  created_at: string;
  admin_notes: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  listing?: {
    title: string;
    brand: string | null;
    model: string | null;
    size: string | null;
    photos: string[];
    condition: string;
    is_vault_certified?: boolean;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Aguardando pagamento", color: "bg-warning/20 text-warning", icon: Clock },
  paid: { label: "Pago", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400", icon: Truck },
  delivered: { label: "Entregue", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: XCircle },
  disputed: { label: "Em disputa", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
};

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-marketplace`;

export default function MarketplaceOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ action: "admin-orders", status: statusFilter });
      const res = await fetch(`${FUNCTION_URL}?${params}`, {
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": "admin",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch admin orders error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const updateStatus = async (orderId: string, status: string, extra?: Record<string, any>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${FUNCTION_URL}?action=update-order-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": "admin",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ order_id: orderId, status, admin_notes: adminNotes, ...extra }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      toast({ title: "Status atualizado!" });
      fetchOrders();
      setDetailOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || "");
    setDetailOpen(true);
  };

  const totalRevenue = orders
    .filter((o) => ["completed", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + o.fee_amount, 0);

  const pendingPayout = orders
    .filter((o) => o.status === "delivered" && !o.payout_released_at)
    .reduce((sum, o) => sum + o.seller_payout, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Marketplace - Pedidos
        </h1>
        <p className="text-muted-foreground">Gerencie as transações do marketplace</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Total de pedidos</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Receita (comissões)</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              R$ {pendingPayout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Repasses pendentes</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.status === "disputed").length}
            </p>
            <p className="text-xs text-muted-foreground">Disputas abertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending_payment">Aguardando pagamento</SelectItem>
          <SelectItem value="paid">Pagos</SelectItem>
          <SelectItem value="shipped">Enviados</SelectItem>
          <SelectItem value="delivered">Entregues</SelectItem>
          <SelectItem value="completed">Concluídos</SelectItem>
          <SelectItem value="disputed">Em disputa</SelectItem>
          <SelectItem value="cancelled">Cancelados</SelectItem>
        </SelectContent>
      </Select>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
            <p className="font-medium">Nenhum pedido encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const status = statusConfig[order.status] || statusConfig.pending_payment;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card
                  className="card-premium cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => openDetail(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {order.listing?.photos?.[0] && (
                          <img
                            src={order.listing.photos[0]}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{order.listing?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.order_code} · Comprador: {order.buyer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="font-bold text-sm">
                            R$ {order.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Comissão: R$ {order.fee_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Badge className={`${status.color} text-xs gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle>{selectedOrder.order_code}</SheetTitle>
              </SheetHeader>

              {/* Product */}
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                {selectedOrder.listing?.photos?.[0] && (
                  <img
                    src={selectedOrder.listing.photos[0]}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{selectedOrder.listing?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.listing?.brand} · {selectedOrder.listing?.model} · Tam. {selectedOrder.listing?.size}
                  </p>
                  {selectedOrder.listing?.is_vault_certified && (
                    <Badge className="bg-primary/20 text-primary text-xs mt-1 gap-0.5">
                      <ShieldCheck className="h-3 w-3" /> Vault ID
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Financial */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor da venda</span>
                  <span className="font-medium">R$ {selectedOrder.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>R$ {selectedOrder.shipping_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Comissão ({selectedOrder.fee_percent}%)</span>
                  <span className="font-medium">R$ {selectedOrder.fee_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Repasse ao vendedor</span>
                  <span>R$ {selectedOrder.seller_payout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Separator />

              {/* Buyer info */}
              <div className="space-y-1 text-sm">
                <p className="font-medium">Comprador</p>
                <p>{selectedOrder.buyer_name} · {selectedOrder.buyer_cpf}</p>
                {selectedOrder.buyer_email && <p>{selectedOrder.buyer_email}</p>}
                {selectedOrder.buyer_phone && <p>{selectedOrder.buyer_phone}</p>}
                {selectedOrder.buyer_address && <p className="text-muted-foreground">{selectedOrder.buyer_address}</p>}
              </div>

              {/* Timeline */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-sm text-foreground">Timeline</p>
                <p>📋 Criado: {new Date(selectedOrder.created_at).toLocaleString("pt-BR")}</p>
                {selectedOrder.paid_at && <p>💰 Pago: {new Date(selectedOrder.paid_at).toLocaleString("pt-BR")} ({selectedOrder.payment_method})</p>}
                {selectedOrder.shipped_at && <p>📦 Enviado: {new Date(selectedOrder.shipped_at).toLocaleString("pt-BR")} {selectedOrder.tracking_code ? `(${selectedOrder.tracking_code})` : ""}</p>}
                {selectedOrder.delivered_at && <p>✅ Entregue: {new Date(selectedOrder.delivered_at).toLocaleString("pt-BR")}</p>}
                {selectedOrder.protection_ends_at && <p>🛡️ Proteção até: {new Date(selectedOrder.protection_ends_at).toLocaleDateString("pt-BR")}</p>}
                {selectedOrder.payout_released_at && <p>💸 Repasse: {new Date(selectedOrder.payout_released_at).toLocaleString("pt-BR")} ({selectedOrder.payout_method})</p>}
                {selectedOrder.cancelled_at && <p>❌ Cancelado: {new Date(selectedOrder.cancelled_at).toLocaleString("pt-BR")}</p>}
              </div>

              <Separator />

              {/* Admin notes */}
              <div>
                <p className="text-sm font-medium mb-2">Notas do admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Anotações internas..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ações</p>
                {selectedOrder.status === "paid" && (
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => updateStatus(selectedOrder.id, "shipped")}
                  >
                    <Truck className="h-4 w-4" />
                    Marcar como enviado
                  </Button>
                )}
                {selectedOrder.status === "shipped" && (
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => updateStatus(selectedOrder.id, "delivered")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar entrega
                  </Button>
                )}
                {selectedOrder.status === "delivered" && !selectedOrder.payout_released_at && (
                  <Button
                    className="w-full gap-2 btn-gold"
                    disabled={actionLoading}
                    onClick={() => updateStatus(selectedOrder.id, "completed", { payout_method: "pix" })}
                  >
                    <DollarSign className="h-4 w-4" />
                    Liberar repasse ao vendedor
                  </Button>
                )}
                {!["cancelled", "completed"].includes(selectedOrder.status) && (
                  <Button
                    className="w-full gap-2"
                    variant="destructive"
                    disabled={actionLoading}
                    onClick={() => updateStatus(selectedOrder.id, "cancelled", { reason: "Cancelado pelo admin" })}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar pedido
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
