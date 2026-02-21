import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Package,
  Truck,
  Shield,
  Copy,
  Share2,
  ArrowRight,
  Clock,
  MapPin,
  CreditCard,
  QrCode,
  ExternalLink,
  Eye,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { formatCurrency } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ── Mock data ──────────────────────────────────────────────
const MOCK_BRAVENZA = {
  order_id: "BVZ-2025-0042",
  order_type: "encomenda",
  client_name: "João Silva",
  product_name: "Nike Air Jordan 1 Retro High OG",
  product_brand: "Nike",
  product_model: "Air Jordan 1",
  product_size: "42",
  product_color: "Chicago",
  product_price: 189900,
};

const MOCK_MARKETPLACE = {
  order_id: "MKT-2025-0087",
  order_type: "marketplace",
  client_name: "Maria Souza",
  product_name: "Adidas Yeezy Boost 350 V2",
  product_brand: "Adidas",
  product_model: "Yeezy 350 V2",
  product_size: "38",
  product_color: "Zebra",
  product_price: 134900,
};

// ── Confetti ───────────────────────────────────────────────
function ConfettiEffect() {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.7)",
    "hsl(45 100% 60%)",
    "hsl(45 100% 75%)",
    "hsl(280 60% 65%)",
    "hsl(150 60% 50%)",
  ];
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: "110vh", rotate: 360 + Math.random() * 360, opacity: [1, 1, 0.8, 0], scale: [1, 1.2, 0.8] }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: p.delay, ease: "easeOut" }}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

function SuccessCheckmark() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }} className="relative">
      <motion.div initial={{ scale: 1 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, delay: 0.5 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.4 }} className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>
      </motion.div>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.5, opacity: [0, 0.3, 0] }} transition={{ duration: 1.2, delay: 0.5 }} className="absolute inset-0 rounded-full border-2 border-success/30" />
    </motion.div>
  );
}

// ── Main Preview Page ──────────────────────────────────────
export default function CheckoutPreviewPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bravenza");
  const [showConfetti, setShowConfetti] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

  const order = activeTab === "bravenza" ? MOCK_BRAVENZA : MOCK_MARKETPLACE;
  const isMarketplace = order.order_type === "marketplace";
  const estimatedDays = isMarketplace ? "7 a 15 dias úteis" : "20 a 40 dias úteis";
  const methodLabel = paymentMethod === "card" ? "Cartão de Crédito" : "PIX";

  const triggerConfetti = () => {
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 50);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const steps = isMarketplace
    ? [
        { icon: CheckCircle2, title: "Pagamento confirmado", desc: "Seu pagamento foi aprovado com sucesso", status: "done" as const },
        { icon: Package, title: "Envio ao HUB", desc: "O vendedor envia o produto para nosso centro de inspeção", status: "active" as const },
        { icon: Shield, title: "Autenticação técnica", desc: "O produto passa por verificação de autenticidade", status: "pending" as const },
        { icon: Truck, title: "Envio e entrega", desc: `Prazo estimado: ${estimatedDays}`, status: "pending" as const },
      ]
    : [
        { icon: CheckCircle2, title: "Pagamento confirmado", desc: "Seu pagamento foi aprovado com sucesso", status: "done" as const },
        { icon: Shield, title: "Busca e curadoria", desc: "Iniciamos a busca pelo seu produto com fornecedores verificados", status: "active" as const },
        { icon: Package, title: "Autenticação técnica", desc: "O produto passa por verificação de autenticidade", status: "pending" as const },
        { icon: Truck, title: "Envio e entrega", desc: `Prazo estimado: ${estimatedDays}`, status: "pending" as const },
      ];

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>{showConfetti && <ConfettiEffect />}</AnimatePresence>

      {/* Preview Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
        <Eye className="h-4 w-4" />
        Modo Preview — Página de Confirmação de Pedido
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-center">
          <Logo />
        </div>
      </header>

      {/* Controls */}
      <div className="container max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <Card className="mb-6 border-dashed border-2 border-primary/30">
          <CardContent className="pt-6 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Controles de Preview</p>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); triggerConfetti(); }}>
              <TabsList className="w-full">
                <TabsTrigger value="bravenza" className="flex-1 gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Bravenza
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="flex-1 gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Marketplace
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button size="sm" variant={paymentMethod === "pix" ? "default" : "outline"} onClick={() => setPaymentMethod("pix")} className="gap-1.5 flex-1">
                <QrCode className="h-3.5 w-3.5" /> PIX
              </Button>
              <Button size="sm" variant={paymentMethod === "card" ? "default" : "outline"} onClick={() => setPaymentMethod("card")} className="gap-1.5 flex-1">
                <CreditCard className="h-3.5 w-3.5" /> Cartão
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={triggerConfetti} className="w-full text-xs">
              🎉 Replay Confetti
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Content */}
      <main className="container max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6" key={activeTab + paymentMethod}>
          {/* Success Hero */}
          <div className="text-center space-y-4">
            <SuccessCheckmark />
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Pagamento Confirmado!</h1>
              <p className="text-muted-foreground mt-2">
                Obrigado, <span className="font-semibold text-foreground">{order.client_name}</span>! Seu pedido está garantido.
              </p>
            </motion.div>
          </div>

          {/* Order Code */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Código do Pedido</p>
                    <p className="text-lg font-mono font-bold text-primary mt-1">{order.order_id}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Copiado!", description: "Código do pedido copiado." })} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copiar
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
                      {[order.product_brand, order.product_model, order.product_size, order.product_color].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor pago</p>
                      <p className="font-bold text-primary">{formatCurrency(order.product_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Método</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {paymentMethod === "card" ? <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> : <QrCode className="h-3.5 w-3.5 text-muted-foreground" />}
                        <p className="font-medium text-sm">{methodLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Card>
              <CardContent className="pt-6 pb-6">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Próximos Passos
                  {isMarketplace && <Badge variant="secondary" className="text-[10px]">Marketplace</Badge>}
                </h3>
                <div className="space-y-0">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.status === "done" ? "bg-success/20" : step.status === "active" ? "bg-primary/20 ring-2 ring-primary/30" : "bg-muted"
                        }`}>
                          <step.icon className={`h-4 w-4 ${step.status === "done" ? "text-success" : step.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        {i < 3 && <div className={`w-0.5 h-8 ${step.status === "done" ? "bg-success/30" : "bg-border"}`} />}
                      </div>
                      <div className="pb-6">
                        <p className={`font-medium text-sm ${step.status === "active" ? "text-primary" : ""}`}>
                          {step.title}
                          {step.status === "active" && <Badge className="ml-2 bg-primary/20 text-primary text-[10px] px-1.5 py-0">Em andamento</Badge>}
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="space-y-3">
            <Button className="w-full btn-gold gap-2" size="lg" onClick={() => toast({ title: "Preview", description: "Link de rastreio (modo preview)" })}>
              <MapPin className="h-4 w-4" /> Acompanhar Pedido
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Preview", description: "Compartilhar (modo preview)" })}>
                <Share2 className="h-4 w-4" /> Compartilhar
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Preview", description: "Minha Conta (modo preview)" })}>
                <ExternalLink className="h-4 w-4" /> Minha Conta
              </Button>
            </div>
          </motion.div>

          {/* Footer trust */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="text-center text-xs text-muted-foreground py-4 space-y-1">
            <p>🔒 Pagamento processado com segurança pela Bravenza</p>
            <p>📧 Uma confirmação foi enviada para o seu email</p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
