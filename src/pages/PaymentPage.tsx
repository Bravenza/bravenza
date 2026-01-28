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
  ArrowRight,
  Gift,
  Percent,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/constants";
import { MAX_CASHBACK_PERCENTAGE } from "@/components/client/CashbackBanner";

interface OrderData {
  order_id: string;
  order_type: string;
  budget_status: string;
  client_name: string;
  client_cpf: string;
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
  payment_mode: 'full' | 'split' | null;
}

interface CashbackData {
  availablePercentage: number;
  maxApplicable: number; // Already capped at 25%
  discountAmount: number;
}

type PaymentType = "full" | "sinal" | "balance";

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    copy_paste: string;
  } | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [installments, setInstallments] = useState<number>(1);
  
  // Cashback state
  const [cashbackData, setCashbackData] = useState<CashbackData | null>(null);
  const [applyCashback, setApplyCashback] = useState(false);
  const [isApplyingCashback, setIsApplyingCashback] = useState(false);

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

        const orderData = data[0] as OrderData;
        setOrder(orderData);

        // Determine which payment to show based on payment_mode
        const isFullPayment = orderData.payment_mode !== 'split';
        
        if (isFullPayment) {
          // Full payment mode: single 100% payment
          if (!orderData.sinal_paid) {
            setPaymentType("full");
          }
        } else {
          // Split payment mode: 50/50
          if (orderData.sinal_paid && !orderData.balance_paid) {
            setPaymentType("balance");
          } else if (!orderData.sinal_paid) {
            setPaymentType("sinal");
          }
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
      // Determine the base amount based on payment type
      let baseAmount: number | null;
      let paymentDescription: string;
      let actualPaymentType: "sinal" | "balance" | "full";

      if (paymentType === "full") {
        baseAmount = order.product_price;
        paymentDescription = "Pagamento Total";
        actualPaymentType = "full";
      } else if (paymentType === "sinal") {
        baseAmount = order.sinal_value;
        paymentDescription = "Sinal (50%)";
        actualPaymentType = "sinal";
      } else {
        baseAmount = order.balance_value;
        paymentDescription = "Saldo (50%)";
        actualPaymentType = "balance";
      }

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

  const handlePayWithCard = async () => {
    if (!order || !token) return;

    // Apply cashback first if enabled
    if (applyCashback && cashbackData) {
      const success = await handleApplyCashbackToOrder();
      if (!success) return;
    }

    setIsProcessingCard(true);

    try {
      // Determine the base amount based on payment type
      let baseAmount: number | null;
      let actualPaymentType: "sinal" | "balance" | "full";

      if (paymentType === "full") {
        baseAmount = order.product_price;
        actualPaymentType = "full";
      } else if (paymentType === "sinal") {
        baseAmount = order.sinal_value;
        actualPaymentType = "sinal";
      } else {
        baseAmount = order.balance_value;
        actualPaymentType = "balance";
      }

      const amount = getPaymentAmount(baseAmount);

      const { data, error } = await supabase.functions.invoke(
        "create-mercadopago-card",
        {
          body: {
            token,
            payment_type: actualPaymentType,
            amount,
            order_id: order.order_id,
            product_name: order.product_name,
            installments,
          },
        }
      );

      if (error) throw error;

      // Redirect to Mercado Pago checkout
      window.location.href = data.checkout_url;
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erro",
        description:
          error.message || "Não foi possível iniciar o pagamento com cartão.",
        variant: "destructive",
      });
      setIsProcessingCard(false);
    }
  };

  // Mercado Pago installment rates (official rates)
  const MERCADO_PAGO_RATES: Record<number, number> = {
    1: 0.0498,   // 4.98%
    2: 0.0964,   // 9.64%
    3: 0.1123,   // 11.23%
    4: 0.1136,   // 11.36%
    5: 0.1431,   // 14.31%
    6: 0.1432,   // 14.32%
    7: 0.1672,   // 16.72%
    8: 0.1673,   // 16.73%
    9: 0.1969,   // 19.69%
    10: 0.2065,  // 20.65%
    11: 0.2066,  // 20.66%
    12: 0.2211,  // 22.11%
  };

  // Calculate installment values with Mercado Pago official rates
  const calculateInstallmentValue = (total: number, numInstallments: number): { installmentValue: number; totalWithInterest: number } => {
    const rate = MERCADO_PAGO_RATES[numInstallments] || 0;
    const totalWithInterest = total * (1 + rate);
    const installmentValue = totalWithInterest / numInstallments;
    return { installmentValue, totalWithInterest };
  };

  const generateInstallmentOptions = (total: number) => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      const { installmentValue, totalWithInterest } = calculateInstallmentValue(total, i);
      options.push({
        value: i,
        label: i === 1 
          ? `1x de ${formatCurrency(totalWithInterest)} (com taxa)`
          : `${i}x de ${formatCurrency(installmentValue)} (Total: ${formatCurrency(totalWithInterest)})`,
      });
    }
    return options;
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

  // All payments complete - check based on payment mode
  const isFullPayment = order.payment_mode !== 'split';
  const isPaymentComplete = isFullPayment 
    ? order.sinal_paid // In full mode, sinal_paid means everything is paid
    : (order.sinal_paid && order.balance_paid); // In split mode, both must be paid

  if (isPaymentComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pagamento Completo!</h1>
            <p className="text-muted-foreground mb-4">
              {isFullPayment 
                ? "O pagamento do seu pedido foi confirmado. Obrigado!"
                : "Todos os pagamentos do seu pedido foram confirmados. Obrigado!"
              }
            </p>
            <Button onClick={() => navigate(`/rastreio/${order.order_id}`)}>
              Acompanhar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate amounts based on payment type
  let baseAmount: number | null;
  let currentLabel: string;

  if (paymentType === "full") {
    baseAmount = order.product_price;
    currentLabel = "Valor Total";
  } else if (paymentType === "sinal") {
    baseAmount = order.sinal_value;
    currentLabel = "Sinal (50%)";
  } else {
    baseAmount = order.balance_value;
    currentLabel = "Saldo (50%)";
  }

  const finalAmount = getPaymentAmount(baseAmount);
  
  // Generate installment options based on the amount being paid
  const installmentBaseAmount = paymentType === "full" 
    ? getPaymentAmount(order.product_price)
    : getPaymentAmount(order.balance_value);
  const installmentOptions = installmentBaseAmount > 0 
    ? generateInstallmentOptions(installmentBaseAmount) 
    : [];

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

          {/* Payment status - Different UI based on payment mode */}
          {isFullPayment ? (
            // Full payment mode: single card showing total
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
          ) : (
            // Split payment mode: two cards for sinal and balance
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card
                className={`cursor-pointer transition-all ${
                  paymentType === "sinal"
                    ? "ring-2 ring-primary"
                    : order.sinal_paid
                      ? "opacity-60"
                      : ""
                }`}
                onClick={() => !order.sinal_paid && setPaymentType("sinal")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sinal (50%)</p>
                      <p className="text-xl font-bold">
                        {order.sinal_value
                          ? formatCurrency(order.sinal_value)
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pix ou Cartão até 12x
                      </p>
                    </div>
                    {order.sinal_paid ? (
                      <Badge className="bg-success/20 text-success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  paymentType === "balance"
                    ? "ring-2 ring-primary"
                    : order.balance_paid || !order.sinal_paid
                      ? "opacity-60"
                      : ""
                }`}
                onClick={() =>
                  order.sinal_paid &&
                  !order.balance_paid &&
                  setPaymentType("balance")
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo (50%)</p>
                      <p className="text-xl font-bold">
                        {order.balance_value
                          ? formatCurrency(order.balance_value)
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pix ou Cartão até 12x
                      </p>
                    </div>
                    {order.balance_paid ? (
                      <Badge className="bg-success/20 text-success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : !order.sinal_paid ? (
                      <Badge variant="secondary">Aguardando sinal</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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

                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-primary">
                          💡 Após o pagamento, a confirmação é automática e você
                          receberá uma notificação.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="card" className="space-y-6">
                  <div className="text-center py-4">
                    <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Pague com cartão de crédito em até 12x via Mercado Pago.
                    </p>
                    
                    {/* Interest warning */}
                    <div className="max-w-sm mx-auto mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-400">
                        ⚠️ <strong>Atenção:</strong> O parcelamento no cartão de crédito possui juros da operadora de pagamento.
                      </p>
                    </div>

                    {/* Installments selector */}
                    <div className="max-w-sm mx-auto mb-6">
                      <label className="text-sm font-medium mb-2 block text-left">
                        Parcelamento
                      </label>
                      <Select 
                        value={installments.toString()} 
                        onValueChange={(value) => setInstallments(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o parcelamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {installmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {installments > 1 && (
                        <p className="text-xs text-muted-foreground mt-2 text-left">
                          * Juros de responsabilidade do cliente
                        </p>
                      )}
                    </div>

                    <Button 
                      className="btn-gold" 
                      onClick={handlePayWithCard}
                      disabled={isProcessingCard}
                    >
                      {isProcessingCard ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-4 w-4" />
                      )}
                      Pagar com Cartão
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <img 
                        src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadopago/logo_large_25px.png" 
                        alt="Mercado Pago" 
                        className="h-5"
                      />
                      <span>Pagamento seguro</span>
                    </div>
                  </div>
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
        </motion.div>
      </main>
    </div>
  );
}
