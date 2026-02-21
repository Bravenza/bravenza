import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Package,
  Truck,
  Shield,
  Copy,
  Share2,
  ArrowRight,
  PartyPopper,
  Clock,
  MapPin,
  CreditCard,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/constants";

interface ConfirmationData {
  order_id: string;
  order_type: string;
  client_name: string;
  product_name: string;
  product_brand: string | null;
  product_model: string | null;
  product_size: string | null;
  product_color: string | null;
  product_price: number | null;
  sinal_paid: boolean;
  sinal_payment_method: string | null;
  created_at: string;
}

function ConfettiEffect() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; color: string; size: number }>>([]);

  useEffect(() => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--primary) / 0.7)",
      "hsl(45 100% 60%)",
      "hsl(45 100% 75%)",
      "hsl(280 60% 65%)",
      "hsl(150 60% 50%)",
    ];
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: "110vh",
            rotate: 360 + Math.random() * 360,
            opacity: [1, 1, 0.8, 0],
            scale: [1, 1.2, 0.8],
          }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: p.delay, ease: "easeOut" }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className="relative"
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.4 }}
          className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>
      </motion.div>
      {/* Glow ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: [0, 0.3, 0] }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="absolute inset-0 rounded-full border-2 border-success/30"
      />
    </motion.div>
  );
}

export default function OrderConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<ConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  const paymentMethod = searchParams.get("method") || "pix";

  useEffect(() => {
    if (!token) return;
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase.rpc("get_order_by_token", { p_token: token });
        if (error) throw error;
        if (!data || data.length === 0) { navigate("/"); return; }
        const d = data[0] as unknown as ConfirmationData;
        if (!d.sinal_paid) { navigate(`/pagamento/${token}`); return; }
        setOrder(d);
      } catch {
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
    // Hide confetti after a few seconds
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, [token, navigate]);

  const handleShare = useCallback(async () => {
    if (!order) return;
    const text = `Acabei de garantir meu ${order.product_name} pela Bravenza! 🔥✅`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bravenza", text, url: window.location.origin });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado!", description: "Texto copiado para compartilhar." });
    }
  }, [order, toast]);

  const handleCopyOrderId = useCallback(() => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_id);
    toast({ title: "Copiado!", description: "Código do pedido copiado." });
  }, [order, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando confirmação...</p>
        </motion.div>
      </div>
    );
  }

  if (!order) return null;

  const methodLabel = paymentMethod === "card" ? "Cartão de Crédito" : "PIX";
  const estimatedDays = "20 a 40 dias úteis";

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>{showConfetti && <ConfettiEffect />}</AnimatePresence>

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-center">
          <Logo />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Success Hero */}
          <div className="text-center space-y-4">
            <SuccessCheckmark />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Pagamento Confirmado!
              </h1>
              <p className="text-muted-foreground mt-2">
                Obrigado, <span className="font-semibold text-foreground">{order.client_name}</span>!
                Seu pedido está garantido.
              </p>
            </motion.div>
          </div>

          {/* Order Code Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Código do Pedido</p>
                    <p className="text-lg font-mono font-bold text-primary mt-1">{order.order_id}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyOrderId} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Details */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card>
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Detalhes do Produto</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{order.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[order.product_brand, order.product_model, order.product_size, order.product_color]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor pago</p>
                      <p className="font-bold text-primary">{order.product_price ? formatCurrency(order.product_price) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Método</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {paymentMethod === "card" ? (
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <p className="font-medium text-sm">{methodLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Steps Timeline */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Card>
              <CardContent className="pt-6 pb-6">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Próximos Passos
                </h3>

                <div className="space-y-0">
                {(order.order_type === "marketplace"
                  ? [
                      {
                        icon: CheckCircle2,
                        title: "Pagamento confirmado",
                        desc: "Seu pagamento foi aprovado com sucesso",
                        status: "done" as const,
                      },
                      {
                        icon: Package,
                        title: "Envio ao HUB",
                        desc: "O vendedor envia o produto para nosso centro de inspeção",
                        status: "active" as const,
                      },
                      {
                        icon: Shield,
                        title: "Autenticação técnica",
                        desc: "O produto passa por verificação de autenticidade",
                        status: "pending" as const,
                      },
                      {
                        icon: Truck,
                        title: "Envio e entrega",
                        desc: `Prazo estimado: ${estimatedDays}`,
                        status: "pending" as const,
                      },
                    ]
                  : [
                      {
                        icon: CheckCircle2,
                        title: "Pagamento confirmado",
                        desc: "Seu pagamento foi aprovado com sucesso",
                        status: "done" as const,
                      },
                      {
                        icon: Shield,
                        title: "Busca e curadoria",
                        desc: "Iniciamos a busca pelo seu produto com fornecedores verificados",
                        status: "active" as const,
                      },
                      {
                        icon: Package,
                        title: "Autenticação técnica",
                        desc: "O produto passa por verificação de autenticidade",
                        status: "pending" as const,
                      },
                      {
                        icon: Truck,
                        title: "Envio e entrega",
                        desc: `Prazo estimado: ${estimatedDays}`,
                        status: "pending" as const,
                      },
                    ]
                ).map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            step.status === "done"
                              ? "bg-success/20"
                              : step.status === "active"
                              ? "bg-primary/20 ring-2 ring-primary/30"
                              : "bg-muted"
                          }`}
                        >
                          <step.icon
                            className={`h-4 w-4 ${
                              step.status === "done"
                                ? "text-success"
                                : step.status === "active"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        {i < 3 && (
                          <div className={`w-0.5 h-8 ${step.status === "done" ? "bg-success/30" : "bg-border"}`} />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`font-medium text-sm ${step.status === "active" ? "text-primary" : ""}`}>
                          {step.title}
                          {step.status === "active" && (
                            <Badge className="ml-2 bg-primary/20 text-primary text-[10px] px-1.5 py-0">Em andamento</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delivery estimate */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="font-medium">Prazo estimado: {estimatedDays}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Você receberá atualizações por email e WhatsApp em cada etapa. Acompanhe também pelo painel do cliente.
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="space-y-3"
          >
            <Button asChild className="w-full btn-gold gap-2" size="lg">
              <Link to={`/rastreio/${order.order_id}`}>
                <MapPin className="h-4 w-4" />
                Acompanhar Pedido
              </Link>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/minha-conta">
                  <ExternalLink className="h-4 w-4" />
                  Minha Conta
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Footer trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center text-xs text-muted-foreground py-4 space-y-1"
          >
            <p>🔒 Pagamento processado com segurança pela Bravenza</p>
            <p>📧 Uma confirmação foi enviada para o seu email</p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
