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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/constants";

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

type PaymentType = "sinal" | "balance";

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
  const [paymentType, setPaymentType] = useState<PaymentType>("sinal");
  const [installments, setInstallments] = useState<number>(1);

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

        // Determine which payment to show
        if (orderData.sinal_paid && !orderData.balance_paid) {
          setPaymentType("balance");
        } else if (!orderData.sinal_paid) {
          setPaymentType("sinal");
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

  const handleGeneratePix = async () => {
    if (!order || !token) return;

    setIsGeneratingPix(true);

    try {
      const amount =
        paymentType === "sinal" ? order.sinal_value : order.balance_value;

      const { data, error } = await supabase.functions.invoke("generate-pix", {
        body: {
          token,
          payment_type: paymentType,
          amount,
          description: `${paymentType === "sinal" ? "Sinal" : "Saldo"} - ${order.order_id}`,
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

    setIsProcessingCard(true);

    try {
      const amount = order.balance_value; // Only balance can be paid with card

      const { data, error } = await supabase.functions.invoke(
        "create-mercadopago-card",
        {
          body: {
            token,
            payment_type: "balance",
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

  // Calculate installment values with interest (Mercado Pago rates approximation)
  const calculateInstallmentValue = (total: number, numInstallments: number): number => {
    if (numInstallments === 1) return total;
    // Approximate 3.79% per month interest (Mercado Pago typical rate)
    const monthlyRate = 0.0379;
    const installmentValue = (total * monthlyRate * Math.pow(1 + monthlyRate, numInstallments)) / 
                              (Math.pow(1 + monthlyRate, numInstallments) - 1);
    return installmentValue;
  };

  const generateInstallmentOptions = (total: number) => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      const installmentValue = calculateInstallmentValue(total, i);
      const totalWithInterest = installmentValue * i;
      options.push({
        value: i,
        label: i === 1 
          ? `1x de ${formatCurrency(total)} (sem juros)`
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

  // All payments complete
  if (order.sinal_paid && order.balance_paid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pagamento Completo!</h1>
            <p className="text-muted-foreground mb-4">
              Todos os pagamentos do seu pedido foram confirmados. Obrigado!
            </p>
            <Button onClick={() => navigate(`/rastreio/${order.order_id}`)}>
              Acompanhar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAmount =
    paymentType === "sinal" ? order.sinal_value : order.balance_value;
  const currentLabel = paymentType === "sinal" ? "Sinal (50%)" : "Saldo (50%)";
  const installmentOptions = order.balance_value ? generateInstallmentOptions(order.balance_value) : [];

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
            <h1 className="text-3xl font-bold mb-2">Pagamento</h1>
            <p className="text-muted-foreground">
              Pedido <span className="font-medium">{order.order_id}</span>
            </p>
          </div>

          {/* Payment status */}
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
                      Apenas Pix
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

          {/* Payment methods */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>
                Pagar {currentLabel}:{" "}
                <span className="text-primary">
                  {currentAmount ? formatCurrency(currentAmount) : "-"}
                </span>
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
                    disabled={paymentType === "sinal"}
                  >
                    <CreditCard className="h-4 w-4" />
                    Cartão
                    {paymentType === "sinal" && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (só saldo)
                      </span>
                    )}
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
