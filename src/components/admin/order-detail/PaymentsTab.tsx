import { CreditCard, CheckCircle2, Clock, Settings2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/constants";
import { Order, HistoryItem, PaymentMode } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PaymentsTabProps {
  order: Order;
  history: HistoryItem[];
  onOrderUpdate?: () => void;
}

export const PaymentsTab = ({ order, history, onOrderUpdate }: PaymentsTabProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(order.payment_mode || 'full');

  const handlePaymentModeChange = async (newMode: PaymentMode) => {
    setPaymentMode(newMode);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_mode: newMode })
        .eq("order_id", order.order_id);

      if (error) throw error;

      toast({
        title: "Modo de pagamento atualizado",
        description: newMode === 'full' 
          ? "Cliente pagará 100% do valor de uma vez."
          : "Cliente pagará 50% de sinal + 50% de saldo.",
      });

      onOrderUpdate?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o modo de pagamento.",
        variant: "destructive",
      });
      setPaymentMode(order.payment_mode || 'full');
    } finally {
      setIsSaving(false);
    }
  };
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
      {/* Payment Mode Configuration */}
      <Card className="card-premium border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Modo de Pagamento
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={paymentMode} 
            onValueChange={(value) => handlePaymentModeChange(value as PaymentMode)}
            className="grid md:grid-cols-2 gap-4"
            disabled={isSaving || order.sinal_paid || order.balance_paid}
          >
            <Label
              htmlFor="mode-full"
              className={`flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMode === 'full' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              } ${(order.sinal_paid || order.balance_paid) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full" id="mode-full" />
                <span className="font-semibold">100% à Vista</span>
                <Badge variant="secondary" className="ml-auto">Padrão</Badge>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                Cliente paga o valor total de uma vez. Aceita Pix ou Cartão de Crédito em até 12x.
              </p>
            </Label>

            <Label
              htmlFor="mode-split"
              className={`flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMode === 'split' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              } ${(order.sinal_paid || order.balance_paid) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="split" id="mode-split" />
                <span className="font-semibold">50/50 Parcelado</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                Cliente paga 50% de sinal agora e 50% de saldo após chegada. Ambos podem ser Pix ou Cartão.
              </p>
            </Label>
          </RadioGroup>

          {(order.sinal_paid || order.balance_paid) && (
            <p className="text-xs text-muted-foreground mt-3">
              ⚠️ O modo de pagamento não pode ser alterado após o início dos pagamentos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resumo - apenas para modo split */}
      {paymentMode === 'split' && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-primary">
            💡 Sinal = 50% do valor total (pago na aprovação) | Saldo = 50% restante (pago na chegada do produto)
          </p>
        </div>
      )}

      {/* Status dos Pagamentos - condicional baseado no modo */}
      {paymentMode === 'full' ? (
        // Modo 100% - único card de pagamento total
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pagamento Total (100%)
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
                {order.product_price ? formatCurrency(order.product_price) : "-"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Pix ou Cartão de Crédito até 12x
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
                {order.updated_at && (
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
      ) : (
        // Modo 50/50 - dois cards separados
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
      )}

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
              {paymentMode === 'full' ? (
                // Modo 100%: verificar apenas sinal_paid
                order.sinal_paid ? (
                  <Badge className="bg-success text-success-foreground text-lg px-4 py-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Pago Integralmente
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    Aguardando Pagamento
                  </Badge>
                )
              ) : (
                // Modo 50/50: verificar sinal e saldo
                order.sinal_paid && order.balance_paid ? (
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
                )
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
