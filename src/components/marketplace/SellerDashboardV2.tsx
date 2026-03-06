import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, DollarSign, Eye,
  Lock, Megaphone, Package, ShoppingBag, Star, TrendingUp,
  Unlock, Wallet, Zap, MessageSquare, ChevronRight, ShieldCheck, Timer,
  Sparkles, ArrowUpRight, CircleDot
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { SellerReviewsSection } from "./SellerReviewsSection";
import { SellerPriceCharts } from "./SellerPriceCharts";

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
const fmtCompact = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(".0", "")}k`;
  return String(v);
};
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; progress: number }> = {
  bronze: { label: "Bronze", color: "text-amber-700 dark:text-amber-500", bg: "bg-amber-500/10", progress: 25 },
  silver: { label: "Prata", color: "text-slate-500", bg: "bg-slate-500/10", progress: 50 },
  gold: { label: "Ouro", color: "text-primary", bg: "bg-primary/10", progress: 75 },
  platinum: { label: "Platina", color: "text-violet-500", bg: "bg-violet-500/10", progress: 100 },
};
const PERIOD_LABELS = [
  { key: "d7", label: "7d" },
  { key: "d30", label: "30d" },
  { key: "d90", label: "90d" },
] as const;

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export function SellerDashboardV2({ cpf }: { cpf: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"d7" | "d30" | "d90">("d30");

  const fetchData = useCallback(async () => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyDashboard />;

  const tasks = data.today_tasks;
  const taskCount = tasks.pending_shipments.length + tasks.pending_hub_actions.length + tasks.open_disputes.length + tasks.pending_offers_count;
  const m = data.metrics[period];
  const ls = data.listings_summary;
  const w = data.wallet_summary;
  const rep = data.reputation_summary;
  const tierCfg = TIER_CONFIG[rep.tier] || TIER_CONFIG.bronze;
  const totalWallet = w.released + w.pending;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">

      {/* ═══ HERO REVENUE STRIP ═══ */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-background border border-primary/10 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Receita no período</p>
                </div>
              </div>
              {/* Period Toggle */}
              <div className="flex bg-background/80 backdrop-blur-sm rounded-full p-0.5 border border-border/40">
                {PERIOD_LABELS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={cn(
                      "text-[10px] font-semibold px-3 py-1 rounded-full transition-all",
                      period === p.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-3xl font-black tracking-tight">{fmt(m.revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {m.sales} venda{m.sales !== 1 ? "s" : ""} · {fmt(m.fees)} em comissões
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ QUICK METRICS ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        <QuickMetric icon={ShoppingBag} label="Vendas" value={String(m.sales)} />
        <QuickMetric icon={Eye} label="Views" value={fmtCompact(data.metrics.total_views)} />
        <QuickMetric icon={BarChart3} label="Conversão" value={`${data.metrics.conversion_rate}%`} />
      </motion.div>

      {/* ═══ TODAY TASKS ═══ */}
      <motion.div variants={fadeUp}>
        <Card className={cn(
          "border-border/40 overflow-hidden",
          taskCount > 0 ? "shadow-md shadow-warning/5" : "shadow-sm"
        )}>
          {taskCount > 0 && <div className="h-0.5 bg-gradient-to-r from-warning via-warning/60 to-transparent" />}
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center", taskCount > 0 ? "bg-warning/15" : "bg-emerald-500/10")}>
                {taskCount > 0
                  ? <Zap className="h-3.5 w-3.5 text-warning" />
                  : <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                }
              </div>
              {taskCount > 0 ? "Ações pendentes" : "Tudo em dia"}
              {taskCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-warning/15 text-warning text-[10px] font-bold">{taskCount}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {taskCount === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2">Nenhuma ação pendente no momento 🎉</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.pending_shipments.length > 0 && (
                  <TaskRow icon={Package} color="text-warning" bg="bg-warning/10" label={`${tasks.pending_shipments.length} pedido${tasks.pending_shipments.length > 1 ? "s" : ""} para enviar`} sublabel="Envie rápido para manter sua reputação" onClick={() => navigate("/app/pedidos")} urgent />
                )}
                {tasks.open_disputes.length > 0 && (
                  <TaskRow icon={AlertTriangle} color="text-destructive" bg="bg-destructive/10" label={`${tasks.open_disputes.length} disputa${tasks.open_disputes.length > 1 ? "s" : ""}`} sublabel="Requer atenção imediata" onClick={() => navigate("/app/pedidos")} urgent />
                )}
                {tasks.pending_hub_actions.length > 0 && (
                  <TaskRow icon={ShoppingBag} color="text-blue-500" bg="bg-blue-500/10" label={`${tasks.pending_hub_actions.length} no Hub aguardando`} onClick={() => navigate("/app/pedidos")} />
                )}
                {tasks.pending_offers_count > 0 && (
                  <TaskRow icon={MessageSquare} color="text-primary" bg="bg-primary/10" label={`${tasks.pending_offers_count} oferta${tasks.pending_offers_count > 1 ? "s" : ""} pendente${tasks.pending_offers_count > 1 ? "s" : ""}`} onClick={() => navigate("/app/loja")} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ WALLET + LISTINGS (side by side on wider screens) ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Wallet Card */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-transparent" />
          <CardHeader className="pb-1 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                <Wallet className="h-3.5 w-3.5" /> Carteira
              </CardTitle>
              <button onClick={() => navigate("/app/loja/saldo")} className="text-[10px] font-medium text-primary flex items-center gap-0.5 hover:underline">
                Ver tudo <ArrowUpRight className="h-2.5 w-2.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            <p className="text-2xl font-black tracking-tight mb-3">{fmt(totalWallet)}</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Unlock className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-[9px] text-muted-foreground font-medium uppercase">Liberado</span>
                </div>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{fmt(w.released)}</p>
              </div>
              <div className="flex-1 rounded-lg bg-warning/5 border border-warning/10 p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Lock className="h-2.5 w-2.5 text-warning" />
                  <span className="text-[9px] text-muted-foreground font-medium uppercase">Escrow</span>
                </div>
                <p className="text-sm font-black text-warning">{fmt(w.pending)}</p>
              </div>
            </div>
            {w.recent_payouts.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-border/30 space-y-1.5">
                {w.recent_payouts.slice(0, 2).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <CircleDot className={cn("h-2.5 w-2.5", p.status === "completed" ? "text-emerald-500" : "text-warning")} />
                      <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <span className="font-semibold tabular-nums">-{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listings Card */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
          <CardHeader className="pb-1 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                <Megaphone className="h-3.5 w-3.5" /> Anúncios
              </CardTitle>
              <button onClick={() => navigate("/app/loja")} className="text-[10px] font-medium text-primary flex items-center gap-0.5 hover:underline">
                Gerenciar <ArrowUpRight className="h-2.5 w-2.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            {ls.active === 0 && ls.paused === 0 && ls.sold === 0 ? (
              <div className="text-center py-5">
                <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/15 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum anúncio ainda</p>
                <Button size="sm" className="mt-2 btn-gold gap-1 rounded-lg text-[11px] h-8" onClick={() => navigate("/app/loja")}>
                  Criar anúncio <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-3">
                  <p className="text-2xl font-black">{ls.active}</p>
                  <p className="text-xs text-muted-foreground">ativos</p>
                  {ls.total_value > 0 && (
                    <p className="text-[10px] text-muted-foreground ml-auto">Inventário: {fmt(ls.total_value)}</p>
                  )}
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-lg font-black text-muted-foreground">{ls.paused}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-medium">Pausados</p>
                  </div>
                  <div className="w-px bg-border/40" />
                  <div>
                    <p className="text-lg font-black text-primary">{ls.sold}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-medium">Vendidos</p>
                  </div>
                </div>
                {ls.stale_count > 0 && (
                  <button
                    onClick={() => navigate("/app/loja")}
                    className="w-full mt-3 flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-warning shrink-0" />
                    <p className="text-[10px] text-left flex-1">
                      <span className="font-semibold text-foreground">{ls.stale_count}</span>
                      <span className="text-muted-foreground"> com poucas views</span>
                    </p>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ REPUTATION ═══ */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/10 to-transparent" />
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
              <Star className="h-3.5 w-3.5" /> Reputação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Tier + Rating hero row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn("text-lg font-black", tierCfg.color)}>{tierCfg.label}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-border/40">{rep.fee_percent}% comissão</Badge>
                </div>
                <Progress value={tierCfg.progress} className="h-1.5 bg-muted/50" />
              </div>
              <div className="text-center pl-4 border-l border-border/30">
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-black">{rep.rating > 0 ? rep.rating.toFixed(1) : "—"}</p>
                  {rep.rating > 0 && <Star className="h-4 w-4 text-primary fill-primary" />}
                </div>
                <p className="text-[9px] text-muted-foreground">{rep.ratings_count} avaliação{rep.ratings_count !== 1 ? "ões" : ""}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <StatPill icon={Timer} label="Pontualidade" value={rep.on_time_rate > 0 ? `${rep.on_time_rate}%` : "—"} />
              <StatPill icon={ShieldCheck} label="Autenticação" value={rep.auth_approval_rate > 0 ? `${rep.auth_approval_rate}%` : "—"} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ PRICE HISTORY ═══ */}
      <motion.div variants={fadeUp}>
        <SellerPriceCharts cpf={cpf} />
      </motion.div>

      {/* ═══ SELLER REVIEWS ═══ */}
      <SellerReviewsSection cpf={cpf} />
    </motion.div>
  );
}

/* ─── Sub-components ─── */

function QuickMetric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-black truncate">{value}</p>
        <p className="text-[9px] text-muted-foreground font-medium uppercase">{label}</p>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/20">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}

function TaskRow({ icon: Icon, color, bg, label, sublabel, onClick, urgent }: {
  icon: typeof Package; color: string; bg: string; label: string; sublabel?: string; onClick: () => void; urgent?: boolean;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left group">
      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate leading-tight">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground leading-tight">{sublabel}</p>}
      </div>
      {urgent && <span className="h-2 w-2 rounded-full bg-warning animate-pulse shrink-0" />}
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
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
