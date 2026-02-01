import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  CreditCard,
  FileText,
  Download,
  Star,
  Camera
} from "lucide-react";
import { ReviewForm } from "@/components/client/ReviewForm";
import { InspectionPhotosGallery } from "@/components/client/InspectionPhotosGallery";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  sessionToken: string;
}

const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Pedido Confirmado",
  SOURCING: "Buscando Produto",
  NEGOTIATING: "Negociando",
  PURCHASE_COMPLETED: "Compra Realizada",
  PACKAGE_EN_ROUTE: "Em Trânsito Internacional",
  ARRIVED: "Chegou no Brasil",
  INSPECTION_APPROVED: "Inspeção Aprovada",
  BALANCE_DUE: "Aguardando Saldo",
  INTERNATIONAL_DISPATCH: "Enviado",
  CUSTOMS: "Na Alfândega",
  NATIONAL_TRANSIT: "Em Trânsito Nacional",
  DISPATCHED: "Saiu para Entrega",
  DELIVERED: "Entregue",
};

const STATUS_COLORS: Record<string, string> = {
  ORDER_CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SOURCING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  NEGOTIATING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  PURCHASE_COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  PACKAGE_EN_ROUTE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ARRIVED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  INSPECTION_APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  BALANCE_DUE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  INTERNATIONAL_DISPATCH: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  CUSTOMS: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  NATIONAL_TRANSIT: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  DISPATCHED: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function OrdersTab({ orders, isLoading, sessionToken }: OrdersTabProps) {
  const [reviewOrder, setReviewOrder] = useState<{ orderId: string; productName: string } | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [selectedOrderPhotos, setSelectedOrderPhotos] = useState<{ photos: string[]; productName: string } | null>(null);

  const formatCurrency = (value: number | null, currency: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Você ainda não tem pedidos registrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order, index) => (
          <motion.div
            key={order.order_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2 bg-gradient-to-r from-card to-card/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{order.order_id}</span>
                    </CardTitle>
                    <CardDescription className="truncate">
                      {order.product_name}
                      {order.product_brand && ` • ${order.product_brand}`}
                      {order.product_model && ` ${order.product_model}`}
                    </CardDescription>
                  </div>
                  <Badge className={`shrink-0 ${STATUS_COLORS[order.current_status] || "bg-muted"}`}>
                    {STATUS_LABELS[order.current_status] || order.current_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {/* Product Details */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {order.product_size && (
                    <div>
                      <span className="text-muted-foreground">Tam:</span>{" "}
                      <span className="font-medium">{order.product_size}</span>
                    </div>
                  )}
                  {order.product_color && (
                    <div>
                      <span className="text-muted-foreground">Cor:</span>{" "}
                      <span className="font-medium">{order.product_color}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Data:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(order.created_at), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                {/* Payment Status */}
                {order.product_price && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-semibold text-primary">
                        {formatCurrency(order.product_price, order.product_currency)}
                      </p>
                    </div>
                    {order.payment_mode === 'split' ? (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Sinal</p>
                          <div className="flex items-center gap-1">
                            {order.sinal_paid ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-yellow-500" />
                            )}
                            <span className="text-xs">{order.sinal_paid ? "Pago" : "Pendente"}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Saldo</p>
                          <div className="flex items-center gap-1">
                            {order.balance_paid ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : order.sinal_paid ? (
                              <Clock className="h-3.5 w-3.5 text-yellow-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                            <span className="text-xs">
                              {order.balance_paid ? "Pago" : order.sinal_paid ? "Pendente" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {order.sinal_paid || order.balance_paid ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-500">Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-500">Pendente</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tracking */}
                {(order.national_tracking || order.international_tracking) && (
                  <div className="flex items-center gap-2 text-sm py-1">
                    <Truck className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Rastreio:</span>
                    <span className="font-mono text-xs truncate">
                      {order.national_tracking || order.international_tracking}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                    <Link to={`/rastreio/${order.order_id}`}>
                      <Truck className="h-3.5 w-3.5 mr-1.5" />
                      Rastrear
                    </Link>
                  </Button>

                  {order.budget_status === "APPROVED" && !order.balance_paid && order.sinal_paid && (
                    <Button size="sm" className="h-8 text-xs" asChild>
                      <Link to={`/pagamento/${order.budget_approval_token}`}>
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                        Pagar Saldo
                      </Link>
                    </Button>
                  )}

                  {order.budget_status === "SENT" && (
                    <Button size="sm" className="h-8 text-xs" asChild>
                      <Link to={`/orcamento/${order.budget_approval_token}`}>
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Ver Orçamento
                      </Link>
                    </Button>
                  )}

                  {order.budget_status === "APPROVED" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf?order_id=${order.order_id}&type=budget`, '_blank')}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      PDF
                    </Button>
                  )}

                  {order.inspection_photos && order.inspection_photos.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => setSelectedOrderPhotos({ 
                        photos: order.inspection_photos!, 
                        productName: order.product_name 
                      })}
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Fotos ({order.inspection_photos.length})
                    </Button>
                  )}

                  {order.current_status === "DELIVERED" && !reviewedOrders.has(order.order_id) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => setReviewOrder({ orderId: order.order_id, productName: order.product_name })}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      Avaliar
                    </Button>
                  )}

                  {reviewedOrders.has(order.order_id) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Avaliado
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewForm
          orderId={reviewOrder.orderId}
          productName={reviewOrder.productName}
          sessionToken={sessionToken}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => setReviewedOrders(prev => new Set([...prev, reviewOrder.orderId]))}
        />
      )}

      {/* Inspection Photos Gallery */}
      {selectedOrderPhotos && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Fotos de Inspeção - {selectedOrderPhotos.productName}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrderPhotos(null)}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <InspectionPhotosGallery 
                photos={selectedOrderPhotos.photos} 
                productName={selectedOrderPhotos.productName}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
