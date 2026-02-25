import { useState } from "react";
import { OrdersTabSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { QueryStateHandler } from "@/components/ui/query-state-handler";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  CreditCard,
  FileText,
  Download,
  Star,
  Camera,
  ChevronRight,
  ExternalLink,
  Shield,
  MapPin,
  Copy,
  Check,
} from "lucide-react";
import { ReviewForm } from "@/components/client/ReviewForm";
import { InspectionPhotosGallery } from "@/components/client/InspectionPhotosGallery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OrderData {
  order_id: string;
  order_type: string;
  current_status: string;
  product_name: string;
  product_brand: string | null;
  product_model: string | null;
  product_size: string | null;
  product_color: string | null;
  product_price: number | null;
  product_currency: string | null;
  payment_mode: string | null;
  sinal_value: number | null;
  sinal_paid: boolean | null;
  sinal_paid_at: string | null;
  balance_value: number | null;
  balance_paid: boolean | null;
  balance_paid_at: string | null;
  budget_status: string | null;
  budget_approval_token: string | null;
  international_tracking: string | null;
  national_tracking: string | null;
  national_carrier: string | null;
  created_at: string;
  updated_at: string;
  history: { status: string; notes: string | null; created_at: string }[];
  inspection_photos: string[] | null;
}

interface OrdersTabProps {
  orders: OrderData[];
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  sessionToken: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  novo: { label: "Novo", color: "bg-muted text-muted-foreground", icon: Clock },
  orcamento_enviado: {
    label: "Orçamento enviado",
    color: "bg-amber-500/20 text-amber-500",
    icon: Clock,
  },
  orcamento_aprovado: {
    label: "Aprovado",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  aguardando_sinal: {
    label: "Aguardando sinal",
    color: "bg-amber-500/20 text-amber-500",
    icon: Clock,
  },
  sinal_confirmado: {
    label: "Sinal confirmado",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  em_separacao: {
    label: "Em separação",
    color: "bg-primary/20 text-primary",
    icon: Package,
  },
  enviado_internacional: {
    label: "Em trânsito até o Hub",
    color: "bg-primary/20 text-primary",
    icon: Truck,
  },
  em_fiscalizacao: {
    label: "Em autenticação",
    color: "bg-amber-500/20 text-amber-500",
    icon: Shield,
  },
  aguardando_saldo: {
    label: "Aguardando saldo",
    color: "bg-amber-500/20 text-amber-500",
    icon: Clock,
  },
  saldo_confirmado: {
    label: "Saldo confirmado",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  enviado_cliente: {
    label: "Enviado para você",
    color: "bg-primary/20 text-primary",
    icon: Truck,
  },
  entregue: {
    label: "Entregue",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-destructive/20 text-destructive",
    icon: Clock,
  },
  // Legacy status mappings
  ORDER_CONFIRMED: {
    label: "Pedido confirmado",
    color: "bg-primary/20 text-primary",
    icon: CheckCircle2,
  },
  SOURCING: {
    label: "Buscando produto",
    color: "bg-amber-500/20 text-amber-500",
    icon: Clock,
  },
  NEGOTIATING: {
    label: "Negociando",
    color: "bg-amber-500/20 text-amber-500",
    icon: Clock,
  },
  PURCHASE_COMPLETED: {
    label: "Compra realizada",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  PACKAGE_EN_ROUTE: {
    label: "Em trânsito até o Hub",
    color: "bg-primary/20 text-primary",
    icon: Truck,
  },
  ARRIVED: {
    label: "Recebido no Hub",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  INSPECTION_APPROVED: {
    label: "Autenticidade confirmada",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
  BALANCE_DUE: {
    label: "Aguardando saldo",
    color: "bg-amber-500/20 text-amber-500",
    icon: Clock,
  },
  INTERNATIONAL_DISPATCH: {
    label: "Enviado",
    color: "bg-primary/20 text-primary",
    icon: Truck,
  },
  CUSTOMS: {
    label: "Em autenticação",
    color: "bg-amber-500/20 text-amber-500",
    icon: Shield,
  },
  NATIONAL_TRANSIT: {
    label: "Em trânsito",
    color: "bg-primary/20 text-primary",
    icon: Truck,
  },
  DISPATCHED: {
    label: "Saiu para entrega",
    color: "bg-primary/20 text-primary",
    icon: Truck,
  },
  DELIVERED: {
    label: "Entregue",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
};

// Tracking progress steps derived from order status
const TRACKING_STEPS = [
  { key: "confirmed", label: "Confirmado", icon: CheckCircle2, statuses: ["novo", "orcamento_enviado", "orcamento_aprovado", "aguardando_sinal", "sinal_confirmado", "ORDER_CONFIRMED"] },
  { key: "sourcing", label: "Separação", icon: Package, statuses: ["em_separacao", "SOURCING", "NEGOTIATING", "PURCHASE_COMPLETED"] },
  { key: "transit_hub", label: "Trânsito até o Hub", icon: Truck, statuses: ["enviado_internacional", "PACKAGE_EN_ROUTE", "INTERNATIONAL_DISPATCH", "em_fiscalizacao", "CUSTOMS", "ARRIVED"] },
  { key: "authentication", label: "Autenticação", icon: Shield, statuses: ["aguardando_saldo", "saldo_confirmado", "INSPECTION_APPROVED", "BALANCE_DUE"] },
  { key: "transit", label: "Em trânsito", icon: Truck, statuses: ["enviado_cliente", "NATIONAL_TRANSIT", "DISPATCHED"] },
  { key: "delivered", label: "Entregue", icon: MapPin, statuses: ["entregue", "DELIVERED"] },
];

function getActiveStepIndex(status: string): number {
  for (let i = TRACKING_STEPS.length - 1; i >= 0; i--) {
    if (TRACKING_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

function InternalTrackingWidget({ order }: { order: OrderData }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const activeStep = getActiveStepIndex(order.current_status);
  const isCancelled = order.current_status === "cancelado";

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-4">Rastreamento</h4>

      {/* Visual Progress Stepper */}
      <div className="relative px-1 mb-4">
        {/* Progress Line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border/50 rounded-full" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary rounded-full transition-all duration-500"
          style={{ width: isCancelled ? "0%" : `${Math.min((activeStep / (TRACKING_STEPS.length - 1)) * 100, 100)}%`, maxWidth: "calc(100% - 2rem)" }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = !isCancelled && idx <= activeStep;
            const isCurrent = !isCancelled && idx === activeStep;
            const StepIcon = step.icon;
            return (
              <div key={step.key} className="flex flex-col items-center" style={{ width: "16.66%" }}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <span className={cn(
                  "text-[9px] mt-1.5 text-center leading-tight",
                  isCurrent ? "text-primary font-semibold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking Code */}
      <div className="space-y-2">
        {order.national_tracking && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                Rastreio{order.national_carrier && ` · ${order.national_carrier}`}
              </p>
              <p className="font-mono text-sm truncate">{order.national_tracking}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCopy(order.national_tracking!)}
              >
                {copiedCode === order.national_tracking ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <a
                href={`https://www.linkcorreios.com.br/?id=${order.national_tracking}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrdersTab({ orders, isLoading, isError, error, onRetry, sessionToken }: OrdersTabProps) {
  const [reviewOrder, setReviewOrder] = useState<{
    orderId: string;
    productName: string;
  } | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);

  const formatCurrency = (value: number | null, currency: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  };

  if (isLoading || isError) {
    return (
      <QueryStateHandler
        isLoading={isLoading}
        isError={!!isError}
        error={error}
        onRetry={onRetry}
        skeleton={<OrdersTabSkeleton />}
        errorMessage="Erro ao carregar seus pedidos"
      >
        <></>
      </QueryStateHandler>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-lg font-medium mb-2">Nenhum pedido ainda</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quando você fizer seu primeiro pedido, ele aparecerá aqui.
        </p>
        <Button asChild>
          <a href="/solicitar">Fazer primeiro pedido</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order, index) => {
          const statusConfig =
            STATUS_CONFIG[order.current_status] || {
              label: order.current_status,
              color: "bg-muted text-muted-foreground",
              icon: Clock,
            };
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={order.order_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-muted/50">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {order.product_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            #{order.order_id}
                          </span>
                          {order.product_size && (
                            <Badge variant="outline" className="text-xs">
                              {order.product_size}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn("text-[10px] sm:text-xs whitespace-nowrap", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pedido #{selectedOrder.order_id}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Product Info */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <h4 className="font-medium mb-3">
                    {selectedOrder.product_name}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedOrder.product_brand && (
                      <div>
                        <p className="text-muted-foreground">Marca</p>
                        <p className="font-medium">
                          {selectedOrder.product_brand}
                        </p>
                      </div>
                    )}
                    {selectedOrder.product_size && (
                      <div>
                        <p className="text-muted-foreground">Tamanho</p>
                        <p className="font-medium">
                          {selectedOrder.product_size}
                        </p>
                      </div>
                    )}
                    {selectedOrder.product_color && (
                      <div>
                        <p className="text-muted-foreground">Cor</p>
                        <p className="font-medium">
                          {selectedOrder.product_color}
                        </p>
                      </div>
                    )}
                    {selectedOrder.product_price && (
                      <div>
                        <p className="text-muted-foreground">Preço</p>
                        <p className="font-medium">
                          {formatCurrency(
                            selectedOrder.product_price,
                            selectedOrder.product_currency
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Status atual</h4>
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      STATUS_CONFIG[selectedOrder.current_status]?.color ||
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {STATUS_CONFIG[selectedOrder.current_status]?.label ||
                      selectedOrder.current_status}
                  </Badge>
                </div>

                {/* Payment Status */}
                {selectedOrder.payment_mode === "split" && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Pagamento</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Sinal
                          </span>
                          {selectedOrder.sinal_paid ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="font-medium mt-1">
                          {formatCurrency(
                            selectedOrder.sinal_value,
                            selectedOrder.product_currency
                          )}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Saldo
                          </span>
                          {selectedOrder.balance_paid ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="font-medium mt-1">
                          {formatCurrency(
                            selectedOrder.balance_value,
                            selectedOrder.product_currency
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Internal Tracking Widget */}
                {(selectedOrder.international_tracking ||
                  selectedOrder.national_tracking) && (
                  <InternalTrackingWidget order={selectedOrder} />
                )}

                {/* Inspection Photos */}
                {selectedOrder.inspection_photos &&
                  selectedOrder.inspection_photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Fotos de inspeção
                      </h4>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowPhotos(true)}
                      >
                        <Camera className="h-4 w-4" />
                        Ver {selectedOrder.inspection_photos.length} fotos
                      </Button>
                    </div>
                  )}

                {/* Timeline */}
                {selectedOrder.history && selectedOrder.history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Histórico</h4>
                    <div className="space-y-3">
                      {selectedOrder.history.slice(0, 5).map((event, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            {idx < selectedOrder.history.length - 1 && (
                              <div className="w-px h-full bg-border/50 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="font-medium">
                              {STATUS_CONFIG[event.status]?.label ||
                                event.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                            {event.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to={`/rastreio/${selectedOrder.order_id}`}>
                      <Truck className="h-4 w-4 mr-2" />
                      Rastrear
                    </Link>
                  </Button>

                  {selectedOrder.budget_status === "SENT" && (
                    <Button className="flex-1" asChild>
                      <Link
                        to={`/orcamento/${selectedOrder.budget_approval_token}`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver orçamento
                      </Link>
                    </Button>
                  )}

                  {selectedOrder.budget_status === "APPROVED" &&
                    !selectedOrder.balance_paid &&
                    selectedOrder.sinal_paid && (
                      <Button className="flex-1" asChild>
                        <Link
                          to={`/pagamento/${selectedOrder.budget_approval_token}`}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pagar saldo
                        </Link>
                      </Button>
                    )}

                  {selectedOrder.budget_status === "APPROVED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        window.open(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf?order_id=${selectedOrder.order_id}&type=budget`,
                          "_blank"
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}

                  {selectedOrder.current_status === "DELIVERED" &&
                    !reviewedOrders.has(selectedOrder.order_id) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewOrder({
                            orderId: selectedOrder.order_id,
                            productName: selectedOrder.product_name,
                          });
                          setSelectedOrder(null);
                        }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Avaliar
                      </Button>
                    )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photos Gallery */}
      {selectedOrder?.inspection_photos && (
        <Dialog open={showPhotos} onOpenChange={setShowPhotos}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Fotos de inspeção</DialogTitle>
            </DialogHeader>
            <InspectionPhotosGallery
              photos={selectedOrder.inspection_photos}
              productName={selectedOrder.product_name}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewForm
          orderId={reviewOrder.orderId}
          productName={reviewOrder.productName}
          sessionToken={sessionToken}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() =>
            setReviewedOrders((prev) => new Set([...prev, reviewOrder.orderId]))
          }
        />
      )}
    </>
  );
}
