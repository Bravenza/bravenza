import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Store, Package, Clock, CheckCircle2, Truck, XCircle, AlertTriangle,
  DollarSign, Loader2, ShieldCheck, MessageCircle, Search, CalendarIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
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
  dispute_resolution: string | null;
  dispute_opened_at: string | null;
  dispute_resolved_at: string | null;
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
  paid: { label: "Pago", color: "bg-info/20 text-info", icon: CheckCircle2 },
  ship_to_hub_pending: { label: "Envio ao Hub", color: "bg-warning/20 text-warning", icon: Clock },
  in_transit_to_hub: { label: "→ Hub", color: "bg-primary/20 text-primary", icon: Truck },
  hub_received: { label: "No Hub", color: "bg-info/20 text-info", icon: CheckCircle2 },
  inspection_pending: { label: "Inspeção", color: "bg-warning/20 text-warning", icon: ShieldCheck },
  inspection_approved: { label: "Autêntico", color: "bg-success/20 text-success", icon: CheckCircle2 },
  inspection_rejected: { label: "Reprovado", color: "bg-destructive/20 text-destructive", icon: XCircle },
  ship_to_buyer_pending: { label: "Pronto envio", color: "bg-info/20 text-info", icon: Package },
  in_transit_to_buyer: { label: "→ Comprador", color: "bg-primary/20 text-primary", icon: Truck },
  shipped: { label: "Enviado", color: "bg-primary/20 text-primary", icon: Truck },
  delivered: { label: "Entregue", color: "bg-success/20 text-success", icon: CheckCircle2 },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: XCircle },
  disputed: { label: "Em disputa", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  payout_pending: { label: "Repasse pendente", color: "bg-primary/20 text-primary", icon: Clock },
  payout_released: { label: "Pago", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

const ORDERS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-order-ops`;
const FULFILL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-fulfill`;

export default function MarketplaceOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState("refund_buyer");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [payoutProofUrl, setPayoutProofUrl] = useState("");
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 20;

  // Search & date filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Admin chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 400);
  }, []);

  const getDateRange = useCallback((): { from?: string; to?: string } => {
    const now = new Date();
    switch (datePreset) {
      case "today":
        return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
      case "7days":
        return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
      case "30days":
        return { from: startOfDay(subDays(now, 30)).toISOString(), to: endOfDay(now).toISOString() };
      case "custom":
        return {
          from: customFrom ? startOfDay(customFrom).toISOString() : undefined,
          to: customTo ? endOfDay(customTo).toISOString() : undefined,
        };
      default:
        return {};
    }
  }, [datePreset, customFrom, customTo]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ action: "admin-orders", status: statusFilter, page: String(page), pageSize: String(pageSize) });
      if (searchQuery) params.set("search", searchQuery);
      const { from, to } = getDateRange();
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${ORDERS_URL}?${params}`, { headers: h });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (err) {
      console.error("Fetch admin orders error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [statusFilter, datePreset, customFrom, customTo]);
  useEffect(() => { fetchOrders(); }, [statusFilter, page, searchQuery, datePreset, customFrom, customTo]);

  const updateStatus = async (orderId: string, status: string, extra?: Record<string, any>) => {
    setActionLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${ORDERS_URL}?action=update-order-status`, {
        method: "PUT",
        headers: h,
        body: JSON.stringify({ order_id: orderId, status, admin_notes: adminNotes, ...extra }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      toast({ title: "Status atualizado!" });
      fetchOrders();
      setDetailOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const resolveDispute = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${FULFILL_URL}?action=resolve-dispute`, {
        method: "PUT",
        headers: h,
        body: JSON.stringify({
          order_id: selectedOrder.id,
          resolution,
          refund_amount: refundAmount ? parseFloat(refundAmount) : 0,
          admin_notes: resolveNotes,
        }),
      });
      if (!res.ok) throw new Error("Erro ao resolver disputa");
      toast({ title: "Disputa resolvida!" });
      setResolveOpen(false);
      fetchOrders();
      setDetailOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const fetchChat = async (orderId: string) => {
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "chat-messages", order_id: orderId });
      const res = await fetch(`${FULFILL_URL}?${params}`, { headers: h });
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) {
      console.error("Fetch chat error:", err);
    }
  };

  const sendAdminMsg = async () => {
    if (!selectedOrder || !chatMsg.trim()) return;
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const h = await getMarketplaceHeaders();
      await fetch(`${FULFILL_URL}?action=send-message`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ order_id: selectedOrder.id, sender_name: "Admin Bravenza", message: chatMsg.trim(), is_admin: true }),
      });
      setChatMsg("");
      fetchChat(selectedOrder.id);
    } catch (err) {
      console.error("Send admin msg error:", err);
    }
  };

  const openDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || "");
    setDetailOpen(true);
  };

  const totalRevenue = orders.filter((o) => ["completed", "delivered"].includes(o.status)).reduce((sum, o) => sum + o.fee_amount, 0);
  const pendingPayout = orders.filter((o) => o.status === "delivered" && !o.payout_released_at).reduce((sum, o) => sum + o.seller_payout, 0);
  const disputeCount = orders.filter((o) => o.dispute_status === "open").length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Marketplace - Pedidos
        </h1>
        <p className="text-muted-foreground">Gerencie transações e disputas do marketplace</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-premium"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalOrders}</p><p className="text-xs text-muted-foreground">Total de pedidos</p></CardContent></Card>
        <Card className="card-premium"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Receita (comissões)</p></CardContent></Card>
        <Card className="card-premium"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">R$ {pendingPayout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Repasses pendentes</p></CardContent></Card>
        <Card className="card-premium"><CardContent className="p-4 text-center"><p className={`text-2xl font-bold ${disputeCount > 0 ? "text-destructive" : ""}`}>{disputeCount}</p><p className="text-xs text-muted-foreground">Disputas abertas</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar código ou comprador..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending_payment">Aguardando pagamento</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="shipped">Enviados</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="payout_pending">Repasse pendente</SelectItem>
            <SelectItem value="payout_released">Repasse realizado</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="disputed">Em disputa</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={datePreset} onValueChange={setDatePreset}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">7 dias</SelectItem>
            <SelectItem value="30days">30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {datePreset === "custom" && (
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left text-xs", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy") : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">→</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left text-xs", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {customTo ? format(customTo, "dd/MM/yyyy") : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <Card className="card-premium"><CardContent className="py-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" /><p className="font-medium">Nenhum pedido encontrado</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const status = statusConfig[order.status] || statusConfig.pending_payment;
            const StatusIcon = status.icon;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="card-premium cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openDetail(order)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {order.listing?.photos?.[0] && <img src={order.listing.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{order.listing?.title}</p>
                          <p className="text-xs text-muted-foreground">{order.order_code} · {order.buyer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="font-bold text-sm">R$ {order.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          <p className="text-[10px] text-muted-foreground">Comissão: R$ {order.fee_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <Badge className={`${status.color} text-xs gap-1`}><StatusIcon className="h-3 w-3" />{status.label}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {totalOrders === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalOrders)} de {totalOrders} pedidos
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-5">
              <SheetHeader><SheetTitle>{selectedOrder.order_code}</SheetTitle></SheetHeader>

              {/* Product */}
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                {selectedOrder.listing?.photos?.[0] && <img src={selectedOrder.listing.photos[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />}
                <div>
                  <p className="font-medium text-sm">{selectedOrder.listing?.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.listing?.brand} · {selectedOrder.listing?.model} · Tam. {selectedOrder.listing?.size}</p>
                  {selectedOrder.listing?.is_vault_certified && <Badge className="bg-primary/20 text-primary text-xs mt-1 gap-0.5"><ShieldCheck className="h-3 w-3" /> Vault ID</Badge>}
                </div>
              </div>

              <Separator />

              {/* Financial */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Valor da venda</span><span className="font-medium">R$ {selectedOrder.sale_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ {selectedOrder.shipping_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-primary"><span>Comissão ({selectedOrder.fee_percent}%)</span><span className="font-medium">R$ {selectedOrder.fee_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span>Repasse ao vendedor</span><span>R$ {selectedOrder.seller_payout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
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

              {/* Dispute info */}
              {selectedOrder.dispute_status && (
                <>
                  <Separator />
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm space-y-1">
                    <p className="font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Disputa {selectedOrder.dispute_status === "open" ? "aberta" : "resolvida"}</p>
                    {selectedOrder.dispute_reason && <p className="text-muted-foreground">{selectedOrder.dispute_reason}</p>}
                    {selectedOrder.dispute_opened_at && <p className="text-xs text-muted-foreground">Aberta em: {new Date(selectedOrder.dispute_opened_at).toLocaleString("pt-BR")}</p>}
                    {selectedOrder.dispute_resolution && <p className="text-xs">Resolução: {selectedOrder.dispute_resolution}</p>}
                  </div>
                </>
              )}

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
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Anotações internas..." rows={3} />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ações</p>

                {/* Chat */}
                <Button className="w-full gap-2" variant="outline" onClick={() => { fetchChat(selectedOrder.id); setChatOpen(true); }}>
                  <MessageCircle className="h-4 w-4" />
                  Ver/enviar mensagens
                </Button>

                {selectedOrder.status === "paid" && (
                  <Button className="w-full gap-2" variant="outline" disabled={actionLoading} onClick={() => updateStatus(selectedOrder.id, "shipped")}>
                    <Truck className="h-4 w-4" /> Marcar como enviado
                  </Button>
                )}
                {selectedOrder.status === "shipped" && (
                  <Button className="w-full gap-2" variant="outline" disabled={actionLoading} onClick={() => updateStatus(selectedOrder.id, "delivered")}>
                    <CheckCircle2 className="h-4 w-4" /> Confirmar entrega
                  </Button>
                )}
                {selectedOrder.status === "delivered" && !selectedOrder.payout_released_at && (
                  <div className="space-y-2">
                    <Input
                      value={payoutProofUrl}
                      onChange={(e) => setPayoutProofUrl(e.target.value)}
                      placeholder="URL comprovante PIX (opcional)"
                    />
                    <Button className="w-full gap-2 btn-gold" disabled={actionLoading} onClick={() => updateStatus(selectedOrder.id, "payout_released", { payout_method: "pix", payout_proof_url: payoutProofUrl || null })}>
                      <DollarSign className="h-4 w-4" /> Liberar repasse ao vendedor
                    </Button>
                  </div>
                )}
                {selectedOrder.status === "payout_pending" && (
                  <div className="space-y-2">
                    <Input
                      value={payoutProofUrl}
                      onChange={(e) => setPayoutProofUrl(e.target.value)}
                      placeholder="URL comprovante PIX (opcional)"
                    />
                    <Button className="w-full gap-2 btn-gold" disabled={actionLoading} onClick={() => updateStatus(selectedOrder.id, "payout_released", { payout_method: "pix", payout_proof_url: payoutProofUrl || null })}>
                      <DollarSign className="h-4 w-4" /> Processar repasse (R$ {selectedOrder.seller_payout.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                    </Button>
                  </div>
                )}

                {/* Resolve dispute */}
                {selectedOrder.dispute_status === "open" && (
                  <Button className="w-full gap-2" variant="outline" onClick={() => { setResolveOpen(true); setResolveNotes(""); setRefundAmount(String(selectedOrder.sale_price)); }}>
                    <AlertTriangle className="h-4 w-4" /> Resolver disputa
                  </Button>
                )}

                {!["cancelled", "completed"].includes(selectedOrder.status) && (
                  <Button className="w-full gap-2" variant="destructive" disabled={actionLoading} onClick={() => updateStatus(selectedOrder.id, "cancelled", { reason: "Cancelado pelo admin" })}>
                    <XCircle className="h-4 w-4" /> Cancelar pedido
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Resolve Dispute Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Resolver disputa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Resolução</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund_buyer">Reembolso total ao comprador</SelectItem>
                  <SelectItem value="favor_seller">Decisão a favor do vendedor</SelectItem>
                  <SelectItem value="partial_refund">Reembolso parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(resolution === "refund_buyer" || resolution === "partial_refund") && (
              <div>
                <label className="text-sm font-medium mb-2 block">Valor do reembolso (R$)</label>
                <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Notas da resolução</label>
              <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Detalhes da resolução..." rows={3} />
            </div>
            <Button onClick={resolveDispute} disabled={actionLoading} className="w-full btn-gold">
              {actionLoading ? "Processando..." : "Confirmar resolução"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Chat do pedido</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-2 py-2">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem</p>
            ) : (
              chatMessages.map((msg: any) => (
                <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.is_admin ? "ml-auto items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm ${msg.is_admin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                    <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.is_admin ? "Admin" : msg.sender_name}</p>
                    <p className="whitespace-pre-line">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Mensagem do admin..." onKeyDown={(e) => e.key === "Enter" && sendAdminMsg()} />
            <Button onClick={sendAdminMsg} disabled={!chatMsg.trim()} size="icon" className="shrink-0">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
