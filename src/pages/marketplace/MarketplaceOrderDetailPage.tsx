import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Package, CreditCard, ShieldCheck, Truck, CheckCircle2,
  Clock, MapPin, FileText, MessageCircle, AlertTriangle, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useConfig } from "@/hooks/useConfig";
import { useOrderDetail } from "@/hooks/marketplace/useOrderDetail";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Status Stepper Steps ────────────────────────────────────
const BUYER_STEPS = [
  { key: "paid", label: "Pago", icon: CreditCard },
  { key: "authenticated", label: "Autenticado", icon: ShieldCheck },
  { key: "shipped", label: "Enviado", icon: Truck },
  { key: "delivered", label: "Entregue", icon: CheckCircle2 },
];

const STATUS_ORDER: Record<string, number> = {
  pending_payment: -1,
  paid: 0,
  ship_to_hub_pending: 0,
  in_transit_to_hub: 0,
  hub_received: 1,
  inspection_pending: 1,
  inspection_approved: 1,
  ship_to_buyer_pending: 2,
  in_transit_to_buyer: 2,
  shipped: 2,
  delivered: 3,
  completed: 4,
  payout_released: 4,
};

function getStepIndex(status: string): number {
  return STATUS_ORDER[status] ?? -1;
}

// ─── Stepper Component ───────────────────────────────────────
function OrderStepper({ status }: { status: string }) {
  const currentIdx = getStepIndex(status);
  const isCancelled = status === "cancelled" || status === "disputed";

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-semibold text-destructive">
          {status === "cancelled" ? "Pedido cancelado" : "Em disputa"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-4 px-2">
      {BUYER_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isComplete = currentIdx > i;
        const isCurrent = currentIdx === i;
        const isPending = currentIdx < i;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                  isComplete && "bg-primary border-primary",
                  isCurrent && "bg-primary/10 border-primary ring-4 ring-primary/10",
                  isPending && "bg-muted/30 border-border/40"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Icon className={cn("h-4.5 w-4.5", isCurrent ? "text-primary" : "text-muted-foreground/50")} />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  isComplete || isCurrent ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < BUYER_STEPS.length - 1 && (
              <div className="flex-1 mx-2 mb-5">
                <div className={cn("h-0.5 rounded-full w-full", isComplete ? "bg-primary" : "bg-border/30")} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Timeline Item ───────────────────────────────────────────
function TimelineItem({ event, isLast }: { event: any; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border/30 my-1" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium leading-tight">{event.description || event.event_type}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(event.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function MarketplaceOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const context = useOutletContext<{ cpf?: string }>();
  const cpf = context?.cpf || null;
  const { isEnabled } = useConfig();

  const { data, isLoading, error, fetchDetail, confirmDelivery } = useOrderDetail(cpf);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Feature flag gate
  const flagEnabled = isEnabled("enable_order_detail_v2");

  useEffect(() => {
    if (!flagEnabled) {
      navigate("/app/pedidos", { replace: true });
      return;
    }
    if (orderId && cpf) {
      fetchDetail(orderId);
    }
  }, [orderId, cpf, flagEnabled]);

  if (!flagEnabled) return null;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <p className="font-semibold">{error || "Pedido não encontrado"}</p>
        <Button variant="outline" onClick={() => navigate("/app/pedidos")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos pedidos
        </Button>
      </div>
    );
  }

  const { order, timeline, documents, allowed_actions, role } = data;
  const listing = order.listing;
  const mainPhoto = listing?.photos?.[0];

  const handleConfirmDelivery = async () => {
    if (!orderId) return;
    setConfirming(true);
    const ok = await confirmDelivery(orderId);
    setConfirming(false);
    if (ok) {
      toast({ title: "Recebimento confirmado!", description: "O pagamento será liberado ao vendedor." });
      setConfirmOpen(false);
      fetchDetail(orderId);
    } else {
      toast({ title: "Erro", description: "Não foi possível confirmar.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-12 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate("/app/pedidos")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Meus pedidos
        </button>
        <div className="flex items-start gap-4">
          {mainPhoto && (
            <img
              src={mainPhoto}
              alt={listing?.title || "Sneaker"}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-white border border-border/20"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-snug line-clamp-2">
              {listing?.title || `Pedido ${order.order_code}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-mono">{order.order_code}</span>
              {listing?.size && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">Tam. {listing.size}</Badge>
              )}
              {listing?.condition && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">{listing.condition}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              {role === "seller" && " · Você é o vendedor"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stepper */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-4">
            <OrderStepper status={order.status} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tracking */}
      {(order.tracking_code || order.hub_tracking_code || order.hub_tracking_to_buyer) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Rastreamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.hub_tracking_code && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Envio → Hub</span>
                  <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{order.hub_tracking_code}</span>
                </div>
              )}
              {(order.tracking_code || order.hub_tracking_to_buyer) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Envio → Você</span>
                  <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                    {order.hub_tracking_to_buyer || order.tracking_code}
                  </span>
                </div>
              )}
              {order.tracking_last_event && (
                <div className="pt-2 border-t border-border/20">
                  <p className="text-xs text-muted-foreground">Última atualização</p>
                  <p className="text-sm font-medium">{order.tracking_last_event}</p>
                  {order.tracking_last_update_at && (
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(order.tracking_last_update_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}
              {order.eta_start && order.eta_end && (
                <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Previsão de entrega</span>
                  <span className="text-sm font-semibold">
                    {new Date(order.eta_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    {" – "}
                    {new Date(order.eta_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Totals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Resumo financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item</span>
              <span>R$ {fmt(order.sale_price || 0)}</span>
            </div>
            {order.shipping_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>R$ {fmt(order.shipping_cost)}</span>
              </div>
            )}
            {order.authentication_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de autenticação</span>
                <span>R$ {fmt(order.authentication_fee)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>R$ {fmt((order.sale_price || 0) + (order.shipping_cost || 0) + (order.authentication_fee || 0))}</span>
            </div>
            {role === "seller" && (
              <div className="flex justify-between text-sm pt-1 text-primary">
                <span>Você recebe</span>
                <span className="font-semibold">R$ {fmt(order.seller_payout || 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.map((ev, i) => (
                <TimelineItem key={ev.id} event={ev} isLast={i === timeline.length - 1} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.map(doc => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{doc.document_name}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action buttons */}
      {allowed_actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-2"
        >
          {allowed_actions.includes("pay") && (
            <Button className="flex-1 min-w-[140px] gap-2" onClick={() => navigate(`/pagamento/${order.order_code}`)}>
              <CreditCard className="h-4 w-4" /> Pagar agora
            </Button>
          )}
          {allowed_actions.includes("rate") && (
            <Button className="flex-1 min-w-[140px] gap-2" onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 className="h-4 w-4" /> Confirmar recebimento
            </Button>
          )}
          {allowed_actions.includes("open_dispute") && (
            <Button variant="outline" className="flex-1 min-w-[140px] gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
              <AlertTriangle className="h-4 w-4" /> Reportar problema
            </Button>
          )}
          {allowed_actions.includes("ship") && (
            <Button className="flex-1 min-w-[140px] gap-2">
              <Truck className="h-4 w-4" /> {order.shipping_mode === "bravenza" ? "Enviar ao Hub" : "Informar envio"}
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 min-w-[140px] gap-2"
            onClick={() => {
              // Open WhatsApp or chat support
              window.open("https://wa.me/5551999999999", "_blank");
            }}
          >
            <MessageCircle className="h-4 w-4" /> Falar com suporte
          </Button>
        </motion.div>
      )}

      {/* Confirm Delivery Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, você atesta que recebeu o produto em boas condições. O pagamento será liberado ao vendedor.
              Você terá até 7 dias para abrir uma disputa caso identifique algum problema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelivery} disabled={confirming}>
              {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar recebimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
