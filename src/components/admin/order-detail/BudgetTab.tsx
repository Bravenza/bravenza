import { FileText, AlertCircle, CheckCircle2, CreditCard, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BudgetActions } from "@/components/admin/BudgetActions";
import { VaultPolicyCard } from "@/components/admin/VaultPolicyCard";
import { formatCurrency, formatDateTime } from "@/lib/constants";
import { generateInstallmentOptions, InstallmentOption } from "@/lib/budget-calculator";
import { Order } from "./types";

interface BudgetTabProps {
  order: Order;
  onUpdate: () => void;
}

export const BudgetTab = ({ order, onUpdate }: BudgetTabProps) => {
  const hasCost = order.product_cost != null && order.product_cost > 0;
  const hasPrice = order.product_price != null && order.product_price > 0;
  const canSendBudget = hasCost && hasPrice;

  // Gerar opções de parcelamento
  const installmentOptions = hasPrice ? generateInstallmentOptions(order.product_price!) : [];

  const getBudgetStatusBadge = () => {
    switch (order.budget_status) {
      case "APPROVED":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            Recusado
          </Badge>
        );
      case "SENT":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Aguardando resposta
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="secondary">
            Expirado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Pendente
          </Badge>
        );
    }
  };

  const formatInstallmentLabel = (option: InstallmentOption) => {
    if (option.installments === 1) {
      return `1x de ${formatCurrency(option.totalWithInterest)} (taxa ${option.interestRate.toFixed(2)}%)`;
    }
    return `${option.installments}x de ${formatCurrency(option.installmentValue)}`;
  };

  return (
    <div className="space-y-6">
      {/* Alerta se não pode enviar orçamento */}
      {!canSendBudget && (
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            <strong>Antes de enviar o orçamento:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {!hasCost && <li>Defina o custo do produto na aba "Custos"</li>}
              {!hasPrice && <li>Defina o preço de venda na aba "Custos"</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Status do Orçamento */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Status do Orçamento
            </span>
            {getBudgetStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumo do orçamento */}
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Valor Total (PIX ou 1x Cartão)</p>
            <p className="font-bold text-xl text-primary">
              {order.product_price ? formatCurrency(order.product_price) : "-"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No cartão, parcele em até 12x com juros
            </p>
          </div>

          {/* Opções de Pagamento */}
          {hasPrice && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Opções de Pagamento para o Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* PIX */}
                  <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">PIX à Vista</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(order.product_price!)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pagamento instantâneo, sem taxas
                    </p>
                  </div>

                  {/* Cartão */}
                  <div className="p-4 bg-secondary/30 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="font-medium">Cartão de Crédito</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Até 12x com juros para o cliente
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {installmentOptions.map((option) => (
                        <div 
                          key={option.installments} 
                          className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0"
                        >
                          <span>{formatInstallmentLabel(option)}</span>
                          {option.installments > 1 && (
                            <span className="text-muted-foreground">
                              Total: {formatCurrency(option.totalWithInterest)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline do orçamento */}
          {(order.budget_sent_at || order.budget_approved_at || order.budget_rejected_at) && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Histórico</p>
              <div className="space-y-2 text-sm">
                {order.budget_sent_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Orçamento enviado em {formatDateTime(order.budget_sent_at)}
                  </div>
                )}
                {order.budget_approved_at && (
                  <div className="flex items-center gap-2 text-success">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Aprovado pelo cliente em {formatDateTime(order.budget_approved_at)}
                  </div>
                )}
                {order.budget_rejected_at && (
                  <div className="flex items-center gap-2 text-destructive">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    Recusado pelo cliente em {formatDateTime(order.budget_rejected_at)}
                  </div>
                )}
                {order.budget_expires_at && order.budget_status === "SENT" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-muted" />
                    Expira em {formatDateTime(order.budget_expires_at)}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações do Orçamento */}
      <BudgetActions
        orderId={order.order_id}
        budgetStatus={order.budget_status}
        budgetSentAt={order.budget_sent_at}
        budgetApprovedAt={order.budget_approved_at}
        budgetRejectedAt={order.budget_rejected_at}
        budgetExpiresAt={order.budget_expires_at}
        budgetApprovalToken={order.budget_approval_token}
        productCost={order.product_cost}
        productPrice={order.product_price}
        clientEmail={order.client_email}
        clientName={order.client_name}
        onUpdate={onUpdate}
      />

      {/* VAULT Policy Card */}
      <VaultPolicyCard />
    </div>
  );
};