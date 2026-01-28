import { FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BudgetActions } from "@/components/admin/BudgetActions";
import { VaultPolicyCard } from "@/components/admin/VaultPolicyCard";
import { formatCurrency, formatDateTime } from "@/lib/constants";
import { Order } from "./types";

interface BudgetTabProps {
  order: Order;
  onUpdate: () => void;
}

export const BudgetTab = ({ order, onUpdate }: BudgetTabProps) => {
  const hasCost = order.product_cost != null && order.product_cost > 0;
  const hasPrice = order.product_price != null && order.product_price > 0;
  const canSendBudget = hasCost && hasPrice;

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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-bold text-xl text-primary">
                {order.product_price ? formatCurrency(order.product_price) : "-"}
              </p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Sinal (50%)</p>
              <p className="font-semibold text-lg">
                {order.sinal_value ? formatCurrency(order.sinal_value) : "-"}
              </p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo (50%)</p>
              <p className="font-semibold text-lg">
                {order.balance_value ? formatCurrency(order.balance_value) : "-"}
              </p>
            </div>
          </div>

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
        orderType={order.order_type}
        budgetStatus={order.budget_status}
        budgetSentAt={order.budget_sent_at}
        budgetApprovedAt={order.budget_approved_at}
        budgetRejectedAt={order.budget_rejected_at}
        budgetExpiresAt={order.budget_expires_at}
        budgetApprovalToken={order.budget_approval_token}
        productCost={order.product_cost}
        productPrice={order.product_price}
        sinalValue={order.sinal_value}
        balanceValue={order.balance_value}
        clientEmail={order.client_email}
        clientName={order.client_name}
        onUpdate={onUpdate}
      />

      {/* VAULT Policy Card */}
      {order.order_type === "VAULT" && <VaultPolicyCard />}
    </div>
  );
};
