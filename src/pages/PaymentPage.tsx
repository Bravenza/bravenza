import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Package,
  AlertCircle,
  QrCode,
  Copy,
  CreditCard,
  Gift,
  Percent,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/constants";
import { MAX_CASHBACK_PERCENTAGE } from "@/components/client/CashbackBanner";
import { UnifiedCardForm, tokenizeCard } from "@/components/payment/UnifiedCardForm";
import { MERCADO_PAGO_RATES, calculateCardTotal } from "@/lib/budget-calculator";
import { ServiceContract } from "@/components/payment/ServiceContract";

interface OrderData {
  order_id: string;
  order_type: string;
  budget_status: string;
  client_name: string;
  client_cpf: string;
  client_address: string | null;
  product_name: string;
  product_brand: string | null;
  product_model: string | null;
  product_size: string | null;
  product_color: string | null;
  product_price: number | null;
  product_currency: string | null;
  sinal_paid: boolean;
  budget_expires_at: string | null;
  created_at: string;
  contract_accepted_at: string | null;
}

interface CashbackData {
  availablePercentage: number;
  maxApplicable: number; // Already capped at 25%
  discountAmount: number;
}

type PaymentType = "full";

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    copy_paste: string;
  } | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  
  // Cashback state
  const [cashbackData, setCashbackData] = useState<CashbackData | null>(null);
  const [applyCashback, setApplyCashback] = useState(false);
  const [isApplyingCashback, setIsApplyingCashback] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [isAcceptingContract, setIsAcceptingContract] = useState(false);

  // Handle payment result from URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const pending = searchParams.get("pending");

    if (success === "true") {
      toast({
        title: "Pagamento realizado!",
        description: "Seu pagamento foi processado com sucesso.",
      });
    } else if (error === "true") {
      toast({
        title: "Erro no pagamento",
        description: "Houve um problema ao processar seu pagamento. Tente novamente.",
        variant: "destructive",
      });
    } else if (pending === "true") {
      toast({
        title: "Pagamento pendente",
        description: "Seu pagamento está sendo processado e será confirmado em breve.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase.rpc("get_order_by_token", {
          p_token: token,
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          navigate("/");
          return;
        }

        const orderData = data[0] as unknown as OrderData;
        setOrder(orderData);
        
        // Check if contract was already accepted
        if (orderData.contract_accepted_at) {
          setContractAccepted(true);
        }

        // Always full payment mode
        if (!orderData.sinal_paid) {
          setPaymentType("full");
        }

        // Fetch available cashback for this client
        if (orderData.client_cpf) {
          fetchCashback(orderData.client_cpf, orderData.product_price);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [token, navigate]);

  // Fetch cashback data for the client
  const fetchCashback = async (cpf: string, orderTotal: number | null) => {
    if (!orderTotal) return;

    try {
      const { data, error } = await supabase.rpc("get_client_available_cashback", {
        p_cpf: cpf.replace(/\D/g, ""),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const totalAvailable = Number(data[0].total_percentage) || 0;
        // Cap at MAX_CASHBACK_PERCENTAGE (25%)
        const maxApplicable = Math.min(totalAvailable, MAX_CASHBACK_PERCENTAGE);
        // Calculate discount amount based on order total
        const discountAmount = (orderTotal * maxApplicable) / 100;

        if (maxApplicable > 0) {
          setCashbackData({
            availablePercentage: totalAvailable,
            maxApplicable,
            discountAmount,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching cashback:", err);
    }
  };

  // Calculate the actual amount to pay considering cashback
  const getPaymentAmount = (baseAmount: number | null): number => {
    if (!baseAmount) return 0;
    if (applyCashback && cashbackData) {
      return Math.max(0, baseAmount - cashbackData.discountAmount);
    }
    return baseAmount;
  };

  // Apply cashback to order before payment
  const handleApplyCashbackToOrder = async (): Promise<boolean> => {
    if (!applyCashback || !cashbackData || !order) return true;

    setIsApplyingCashback(true);
    try {
      const { error } = await supabase.rpc("apply_cashback_to_order", {
        p_cpf: order.client_cpf.replace(/\D/g, ""),
        p_order_id: order.order_id,
        p_discount_amount: cashbackData.maxApplicable,
        p_payment_type: paymentType,
      });

      if (error) throw error;
      
      // Clear cashback data after successful application
      setCashbackData(null);
      setApplyCashback(false);
      
      toast({
        title: "Cashback aplicado!",
        description: `Desconto de ${formatCurrency(cashbackData.discountAmount)} aplicado ao pagamento.`,
      });
      
      return true;
    } catch (err: any) {
      console.error("Error applying cashback:", err);
      toast({
        title: "Erro ao aplicar cashback",
        description: err.message || "Não foi possível aplicar o desconto.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsApplyingCashback(false);
    }
  };

  const handleGeneratePix = async () => {
    if (!order || !token) return;

    // Apply cashback first if enabled
    if (applyCashback && cashbackData) {
      const success = await handleApplyCashbackToOrder();
      if (!success) return;
    }

    setIsGeneratingPix(true);

    try {
      const baseAmount = order.product_price;
      const paymentDescription = "Pagamento Total";
      const actualPaymentType: "full" = "full";

      const amount = getPaymentAmount(baseAmount);

      const { data, error } = await supabase.functions.invoke("generate-pix", {
        body: {
          token,
          payment_type: actualPaymentType,
          amount,
          description: `${paymentDescription} - ${order.order_id}${applyCashback ? " (com cashback)" : ""}`,
        },
      });

      if (error) throw error;

      setPixData({
        qr_code: data.qr_code,
        copy_paste: data.copy_paste,
      });
    } catch (error: any) {
      console.error("Error generating Pix:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o Pix.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.copy_paste) return;

    navigator.clipboard.writeText(pixData.copy_paste);
    toast({
      title: "Copiado!",
      description: "Código Pix copiado para a área de transferência.",
    });
  };

  // Handle successful card payment
  const handleCardPaymentSuccess = () => {
    navigate(`/confirmacao/${token}?method=card`);
  };

  // Handle card payment error
  const handleCardPaymentError = (error: string) => {
    console.error("Card payment error:", error);
  };

  // Poll for PIX payment status
  useEffect(() => {
    if (!pixData || !token || !order) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.rpc("get_order_by_token", { p_token: token });
        const orderData = data as any;
        if (orderData?.[0]?.sinal_paid) {
          clearInterval(interval);
          navigate(`/confirmacao/${token}?method=pix`);
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, token, order, navigate]);

  // Handle contract acceptance
  const handleContractAccept = async () => {
    if (!order || !token) return;
    setIsAcceptingContract(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ contract_accepted_at: new Date().toISOString() })
        .eq("order_id", order.order_id);
      
      if (error) throw error;
      
      setContractAccepted(true);
      setOrder({ ...order, contract_accepted_at: new Date().toISOString() });
      toast({
        title: "Contrato assinado!",
        description: "Agora você pode prosseguir com o pagamento.",
      });
    } catch (err: any) {
      console.error("Error accepting contract:", err);
      toast({
        title: "Erro ao assinar contrato",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAcceptingContract(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
            <p className="text-muted-foreground">
              Não foi possível encontrar as informações do seu pedido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment complete check
  if (order.sinal_paid) {
    // Redirect to confirmation page
    navigate(`/confirmacao/${token}?method=pix`, { replace: true });
    return null;
  }

  const baseAmount = order.product_price;
  const currentLabel = "Valor Total";

  const finalAmount = getPaymentAmount(baseAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-center">
          <Logo />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Pagamento</h1>
            <p className="text-muted-foreground">
              Pedido <span className="font-medium">{order.order_id}</span>
            </p>
          </div>

          {/* Contract step - show before payment if not yet accepted */}
          {!contractAccepted && (
            <>
              <ServiceContract
                clientName={order.client_name}
                clientCpf={order.client_cpf}
                clientAddress={order.client_address}
                serviceValue={order.product_price}
                onAccept={handleContractAccept}
                isSubmitting={isAcceptingContract}
              />
            </>
          )}

          {/* Payment UI - only show after contract is accepted */}
          {contractAccepted && (
          <>
          {/* Payment status card */}
          <Card className="mb-8 ring-2 ring-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {order.product_price
                      ? formatCurrency(order.product_price)
                      : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pix ou Cartão de Crédito até 12x
                  </p>
                </div>
                {order.sinal_paid ? (
                  <Badge className="bg-success/20 text-success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pago
                  </Badge>
                ) : (
                  <Badge variant="outline">A pagar</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cashback Section */}
          {cashbackData && cashbackData.maxApplicable > 0 && !pixData && (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      Você tem cashback disponível!
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {cashbackData.maxApplicable}%
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cashbackData.availablePercentage > MAX_CASHBACK_PERCENTAGE 
                        ? `Você possui ${cashbackData.availablePercentage}% acumulados, mas o máximo aplicável por pedido é ${MAX_CASHBACK_PERCENTAGE}%.`
                        : `Aplique seu cashback e economize ${formatCurrency(cashbackData.discountAmount)} neste pagamento.`
                      }
                    </p>
                    
                    <div className="flex items-center justify-between mt-4 p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="apply-cashback"
                          checked={applyCashback}
                          onCheckedChange={setApplyCashback}
                        />
                        <Label htmlFor="apply-cashback" className="cursor-pointer">
                          Aplicar cashback de {formatCurrency(cashbackData.discountAmount)}
                        </Label>
                      </div>
                      {applyCashback && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Valor com desconto:</p>
                          <p className="font-bold text-primary">{formatCurrency(finalAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment methods */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex flex-col gap-1">
                <span>
                  Pagar {currentLabel}:{" "}
                  {applyCashback && cashbackData ? (
                    <>
                      <span className="text-muted-foreground line-through mr-2">
                        {baseAmount ? formatCurrency(baseAmount) : "-"}
                      </span>
                      <span className="text-primary">
                        {formatCurrency(finalAmount)}
                      </span>
                    </>
                  ) : (
                    <span className="text-primary">
                      {baseAmount ? formatCurrency(baseAmount) : "-"}
                    </span>
                  )}
                </span>
                {applyCashback && cashbackData && (
                  <span className="text-sm font-normal text-success flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Cashback de {formatCurrency(cashbackData.discountAmount)} será aplicado
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="pix"
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="pix" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Pix
                  </TabsTrigger>
                  <TabsTrigger
                    value="card"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Cartão 12x
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pix" className="space-y-6">
                  {!pixData ? (
                    <div className="text-center py-8">
                      <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Clique no botão abaixo para gerar o QR Code Pix.
                      </p>
                      <Button
                        className="btn-gold"
                        onClick={handleGeneratePix}
                        disabled={isGeneratingPix}
                      >
                        {isGeneratingPix ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="mr-2 h-4 w-4" />
                        )}
                        Gerar QR Code Pix
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-lg">
                          <img
                            src={pixData.qr_code}
                            alt="QR Code Pix"
                            className="w-48 h-48"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground text-center">
                          Ou copie o código Pix:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pixData.copy_paste}
                            className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono truncate"
                          />
                          <Button variant="outline" onClick={handleCopyPix}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <p className="text-sm text-primary font-medium">
                            Aguardando pagamento...
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          A confirmação é automática. Você será redirecionado assim que o pagamento for detectado.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="card" className="space-y-6">
                  {token && order && (
                    <UnifiedCardForm
                      amount={finalAmount}
                      email=""
                      interestRates={MERCADO_PAGO_RATES}
                      onSubmit={async (cardToken, cardData) => {
                        const { data, error } = await supabase.functions.invoke("process-card-payment", {
                          body: {
                            token,
                            card_token: cardToken,
                            payment_type: "full",
                            amount: calculateCardTotal(finalAmount, cardData.installments),
                            order_id: order.order_id,
                            product_name: order.product_name,
                            installments: cardData.installments,
                            payer_email: cardData.email,
                            payer_identification: {
                              type: "CPF",
                              number: cardData.identificationNumber.replace(/\D/g, ""),
                            },
                          },
                        });
                        if (error) throw error;
                        if (data.status === "approved" || data.status === "pending" || data.status === "in_process") {
                          handleCardPaymentSuccess();
                        } else {
                          throw new Error(data.status_detail || "Pagamento não aprovado");
                        }
                      }}
                      submitLabel={`Pagar ${formatCurrency(finalAmount)}`}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Product summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{order.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[order.product_brand, order.product_model, order.product_size]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
                <p className="font-bold text-primary">
                  {order.product_price
                    ? formatCurrency(order.product_price)
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
