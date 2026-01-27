import { useState } from "react";
import { Send, Copy, Check, Loader2, Mail, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Use the published URL for client-facing links (not preview URL)
const PUBLIC_URL = "https://bravenza.com.br";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/constants";

interface BudgetActionsProps {
  orderId: string;
  orderType: string;
  budgetStatus: string | null;
  budgetSentAt: string | null;
  budgetApprovedAt: string | null;
  budgetRejectedAt: string | null;
  budgetExpiresAt: string | null;
  budgetApprovalToken: string | null;
  productPrice: number | null;
  sinalValue: number | null;
  balanceValue: number | null;
  clientEmail: string | null;
  clientName: string;
  onUpdate: () => void;
}

export function BudgetActions({
  orderId,
  orderType,
  budgetStatus,
  budgetSentAt,
  budgetApprovedAt,
  budgetRejectedAt,
  budgetExpiresAt,
  budgetApprovalToken,
  productPrice,
  sinalValue,
  balanceValue,
  clientEmail,
  clientName,
  onUpdate,
}: BudgetActionsProps) {
  const { toast } = useToast();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expirationDays, setExpirationDays] = useState("3");

  const approvalLink = budgetApprovalToken
    ? `${PUBLIC_URL}/orcamento/${budgetApprovalToken}`
    : null;

  const handleCopyLink = () => {
    if (!approvalLink) return;

    navigator.clipboard.writeText(approvalLink);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link de aprovação foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendBudget = async () => {
    if (!productPrice || !sinalValue) {
      toast({
        title: "Erro",
        description: "Defina o valor do produto e do sinal antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

      // Update order with budget info
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          budget_status: "SENT",
          budget_sent_at: new Date().toISOString(),
          budget_expires_at: expiresAt.toISOString(),
        })
        .eq("order_id", orderId);

      if (updateError) throw updateError;

      // Send email if client has email
      if (clientEmail) {
        const { error: emailError } = await supabase.functions.invoke(
          "send-budget-email",
          {
            body: {
              order_id: orderId,
              client_name: clientName,
              client_email: clientEmail,
              product_price: productPrice,
              sinal_value: sinalValue,
              balance_value: balanceValue,
              approval_link: approvalLink,
              expires_at: expiresAt.toISOString(),
            },
          }
        );

        if (emailError) {
          console.error("Error sending email:", emailError);
          // Don't throw, email is optional
        }
      }

      toast({
        title: "Orçamento enviado!",
        description: clientEmail
          ? "Email enviado e link disponível para compartilhar."
          : "Link disponível para compartilhar manualmente.",
      });

      setShowSendDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = () => {
    switch (budgetStatus) {
      case "PENDING":
        return <Badge variant="outline">Pendente</Badge>;
      case "SENT":
        return <Badge variant="secondary">Enviado</Badge>;
      case "APPROVED":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            Aprovado
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Recusado</Badge>;
      case "EXPIRED":
        return <Badge variant="secondary">Expirado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Orçamento
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="font-bold text-primary">
              {productPrice ? formatCurrency(productPrice) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sinal (50%)</p>
            <p className="font-medium">
              {sinalValue ? formatCurrency(sinalValue) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo (50%)</p>
            <p className="font-medium">
              {balanceValue ? formatCurrency(balanceValue) : "-"}
            </p>
          </div>
        </div>

        {/* Timeline */}
        {budgetSentAt && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Enviado em: <span className="text-foreground">{formatDateTime(budgetSentAt)}</span>
            </p>
          </div>
        )}
        {budgetApprovedAt && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Aprovado em:{" "}
              <span className="text-success">{formatDateTime(budgetApprovedAt)}</span>
            </p>
          </div>
        )}
        {budgetRejectedAt && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Recusado em:{" "}
              <span className="text-destructive">{formatDateTime(budgetRejectedAt)}</span>
            </p>
          </div>
        )}
        {budgetExpiresAt && budgetStatus === "SENT" && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Expira em:{" "}
              <span className="text-warning">{formatDateTime(budgetExpiresAt)}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {(budgetStatus === "PENDING" || budgetStatus === "REJECTED" || budgetStatus === "EXPIRED") && (
            <Button
              className="btn-gold w-full"
              onClick={() => setShowSendDialog(true)}
              disabled={!productPrice}
            >
              <Send className="mr-2 h-4 w-4" />
              {budgetStatus === "REJECTED" || budgetStatus === "EXPIRED" 
                ? "Reenviar Orçamento" 
                : "Enviar Orçamento"}
            </Button>
          )}

          {budgetStatus === "REJECTED" && (
            <p className="text-xs text-muted-foreground text-center">
              O cliente recusou. Você pode editar o valor e reenviar.
            </p>
          )}

          {budgetStatus === "EXPIRED" && (
            <p className="text-xs text-muted-foreground text-center">
              O orçamento expirou. Envie um novo.
            </p>
          )}

          {approvalLink && budgetStatus !== "PENDING" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={approvalLink}
                  className="text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href={approvalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visualizar Página
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Orçamento</DialogTitle>
            <DialogDescription>
              O cliente receberá um link para aprovar ou recusar o orçamento.
              {clientEmail
                ? " Um email será enviado automaticamente."
                : " Sem email cadastrado, você precisará enviar o link manualmente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-primary">
                    {productPrice ? formatCurrency(productPrice) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sinal (50%)</p>
                  <p className="font-medium">
                    {sinalValue ? formatCurrency(sinalValue) : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Validade do orçamento (dias)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Após esse período, o link expira automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="btn-gold"
              onClick={handleSendBudget}
              disabled={isSending || !productPrice}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
