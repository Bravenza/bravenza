import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle2, Clock, AlertTriangle, Star, XCircle, MessageCircle } from "lucide-react";
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

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Aguardando pagamento", color: "bg-warning/20 text-warning", icon: Clock },
  paid: { label: "Pago", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle2 },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400", icon: Truck },
  delivered: { label: "Entregue", color: "bg-success/20 text-success", icon: CheckCircle2 },
  completed: { label: "Concluído", color: "bg-success/20 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-destructive/20 text-destructive", icon: XCircle },
  disputed: { label: "Em disputa", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
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

  const handleShip = async () => {
    if (!shipDialog) return;
    const success = await onUpdateOrderStatus(shipDialog.orderId, "shipped", { tracking_code: trackingCode });
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

                {order.protection_ends_at && order.status === "delivered" && (
                  <p className="text-xs text-warning mt-1">
                    🛡️ Proteção até {new Date(order.protection_ends_at).toLocaleDateString("pt-BR")}
                  </p>
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

                  {/* Ship button (seller, paid) */}
                  {isSale && order.status === "paid" && (
                    <Button
                      size="sm"
                      className="text-xs gap-1 btn-gold"
                      onClick={() => setShipDialog({ orderId: order.id })}
                    >
                      <Truck className="h-3 w-3" />
                      Informar envio
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
            <DialogTitle>Informar envio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Código de rastreio</label>
              <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: AA123456789BR" className="mt-1" />
            </div>
            <Button onClick={handleShip} className="w-full btn-gold gap-2">
              <Truck className="h-4 w-4" />
              Confirmar envio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
