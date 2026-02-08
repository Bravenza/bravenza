import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle2, Clock, AlertTriangle, Star, XCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MarketplaceOrder } from "@/hooks/useMarketplace";
import { MarketplaceChatDialog } from "./MarketplaceChatDialog";
import { DisputeDialog } from "./DisputeDialog";
import { ContestationBanner } from "@/components/marketplace/ContestationBanner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Aguardando pagamento", color: "bg-warning/20 text-warning", icon: Clock },
  paid: { label: "Pago", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
  ship_to_hub_pending: { label: "Aguardando envio ao Hub", color: "bg-warning/20 text-warning", icon: Clock },
  in_transit_to_hub: { label: "Em trânsito → Hub", color: "bg-purple-500/20 text-purple-400", icon: Truck },
  hub_received: { label: "Recebido no Hub", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
  inspection_pending: { label: "Em inspeção", color: "bg-amber-500/20 text-amber-400", icon: Package },
  inspection_approved: { label: "Autêntico ✓", color: "bg-success/20 text-success", icon: CheckCircle2 },
  inspection_rejected: { label: "Réplica ✗", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  ship_to_buyer_pending: { label: "Pronto p/ envio", color: "bg-blue-500/20 text-blue-400", icon: Package },
  in_transit_to_buyer: { label: "Em trânsito → Você", color: "bg-purple-500/20 text-purple-400", icon: Truck },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400", icon: Truck },
  delivered: { label: "Entregue", color: "bg-success/20 text-success", icon: CheckCircle2 },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: XCircle },
  disputed: { label: "Em disputa", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  payout_pending: { label: "Pagamento pendente", color: "bg-primary/20 text-primary", icon: Clock },
  payout_released: { label: "Pago ao vendedor", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

interface MarketplaceOrdersViewProps {
  orders: MarketplaceOrder[];
  sales: MarketplaceOrder[];
  isVaultMember: boolean;
  clientCpf: string;
  clientName: string;
  onRefreshOrders: () => void;
  onRefreshSales: () => void;
  onUpdateOrderStatus: (orderId: string, status: string, extra?: Record<string, any>) => Promise<boolean>;
  onRateSeller: (orderId: string, rating: number, review?: string) => Promise<boolean>;
}

export function MarketplaceOrdersView({
  orders,
  sales,
  isVaultMember,
  clientCpf,
  clientName,
  onRefreshOrders,
  onRefreshSales,
  onUpdateOrderStatus,
  onRateSeller,
}: MarketplaceOrdersViewProps) {
  const [activeTab, setActiveTab] = useState("compras");
  const [rateDialog, setRateDialog] = useState<{ orderId: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [shipDialog, setShipDialog] = useState<{ orderId: string } | null>(null);
  const [trackingCode, setTrackingCode] = useState("");

  useEffect(() => {
    onRefreshOrders();
    if (isVaultMember) onRefreshSales();
  }, []);

  const handleRate = async () => {
    if (!rateDialog) return;
    const success = await onRateSeller(rateDialog.orderId, rating, review);
    if (success) {
      setRateDialog(null);
      setRating(5);
      setReview("");
      onRefreshOrders();
    }
  };

  const handleShip = async (order?: MarketplaceOrder) => {
    if (!shipDialog) return;
    // Find the order to determine shipping mode
    const targetOrder = order || sales.find(s => s.id === shipDialog.orderId);
    const isBravenza = targetOrder?.shipping_mode === "bravenza";
    
    const status = isBravenza ? "in_transit_to_hub" : "shipped";
    const extra: Record<string, any> = isBravenza 
      ? { hub_tracking_code: trackingCode }
      : { tracking_code: trackingCode };
    
    const success = await onUpdateOrderStatus(shipDialog.orderId, status, extra);
    if (success) {
      setShipDialog(null);
      setTrackingCode("");
      onRefreshSales();
    }
  };

  const renderOrderCard = (order: MarketplaceOrder, isSale: boolean) => {
    const status = statusConfig[order.status] || statusConfig.pending_payment;
    const StatusIcon = status.icon;

    return (
      <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {order.listing?.photos?.[0] && (
                <img
                  src={order.listing.photos[0]}
                  alt={order.listing?.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{order.listing?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.order_code} · {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge className={`${status.color} text-xs flex-shrink-0 gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold">
                    R$ {(isSale ? order.seller_payout : order.sale_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  {isSale && (
                    <span className="text-xs text-muted-foreground">
                      Taxa: {order.fee_percent}% (R$ {order.fee_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                    </span>
                  )}
                </div>

                {order.tracking_code && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📦 Rastreio: <span className="font-mono">{order.tracking_code}</span>
                  </p>
                )}

                {/* PRO Hub tracking */}
                {order.shipping_mode === "bravenza" && (order.hub_tracking_code || order.hub_tracking_to_buyer) && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {order.hub_tracking_code && <p>📦 → Hub: <span className="font-mono">{order.hub_tracking_code}</span></p>}
                    {order.hub_received_at && <p>✅ Recebido no Hub: {new Date(order.hub_received_at).toLocaleDateString("pt-BR")}</p>}
                    {order.inspection_result && <p>{order.inspection_result === "approved" ? "✅ Autêntico" : "❌ Réplica"}</p>}
                    {order.hub_tracking_to_buyer && <p>📦 → Você: <span className="font-mono">{order.hub_tracking_to_buyer}</span></p>}
                  </div>
                )}

                {!isSale && (order.status === "delivered" || order.status === "completed" || order.dispute_status) && (
                  <ContestationBanner
                    deliveredAt={order.delivered_at}
                    protectionEndsAt={order.protection_ends_at}
                    status={order.status}
                    disputeStatus={order.dispute_status}
                    onOpenDispute={() => {
                      // Trigger existing dispute dialog
                      const disputeBtn = document.querySelector(`[data-dispute-order="${order.id}"]`) as HTMLButtonElement;
                      disputeBtn?.click();
                    }}
                  />
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Chat button - available for all non-cancelled orders */}
                  {!["cancelled"].includes(order.status) && (
                    <MarketplaceChatDialog
                      orderId={order.id}
                      orderCode={order.order_code}
                      clientCpf={clientCpf}
                      clientName={clientName}
                    />
                  )}

                  {/* Rate seller (buyer, delivered) */}
                  {!isSale && order.status === "delivered" && !order.buyer_rating && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      onClick={() => setRateDialog({ orderId: order.id })}
                    >
                      <Star className="h-3 w-3" />
                      Avaliar vendedor
                    </Button>
                  )}

                  {/* Open dispute (buyer, delivered, within protection) */}
                  {!isSale && order.status === "delivered" && (
                    <DisputeDialog
                      orderId={order.id}
                      clientCpf={clientCpf}
                      protectionEndsAt={order.protection_ends_at}
                      onSuccess={onRefreshOrders}
                    />
                  )}

                  {/* Ship button (seller, paid) — different label for PRO */}
                  {isSale && order.status === "paid" && (
                    <Button
                      size="sm"
                      className="text-xs gap-1 btn-gold"
                      onClick={() => setShipDialog({ orderId: order.id })}
                    >
                      <Truck className="h-3 w-3" />
                      {order.shipping_mode === "bravenza" ? "Enviar ao Hub" : "Informar envio"}
                    </Button>
                  )}

                  {/* Rating display */}
                  {order.buyer_rating && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {order.buyer_rating}/5
                    </div>
                  )}

                  {/* Dispute status */}
                  {order.dispute_status && (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                      Disputa: {order.dispute_status === "open" ? "Aberta" : "Resolvida"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compras">Minhas compras ({orders.length})</TabsTrigger>
          {isVaultMember && (
            <TabsTrigger value="vendas">Minhas vendas ({sales.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="compras" className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                <p className="font-medium">Nenhuma compra realizada</p>
                <p className="text-sm text-muted-foreground mt-1">Explore o marketplace para encontrar tênis incríveis</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => renderOrderCard(order, false))
          )}
        </TabsContent>

        {isVaultMember && (
          <TabsContent value="vendas" className="mt-4 space-y-3">
            {sales.length === 0 ? (
              <Card className="card-premium">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <p className="font-medium">Nenhuma venda realizada</p>
                  <p className="text-sm text-muted-foreground mt-1">Crie anúncios para começar a vender</p>
                </CardContent>
              </Card>
            ) : (
              sales.map((order) => renderOrderCard(order, true))
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Rate dialog */}
      <Dialog open={!!rateDialog} onOpenChange={(o) => !o && setRateDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Avaliar vendedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => setRating(v)}>
                  <Star className={`h-8 w-8 transition ${v <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
            <Input value={review} onChange={(e) => setReview(e.target.value)} placeholder="Comentário (opcional)" />
            <Button onClick={handleRate} className="w-full btn-gold">Enviar avaliação</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ship dialog */}
      <Dialog open={!!shipDialog} onOpenChange={(o) => !o && setShipDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                const o = sales.find(s => s.id === shipDialog?.orderId);
                return o?.shipping_mode === "bravenza" ? "Enviar ao Hub Bravenza" : "Informar envio";
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const o = sales.find(s => s.id === shipDialog?.orderId);
              return o?.shipping_mode === "bravenza" ? (
                <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 inline mr-1 text-primary" />
                  Envie o produto para o Hub Bravenza em Porto Alegre/RS. Após o recebimento, faremos a inspeção de autenticidade.
                </div>
              ) : null;
            })()}
            <div>
              <label className="text-sm font-medium">Código de rastreio</label>
              <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: AA123456789BR" className="mt-1" />
            </div>
            <Button onClick={() => handleShip()} className="w-full btn-gold gap-2">
              <Truck className="h-4 w-4" />
              {(() => {
                const o = sales.find(s => s.id === shipDialog?.orderId);
                return o?.shipping_mode === "bravenza" ? "Confirmar envio ao Hub" : "Confirmar envio";
              })()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
