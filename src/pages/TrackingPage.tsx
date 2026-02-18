import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield,
  FileText,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { StatusTimeline } from "@/components/tracking/StatusTimeline";
import { ProgressStepper } from "@/components/tracking/ProgressStepper";
import { InfoCard, InfoRow } from "@/components/tracking/InfoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  ORDER_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatCurrency,
  OrderType,
} from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderData {
  order_id: string;
  order_type: OrderType;
  current_status: string;
  client_name: string;
  product_name: string;
  product_reference: string | null;
  sla_vault_due_date: string | null;
  international_tracking: string | null;
  national_tracking: string | null;
  national_carrier: string | null;
  created_at: string;
  budget_status: string | null;
  budget_approval_token: string | null;
  sinal_paid: boolean | null;
  product_price: number | null;
  product_currency: string | null;
}

interface HistoryItem {
  status: string;
  notes: string | null;
  history_timestamp: string;
}

const TrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cpf = location.state?.cpf;

  useEffect(() => {
    if (!orderId || !cpf) {
      navigate("/");
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase.rpc(
          "track_order",
          {
            p_order_id: orderId,
            p_cpf: cpf,
          }
        );

        if (orderError) throw orderError;

        if (!orderData || orderData.length === 0) {
          setError("Pedido não encontrado");
          return;
        }

        setOrder(orderData[0] as OrderData);

        // Fetch history
        const { data: historyData, error: historyError } = await supabase.rpc(
          "get_order_history",
          {
            p_order_id: orderId,
            p_cpf: cpf,
          }
        );

        if (!historyError && historyData) {
          setHistory(historyData as HistoryItem[]);
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError("Erro ao carregar pedido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, cpf, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        </div>
        <header className="relative border-b border-border/30 bg-background/80 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Logo size="md" />
          </div>
        </header>
        <main className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-destructive/5 rounded-full blur-3xl" />
        </div>
        <header className="relative border-b border-border/30 bg-background/80 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Logo size="md" />
          </div>
        </header>
        <main className="relative z-10 flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">{error || "Erro"}</h1>
            <p className="text-muted-foreground mb-6">
              Não foi possível encontrar seu pedido.
            </p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao início
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Helmet>
        <title>Rastreio {order.order_id} | BRAVENZA</title>
        <meta name="description" content={`Acompanhe o status do pedido ${order.order_id} em tempo real na BRAVENZA.`} />
      </Helmet>
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Novo rastreio
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Order header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                VAULT
              </span>
              <h1 className="text-2xl md:text-3xl font-bold">{order.order_id}</h1>
            </div>
            <p className="text-muted-foreground">
              Olá, <span className="text-foreground">{order.client_name}</span>!
              Acompanhe abaixo o status do seu pedido.
            </p>
          </motion.div>

          {/* Budget/Payment Action Card */}
          {order.budget_status === "SENT" && order.budget_approval_token && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/20">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Orçamento Pendente</h3>
                        <p className="text-sm text-muted-foreground">
                          Você tem um orçamento aguardando aprovação
                        </p>
                      </div>
                    </div>
                    <Button asChild className="btn-gold">
                      <Link to={`/orcamento/${order.budget_approval_token}`}>
                        Ver Orçamento
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Payment Action Card */}
          {order.budget_status === "APPROVED" && !order.sinal_paid && order.budget_approval_token && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-500/20">
                        <CreditCard className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pagamento Pendente</h3>
                        <p className="text-sm text-muted-foreground">
                          Efetue o pagamento de {order.product_price ? formatCurrency(order.product_price, order.product_currency || "BRL") : "100%"} para confirmar seu pedido
                        </p>
                      </div>
                    </div>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
                      <Link to={`/pagamento/${order.budget_approval_token}`}>
                        Pagar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Progress Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium-gold p-6 md:p-8 mb-8"
          >
            <ProgressStepper
              currentStatus={order.current_status}
              orderType={order.order_type}
              history={history}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
              <Clock className="h-4 w-4" />
              <span>Pedido criado em {formatDateTime(order.created_at)}</span>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 card-premium p-6"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Histórico do Pedido
              </h3>
              <StatusTimeline
                currentStatus={order.current_status}
                orderType={order.order_type}
                history={history}
              />
            </motion.div>

            {/* Info cards */}
            <div className="space-y-4">
              {/* Product info */}
              <InfoCard title="Produto" icon={<Package className="h-5 w-5" />}>
                <p className="font-medium text-foreground">{order.product_name}</p>
                {order.product_reference && (
                  <p className="text-muted-foreground text-xs">
                    Ref: {order.product_reference}
                  </p>
                )}
              </InfoCard>

              {/* SLA info */}
              {order.sla_vault_due_date && (
                <InfoCard
                  title="Prazo estimado"
                  icon={<Calendar className="h-5 w-5" />}
                  variant="gold"
                >
                  <InfoRow
                    label="Data limite"
                    value={formatDate(order.sla_vault_due_date)}
                    highlight
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Prazo estimado para chegada do produto.
                  </p>
                </InfoCard>
              )}

              {/* Tracking info */}
              {order.national_tracking && (
                <InfoCard
                  title="Rastreio"
                  icon={<Truck className="h-5 w-5" />}
                >
                  <InfoRow
                    label="Código"
                    value={order.national_tracking}
                  />
                  {order.national_carrier && (
                    <InfoRow
                      label="Transportadora"
                      value={order.national_carrier}
                    />
                  )}
                </InfoCard>
              )}

              {/* VAULT Policy */}
              <InfoCard
                title="Política VAULT"
                icon={<Shield className="h-5 w-5" />}
              >
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Pagamento <strong>não é reembolsável</strong> após confirmação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Troca/reembolso <strong>somente por defeito</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Tamanho <strong>não é trocável</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Prazo de suporte: 7 dias após recebimento</span>
                    </li>
                  </ul>
                </InfoCard>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container mx-auto px-4 text-center">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground mt-4">
            © {new Date().getFullYear()} BRAVENZA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPage;
