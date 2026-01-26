import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { StatusTimeline } from "@/components/tracking/StatusTimeline";
import { InfoCard, InfoRow } from "@/components/tracking/InfoCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ORDER_STATUS_LABELS,
  formatDate,
  formatDateTime,
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
  balance_due_date: string | null;
  international_tracking: string | null;
  national_tracking: string | null;
  national_carrier: string | null;
  created_at: string;
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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Logo size="md" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{error || "Erro"}</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível encontrar seu pedido.
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isVault = order.order_type === "VAULT";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Order header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  isVault
                    ? "bg-primary/20 text-primary"
                    : "bg-success/20 text-success"
                }`}
              >
                {isVault ? "VAULT" : "READY"}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold">{order.order_id}</h1>
            </div>
            <p className="text-muted-foreground">
              Olá, <span className="text-foreground">{order.client_name}</span>!
              Acompanhe abaixo o status do seu pedido.
            </p>
          </motion.div>

          {/* Current status card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium-gold p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center pulse-gold">
                <Package className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Atual</p>
                <h2 className="text-xl md:text-2xl font-bold text-primary">
                  {ORDER_STATUS_LABELS[order.current_status] || order.current_status}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

              {/* SLA info for VAULT */}
              {isVault && order.sla_vault_due_date && (
                <InfoCard
                  title="Prazo VAULT 30"
                  icon={<Calendar className="h-5 w-5" />}
                  variant="gold"
                >
                  <InfoRow
                    label="Data limite"
                    value={formatDate(order.sla_vault_due_date)}
                    highlight
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Prazo estimado para chegada do produto no Brasil.
                  </p>
                </InfoCard>
              )}

              {/* Balance due */}
              {order.balance_due_date && (
                <InfoCard
                  title="Pagamentos"
                  icon={<CreditCard className="h-5 w-5" />}
                  variant="gold"
                >
                  <InfoRow
                    label="Vencimento saldo"
                    value={formatDateTime(order.balance_due_date)}
                    highlight
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    O saldo deve ser pago em até 24h após chegada no Brasil.
                  </p>
                </InfoCard>
              )}

              {/* Tracking info */}
              {(order.international_tracking || order.national_tracking) && (
                <InfoCard
                  title="Rastreios"
                  icon={<Truck className="h-5 w-5" />}
                >
                  {order.international_tracking && (
                    <InfoRow
                      label="Internacional"
                      value={order.international_tracking}
                    />
                  )}
                  {order.national_tracking && (
                    <>
                      <InfoRow
                        label="Nacional"
                        value={order.national_tracking}
                      />
                      {order.national_carrier && (
                        <InfoRow
                          label="Transportadora"
                          value={order.national_carrier}
                        />
                      )}
                    </>
                  )}
                </InfoCard>
              )}

              {/* VAULT Rules */}
              {isVault && (
                <InfoCard
                  title="Regras VAULT"
                  icon={<AlertCircle className="h-5 w-5" />}
                >
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Sinal de 30% para iniciar o processo
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Saldo em até 24h após chegada no BR
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Prazo VAULT 30: 30 dias úteis
                    </li>
                  </ul>
                </InfoCard>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
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
