import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Package, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { VaultPolicyCard } from "@/components/admin/VaultPolicyCard";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface OrderData {
  order_id: string;
  order_type: string;
  budget_status: string;
  client_name: string;
  product_name: string;
  product_brand: string | null;
  product_model: string | null;
  product_size: string | null;
  product_color: string | null;
  product_price: number | null;
  product_currency: string | null;
  sinal_value: number | null;
  sinal_paid: boolean;
  balance_value: number | null;
  balance_paid: boolean;
  budget_expires_at: string | null;
  created_at: string;
}

export default function BudgetApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "expired" | "error">("pending");
  const [acceptedRefundPolicy, setAcceptedRefundPolicy] = useState(false);
  const [acceptedWarrantyPolicy, setAcceptedWarrantyPolicy] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase.rpc("get_order_by_token", {
          p_token: token,
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          setStatus("error");
          return;
        }

        const orderData = data[0] as OrderData;
        setOrder(orderData);

        if (orderData.budget_status === "APPROVED") {
          setStatus("approved");
        } else if (orderData.budget_status === "REJECTED") {
          setStatus("rejected");
        } else if (orderData.budget_status === "EXPIRED") {
          setStatus("expired");
        } else if (
          orderData.budget_expires_at &&
          new Date(orderData.budget_expires_at) < new Date()
        ) {
          setStatus("expired");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [token]);

  const handleApprove = async () => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("approve_budget", {
        p_token: token,
      });

      if (error) throw error;

      setStatus("approved");
      toast({
        title: "Orçamento aprovado!",
        description: "Você será redirecionado para o pagamento do sinal.",
      });

      // Redirect to payment page
      setTimeout(() => {
        navigate(`/pagamento/${token}`);
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível aprovar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("reject_budget", {
        p_token: token,
        p_reason: rejectReason || null,
      });

      if (error) throw error;

      setStatus("rejected");
      setShowRejectDialog(false);
      toast({
        title: "Orçamento recusado",
        description: "Agradecemos seu interesse. Esperamos atendê-lo em breve!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível recusar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
            <p className="text-muted-foreground">
              Este link de orçamento não é válido ou já expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <Clock className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Orçamento Expirado</h1>
            <p className="text-muted-foreground">
              O prazo para aprovação deste orçamento expirou. Entre em contato
              conosco para um novo orçamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Orçamento Aprovado!</h1>
            <p className="text-muted-foreground mb-4">
              Seu pedido foi confirmado. Você será redirecionado para o pagamento.
            </p>
            <Button onClick={() => navigate(`/pagamento/${token}`)}>
              Ir para Pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Orçamento Recusado</h1>
            <p className="text-muted-foreground">
              Você recusou este orçamento. Agradecemos seu interesse e esperamos
              atendê-lo em breve!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresAt = order.budget_expires_at
    ? new Date(order.budget_expires_at)
    : null;
  const isExpiringSoon =
    expiresAt && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex justify-center">
          <Logo />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Seu Orçamento</h1>
            <p className="text-muted-foreground">
              Olá, <span className="font-medium">{order.client_name}</span>!
              Confira os detalhes do seu pedido.
            </p>
          </div>

          {/* Expiration warning */}
          {isExpiringSoon && expiresAt && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning flex-shrink-0" />
              <p className="text-sm">
                Este orçamento expira em{" "}
                <strong>{formatDate(expiresAt)}</strong>. Aprove antes do prazo!
              </p>
            </div>
          )}

          {/* Order details */}
          <Card className="card-premium mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Detalhes do Produto
                </CardTitle>
                <Badge variant="outline">{order.order_id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{order.product_name}</p>
                </div>
                {order.product_brand && (
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{order.product_brand}</p>
                  </div>
                )}
                {order.product_model && (
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{order.product_model}</p>
                  </div>
                )}
                {order.product_size && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tamanho</p>
                    <p className="font-medium">{order.product_size}</p>
                  </div>
                )}
                {order.product_color && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cor</p>
                    <p className="font-medium">{order.product_color}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="card-premium-gold mb-8">
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="text-2xl font-bold text-primary">
                  {order.product_price
                    ? formatCurrency(order.product_price, order.product_currency || "BRL")
                    : "-"}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Sinal (50%) - Pagamento imediato via Pix
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {order.sinal_value
                      ? formatCurrency(order.sinal_value, order.product_currency || "BRL")
                      : "-"}
                  </p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Saldo (50%) - Na chegada do produto ao Brasil
                  </p>
                  <p className="text-xl font-bold">
                    {order.balance_value
                      ? formatCurrency(order.balance_value, order.product_currency || "BRL")
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Non-refundable Deposit Policy */}
          <Card className="border-destructive/30 bg-destructive/5 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Política de Sinal (Depósito)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O valor do <strong>sinal (50%)</strong> é uma garantia de reserva do produto e{" "}
                <strong className="text-destructive">não é reembolsável</strong> após o pagamento.
              </p>
              <p className="text-sm text-muted-foreground">
                Caso o cliente desista da compra durante o processo, o valor do sinal ficará retido 
                como <strong>multa contratual</strong> para cobrir os custos operacionais já realizados 
                (busca, negociação, reserva do produto).
              </p>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground italic">
                  Esta política se aplica a todos os tipos de pedido (VAULT e READY).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* VAULT Policy Card */}
          {order.order_type === "VAULT" && (
            <div className="mb-6">
              <VaultPolicyCard />
            </div>
          )}

          {/* Terms Acceptance */}
          <Card className="card-premium mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="refund-policy"
                  checked={acceptedRefundPolicy}
                  onCheckedChange={(checked) => setAcceptedRefundPolicy(checked === true)}
                />
                <label
                  htmlFor="refund-policy"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Li e concordo que o <strong>sinal (50%) não é reembolsável</strong> após o pagamento, 
                  ficando retido como multa em caso de desistência.
                </label>
              </div>

              {order.order_type === "VAULT" && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="warranty-policy"
                    checked={acceptedWarrantyPolicy}
                    onCheckedChange={(checked) => setAcceptedWarrantyPolicy(checked === true)}
                  />
                  <label
                    htmlFor="warranty-policy"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    Li e concordo com a <strong>Política de Trocas e Garantia VAULT</strong>: 
                    troca/reembolso somente por defeito, tamanho não é trocável, prazo de 7 dias para suporte.
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="btn-gold text-lg px-8"
              onClick={handleApprove}
              disabled={isSubmitting || !acceptedRefundPolicy || (order.order_type === "VAULT" && !acceptedWarrantyPolicy)}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Aprovar Orçamento
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={isSubmitting}
            >
              <XCircle className="mr-2 h-5 w-5" />
              Recusar
            </Button>
          </div>

          {!acceptedRefundPolicy || (order.order_type === "VAULT" && !acceptedWarrantyPolicy) ? (
            <p className="text-center text-sm text-amber-500 mt-4">
              Você precisa aceitar os termos acima para aprovar o orçamento.
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Ao aprovar, você será direcionado para efetuar o pagamento do sinal via Pix.
            </p>
          )}
        </motion.div>
      </main>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Orçamento</DialogTitle>
            <DialogDescription>
              Você pode nos informar o motivo da recusa para que possamos melhorar
              nossos serviços.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                placeholder="Ex: Valor acima do esperado, encontrei em outro lugar, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
