import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/constants";
import { Order, HistoryItem } from "./types";

interface PaymentsTabProps {
  order: Order;
  history: HistoryItem[];
}

export const PaymentsTab = ({ order, history }: PaymentsTabProps) => {
  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case "PIX":
        return "Pix";
      case "CREDIT_CARD":
        return "Cartão de Crédito";
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-sm text-primary">
          💡 Sinal = 50% do valor total (pago na aprovação) | Saldo = 50% restante (pago na chegada do produto)
        </p>
      </div>

      {/* Status dos Pagamentos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sinal */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Sinal (50%)
              </span>
              {order.sinal_paid ? (
                <Badge className="bg-success/20 text-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Pago
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-primary">
                {order.sinal_value ? formatCurrency(order.sinal_value) : "-"}
              </p>
            </div>
            
            {order.sinal_paid && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-medium">
                    {getPaymentMethodLabel(order.sinal_payment_method)}
                  </span>
                </div>
                {order.sinal_paid && order.updated_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {formatDateTime(order.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Saldo (50%)
              </span>
              {order.balance_paid ? (
                <Badge className="bg-success/20 text-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Pago
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-primary">
                {order.balance_value ? formatCurrency(order.balance_value) : "-"}
              </p>
            </div>
            
            {order.balance_paid && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-medium">
                    {getPaymentMethodLabel(order.balance_payment_method)}
                  </span>
                </div>
              </div>
            )}

            {!order.balance_paid && order.balance_due_date && (
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning">
                  ⏰ Vencimento: {formatDateTime(order.balance_due_date)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total */}
      <Card className="card-premium-gold">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total do Pedido</p>
              <p className="text-3xl font-bold text-primary">
                {order.product_price ? formatCurrency(order.product_price) : "-"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status Geral</p>
              {order.sinal_paid && order.balance_paid ? (
                <Badge className="bg-success text-success-foreground text-lg px-4 py-1">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Pago Integralmente
                </Badge>
              ) : order.sinal_paid ? (
                <Badge className="bg-primary/20 text-primary text-lg px-4 py-1">
                  Aguardando Saldo
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  Aguardando Pagamento
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Histórico do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum histórico registrado.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="relative pl-4 pb-4 border-l border-border last:pb-0"
                >
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary" />
                  <p className="font-medium text-sm">
                    {ORDER_STATUS_LABELS[item.status] || item.status}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
