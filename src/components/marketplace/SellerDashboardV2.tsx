import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, Clock, DollarSign, Eye,
  Loader2, Lock, Megaphone, Package, ShoppingBag, Star, TrendingUp,
  Unlock, Wallet, Zap, MessageSquare, ChevronRight, ShieldCheck, Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface DashboardData {
  today_tasks: {
    pending_shipments: { id: string; order_code: string; sale_price: number; created_at: string }[];
    pending_hub_actions: { id: string; order_code: string; sale_price: number }[];
    open_disputes: { id: string; order_code: string }[];
    pending_offers_count: number;
  };
  metrics: {
    d7: { sales: number; revenue: number; fees: number };
    d30: { sales: number; revenue: number; fees: number };
    d90: { sales: number; revenue: number; fees: number };
    total_views: number;
    conversion_rate: number;
  };
  listings_summary: {
    active: number;
    paused: number;
    sold: number;
    total_value: number;
    stale_count: number;
  };
  wallet_summary: {
    released: number;
    pending: number;
    recent_payouts: { amount: number; status: string; created_at: string }[];
  };
  reputation_summary: {
    tier: string;
    rating: number;
    ratings_count: number;
    fee_percent: number;
    on_time_rate: number;
    auth_approval_rate: number;
  };
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const TIER_LABELS: Record<string, string> = { bronze: "Bronze", silver: "Prata", gold: "Ouro", platinum: "Platina" };
const PERIOD_LABELS = [
  { key: "d7", label: "7 dias" },
  { key: "d30", label: "30 dias" },
  { key: "d90", label: "90 dias" },
] as const;

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

export function SellerDashboardV2({ cpf }: { cpf: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"d7" | "d30" | "d90">("d30");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceRequest(cpf, "seller-dashboard");
      if (res.ok) setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [cpf]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyDashboard />;

  const tasks = data.today_tasks;
  const taskCount = tasks.pending_shipments.length + tasks.pending_hub_actions.length + tasks.open_disputes.length + tasks.pending_offers_count;
  const m = data.metrics[period];
  const ls = data.listings_summary;
  const w = data.wallet_summary;
  const rep = data.reputation_summary;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">

      {/* ═══ TODAY TASKS ═══ */}
      <motion.div variants={fadeUp}>
        <Card className={cn("border-border/40 shadow-sm", taskCount > 0 && "border-warning/30 bg-warning/[0.02]")}>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", taskCount > 0 ? "bg-warning/15" : "bg-muted")}>
                <Zap className={cn("h-3.5 w-3.5", taskCount > 0 ? "text-warning" : "text-muted-foreground")} />
              </div>
              Hoje
              {taskCount > 0 && (
                <Badge className="bg-warning/15 text-warning border-0 text-[10px] px-1.5 h-5">{taskCount} pendência{taskCount > 1 ? "s" : ""}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {taskCount === 0 ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Tudo em dia! 🎉</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Nenhuma ação pendente no momento</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.pending_shipments.length > 0 && (
                  <TaskRow
                    icon={Package} color="text-warning" bg="bg-warning/10"
                    label={`${tasks.pending_shipments.length} pedido${tasks.pending_shipments.length > 1 ? "s" : ""} para enviar`}
                    sublabel="Envie o mais rápido possível"
                    onClick={() => navigate("/app/pedidos")}
                    urgent
                  />
                )}
                {tasks.pending_hub_actions.length > 0 && (
                  <TaskRow
                    icon={ShoppingBag} color="text-blue-500" bg="bg-blue-500/10"
                    label={`${tasks.pending_hub_actions.length} no Hub aguardando`}
                    onClick={() => navigate("/app/pedidos")}
                  />
                )}
                {tasks.open_disputes.length > 0 && (
                  <TaskRow
                    icon={AlertTriangle} color="text-destructive" bg="bg-destructive/10"
                    label={`${tasks.open_disputes.length} disputa${tasks.open_disputes.length > 1 ? "s" : ""} aberta${tasks.open_disputes.length > 1 ? "s" : ""}`}
                    sublabel="Requer atenção imediata"
                    onClick={() => navigate("/app/pedidos")}
                    urgent
                  />
                )}
                {tasks.pending_offers_count > 0 && (
                  <TaskRow
                    icon={MessageSquare} color="text-primary" bg="bg-primary/10"
                    label={`${tasks.pending_offers_count} oferta${tasks.pending_offers_count > 1 ? "s" : ""} pendente${tasks.pending_offers_count > 1 ? "s" : ""}`}
                    onClick={() => navigate("/app/loja")}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ PERFORMANCE ═══ */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                Performance
              </CardTitle>
              <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                {PERIOD_LABELS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={cn(
                      "text-[10px] font-medium px-2.5 py-1 rounded-md transition-all",
                      period === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <MetricCard label="Vendas" value={String(m.sales)} icon={ShoppingBag} />
              <MetricCard label="Receita" value={fmt(m.revenue)} icon={DollarSign} highlight />
              <MetricCard label="Views" value={String(data.metrics.total_views)} icon={Eye} />
              <MetricCard label="Conversão" value={`${data.metrics.conversion_rate}%`} icon={BarChart3} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ LISTINGS ═══ */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                  <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                Anúncios
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] text-primary gap-1" onClick={() => navigate("/app/loja")}>
                Ver todos <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {ls.active === 0 && ls.paused === 0 && ls.sold === 0 ? (
              <div className="text-center py-6">
                <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum anúncio ainda</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Crie seu primeiro anúncio para começar a vender</p>
                <Button size="sm" className="mt-3 btn-gold gap-1 rounded-lg" onClick={() => navigate("/app/loja")}>
                  Criar anúncio <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-500/5 rounded-xl p-3 text-center border border-emerald-500/10">
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{ls.active}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Ativos</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 text-center border border-border/30">
                    <p className="text-xl font-black">{ls.paused}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Pausados</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
                    <p className="text-xl font-black text-primary">{ls.sold}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Vendidos</p>
                  </div>
                </div>
                {ls.stale_count > 0 && (
                  <button
                    onClick={() => navigate("/app/loja")}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-warning/5 border border-warning/15 hover:bg-warning/10 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4 text-warning shrink-0" />
                    <p className="text-[11px] text-left flex-1">
                      <span className="font-semibold text-foreground">{ls.stale_count} anúncio{ls.stale_count > 1 ? "s" : ""}</span>
                      <span className="text-muted-foreground"> com poucas views — considere ajustar o preço</span>
                    </p>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ WALLET ═══ */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                </div>
                Carteira
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] text-primary gap-1" onClick={() => navigate("/app/loja/saldo")}>
                Detalhes <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                <div className="flex items-center gap-1 mb-1">
                  <Unlock className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] text-muted-foreground font-medium">Liberado</span>
                </div>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{fmt(w.released)}</p>
              </div>
              <div className="bg-warning/5 rounded-xl p-3 border border-warning/10">
                <div className="flex items-center gap-1 mb-1">
                  <Lock className="h-3 w-3 text-warning" />
                  <span className="text-[10px] text-muted-foreground font-medium">A liberar</span>
                </div>
                <p className="text-base font-black text-warning">{fmt(w.pending)}</p>
              </div>
            </div>
            {w.recent_payouts.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Últimos movimentos</p>
                {w.recent_payouts.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-[11px]">
                    <span className="text-muted-foreground">Saque · {new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    <span className="font-semibold">-{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ REPUTATION ═══ */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <Star className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              Reputação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Nota média</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-xl font-black">{rep.rating > 0 ? rep.rating.toFixed(1) : "—"}</p>
                  {rep.rating > 0 && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground">{rep.ratings_count} avaliação{rep.ratings_count !== 1 ? "ões" : ""}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Tier</p>
                <p className="text-xl font-black capitalize">{TIER_LABELS[rep.tier] || rep.tier}</p>
                <p className="text-[10px] text-muted-foreground">Comissão: {rep.fee_percent}%</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
                <div className="flex items-center gap-1 mb-1">
                  <Timer className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-medium">Pontualidade</p>
                </div>
                <p className="text-xl font-black">{rep.on_time_rate > 0 ? `${rep.on_time_rate}%` : "—"}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
                <div className="flex items-center gap-1 mb-1">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-medium">Autenticação</p>
                </div>
                <p className="text-xl font-black">{rep.auth_approval_rate > 0 ? `${rep.auth_approval_rate}%` : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ─── */

function TaskRow({ icon: Icon, color, bg, label, sublabel, onClick, urgent }: {
  icon: typeof Package; color: string; bg: string; label: string; sublabel?: string; onClick: () => void; urgent?: boolean;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left group">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
      {urgent && <span className="h-2 w-2 rounded-full bg-warning animate-pulse shrink-0" />}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
    </button>
  );
}

function MetricCard({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: typeof DollarSign; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl p-3 border", highlight ? "bg-primary/5 border-primary/10" : "bg-muted/30 border-border/30")}>
      <div className="flex items-center gap-1 mb-1">
        <Icon className={cn("h-3 w-3", highlight ? "text-primary" : "text-muted-foreground")} />
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={cn("text-base font-black", highlight && "text-primary")}>{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="text-center py-16">
      <div className="h-16 w-16 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Não foi possível carregar o dashboard</p>
      <p className="text-[11px] text-muted-foreground/60 mt-0.5">Tente novamente mais tarde</p>
    </div>
  );
}
