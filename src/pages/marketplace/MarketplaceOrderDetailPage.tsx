import { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CreditCard, ShieldCheck, Truck, CheckCircle2,
  Clock, MapPin, FileText, MessageCircle, AlertTriangle, Loader2,
  ExternalLink, PackageCheck, Copy, Check, Calendar, Shield,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useConfig } from "@/hooks/useConfig";
import { useOrderDetail } from "@/hooks/marketplace/useOrderDetail";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString("pt-BR", opts || { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

// ─── Status config ────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Aguardando pagamento", color: "bg-warning/15 text-warning border-warning/20" },
  paid: { label: "Pago", color: "bg-info/10 text-info border-info/20" },
  shipped: { label: "Enviado", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  delivered: { label: "Entregue", color: "bg-success/10 text-success border-success/20" },
  completed: { label: "Concluído", color: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20" },
  disputed: { label: "Em disputa", color: "bg-destructive/10 text-destructive border-destructive/20" },
  payout_released: { label: "Finalizado", color: "bg-success/10 text-success border-success/20" },
  hub_received: { label: "No Hub", color: "bg-info/10 text-info border-info/20" },
  inspection_pending: { label: "Em inspeção", color: "bg-warning/15 text-warning border-warning/20" },
  inspection_approved: { label: "Autêntico ✓", color: "bg-success/10 text-success border-success/20" },
  in_transit_to_hub: { label: "Em trânsito → Hub", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  in_transit_to_buyer: { label: "Em trânsito → Você", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  ship_to_hub_pending: { label: "Aguardando envio", color: "bg-warning/15 text-warning border-warning/20" },
  ship_to_buyer_pending: { label: "Pronto p/ envio", color: "bg-info/10 text-info border-info/20" },
};

// ─── Stepper Steps ─────────────────────────────────────────────
const BUYER_STEPS = [
  { key: "paid", label: "Pago", icon: CreditCard, description: "Pagamento confirmado" },
  { key: "authenticated", label: "Autenticado", icon: ShieldCheck, description: "Verificação de autenticidade" },
  { key: "shipped", label: "Enviado", icon: Truck, description: "Produto a caminho" },
  { key: "delivered", label: "Entregue", icon: CheckCircle2, description: "Recebido com sucesso" },
];

const STATUS_ORDER: Record<string, number> = {
  pending_payment: -1, paid: 0, ship_to_hub_pending: 0, in_transit_to_hub: 0,
  hub_received: 1, inspection_pending: 1, inspection_approved: 1,
  ship_to_buyer_pending: 2, in_transit_to_buyer: 2, shipped: 2,
  delivered: 3, completed: 4, payout_released: 4,
};

function getStepIndex(status: string): number {
  return STATUS_ORDER[status] ?? -1;
}

// ─── Stepper Component ─────────────────────────────────────────
function OrderStepper({ status }: { status: string }) {
  const currentIdx = getStepIndex(status);
  const isCancelled = status === "cancelled" || status === "disputed";
  const progress = isCancelled ? 0 : Math.min(((currentIdx + 1) / BUYER_STEPS.length) * 100, 100);

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-destructive">
            {status === "cancelled" ? "Pedido cancelado" : "Em disputa"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {status === "cancelled" ? "Este pedido foi cancelado" : "Uma disputa foi aberta para este pedido"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Progresso do pedido</span>
          <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step icons */}
      <div className="flex items-center justify-between w-full pt-2">
        {BUYER_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isComplete = currentIdx > i;
          const isCurrent = currentIdx === i;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative group">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    boxShadow: isCurrent ? "0 0 0 6px hsl(var(--primary) / 0.1)" : "none",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-colors border-2",
                    isComplete && "bg-primary border-primary",
                    isCurrent && "bg-primary/10 border-primary",
                    !isComplete && !isCurrent && "bg-muted/40 border-border/50"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Icon className={cn("h-4.5 w-4.5", isCurrent ? "text-primary" : "text-muted-foreground/40")} />
                  )}
                </motion.div>
                <div className="text-center">
                  <span className={cn(
                    "text-[10px] font-semibold leading-tight block",
                    isComplete || isCurrent ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {step.label}
                  </span>
                </div>
              </div>
              {i < BUYER_STEPS.length - 1 && (
                <div className="flex-1 mx-1.5 mb-6">
                  <div className={cn(
                    "h-[2px] rounded-full w-full transition-colors",
                    isComplete ? "bg-primary" : "bg-border/40"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Timeline Item ──────────────────────────────────────────────
function TimelineItem({ event, isLast, isFirst }: { event: any; isLast: boolean; isFirst: boolean }) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-3 h-3 rounded-full mt-1 shrink-0 ring-4 ring-background transition-colors",
          isFirst ? "bg-primary" : "bg-border"
        )} />
        {!isLast && <div className="w-px flex-1 bg-border/50 my-1" />}
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          isFirst ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
        )}>
          {event.description || event.event_type}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5 font-mono">
          {fmtDateTime(event.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────
function Section({ children, icon: Icon, title, delay = 0, collapsible = false, defaultOpen = true }: {
  children: React.ReactNode;
  icon: any;
  title: string;
  delay?: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      role="region"
      aria-label={title}
    >
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 px-5 py-3.5 text-left",
          collapsible && "cursor-pointer hover:bg-muted/30 transition-colors"
        )}
        aria-expanded={open}
        disabled={!collapsible}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold flex-1">{title}</h2>
        {collapsible && (
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─── Copy button for tracking ──────────────────────────────────
function CopyableCode({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 font-mono text-xs bg-muted/50 hover:bg-muted/80 px-2.5 py-1.5 rounded-lg transition-colors group"
        aria-label={`Copiar código ${code}`}
      >
        {code}
        {copied ? (
          <Check className="h-3 w-3 text-success" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function MarketplaceOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const context = useOutletContext<{ cpf?: string }>();
  const cpf = context?.cpf || null;
  const { isEnabled } = useConfig();

  const { data, isLoading, error, fetchDetail, confirmDelivery } = useOrderDetail(cpf);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const flagEnabled = isEnabled("enable_order_detail_v2");

  useEffect(() => {
    if (!flagEnabled) {
      navigate("/app/pedidos", { replace: true });
      return;
    }
    if (orderId && cpf) {
      fetchDetail(orderId);
    }
  }, [orderId, cpf, flagEnabled]);

  if (!flagEnabled) return null;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-lg">{error || "Pedido não encontrado"}</p>
          <p className="text-sm text-muted-foreground mt-1">Verifique o link ou tente novamente</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/app/pedidos")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
        </Button>
      </div>
    );
  }

  const { order, timeline, documents, allowed_actions, role } = data;
  const listing = order.listing;
  const mainPhoto = listing?.photos?.[0];
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending_payment;
  const total = (order.sale_price || 0) + (order.shipping_cost || 0) + (order.authentication_fee || 0);

  const handleConfirmDelivery = async () => {
    if (!orderId) return;
    setConfirming(true);
    const ok = await confirmDelivery(orderId);
    setConfirming(false);
    if (ok) {
      toast({ title: "Recebimento confirmado!", description: "O pagamento será liberado ao vendedor." });
      setConfirmOpen(false);
      fetchDetail(orderId);
    } else {
      toast({ title: "Erro", description: "Não foi possível confirmar.", variant: "destructive" });
    }
  };

  // Protection days remaining
  const protectionDays = order.protection_ends_at
    ? Math.max(0, Math.ceil((new Date(order.protection_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-32 md:pb-12 space-y-4">
      {/* ── Back button ── */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <button
          onClick={() => navigate("/app/pedidos")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          aria-label="Voltar para meus pedidos"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Meus pedidos
        </button>
      </motion.div>

      {/* ── Hero card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        {/* Product row */}
        <div className="p-5 flex gap-4">
          {mainPhoto ? (
            <div className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted/30 border border-border/30 shrink-0">
              <img
                src={mainPhoto}
                alt={listing?.title || "Produto"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-xl bg-muted/30 border border-border/30 shrink-0 flex items-center justify-center">
              <PackageCheck className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h1 className="text-base font-bold leading-snug line-clamp-2">
                {listing?.title || `Pedido ${order.order_code}`}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {listing?.size && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium">
                    Tam. {listing.size}
                  </Badge>
                )}
                {listing?.condition && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-2 capitalize font-medium">
                    {listing.condition}
                  </Badge>
                )}
                {listing?.is_vault_certified && (
                  <Badge className="text-[10px] h-5 px-2 bg-primary/10 text-primary border-primary/20 font-semibold gap-0.5">
                    <ShieldCheck className="h-3 w-3" /> Certificado
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              R$ {fmt(total)}
            </p>
          </div>
        </div>

        {/* Status + meta bar */}
        <div className="px-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[11px] h-6 px-2.5 font-semibold border", statusInfo.color)}>
              {statusInfo.label}
            </Badge>
            {role === "seller" && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 text-primary border-primary/25 font-medium">
                Vendedor
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-mono">{order.order_code}</span>
            <span className="text-border">·</span>
            <span>{fmtDate(order.created_at)}</span>
          </div>
        </div>

        {/* Protection countdown */}
        {protectionDays !== null && protectionDays > 0 && (
          <div className="mx-5 mb-4 flex items-center gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-primary">Proteção Bravenza ativa</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Você tem {protectionDays} {protectionDays === 1 ? "dia" : "dias"} para reportar problemas
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Stepper ── */}
      <Section icon={PackageCheck} title="Status do pedido" delay={0.08}>
        <OrderStepper status={order.status} />
      </Section>

      {/* ── Tracking ── */}
      {(order.tracking_code || order.hub_tracking_code || order.hub_tracking_to_buyer) && (
        <Section icon={MapPin} title="Rastreamento" delay={0.12}>
          <div className="space-y-1">
            {order.hub_tracking_code && (
              <CopyableCode code={order.hub_tracking_code} label="Vendedor → Hub" />
            )}
            {(order.tracking_code || order.hub_tracking_to_buyer) && (
              <CopyableCode
                code={order.hub_tracking_to_buyer || order.tracking_code}
                label="Envio → Você"
              />
            )}
          </div>

          {order.tracking_last_event && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Última atualização</p>
              <p className="text-sm font-semibold mt-1">{order.tracking_last_event}</p>
              {order.tracking_last_update_at && (
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                  {fmtDateTime(order.tracking_last_update_at)}
                </p>
              )}
            </div>
          )}

          {order.eta_start && order.eta_end && (
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Previsão de entrega
              </div>
              <span className="text-sm font-bold">
                {fmtDate(order.eta_start, { day: "2-digit", month: "short" })}
                {" – "}
                {fmtDate(order.eta_end, { day: "2-digit", month: "short" })}
              </span>
            </div>
          )}
        </Section>
      )}

      {/* ── Financial summary ── */}
      <Section icon={CreditCard} title="Resumo financeiro" delay={0.16}>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Item</span>
            <span className="font-medium">R$ {fmt(order.sale_price || 0)}</span>
          </div>
          {(order.shipping_cost || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frete</span>
              <span className="font-medium">R$ {fmt(order.shipping_cost)}</span>
            </div>
          )}
          {(order.authentication_fee || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Autenticação</span>
              <span className="font-medium">R$ {fmt(order.authentication_fee)}</span>
            </div>
          )}
          <Separator className="!my-3" />
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-base">Total</span>
            <span className="font-bold text-lg">R$ {fmt(total)}</span>
          </div>
          {role === "seller" && (
            <>
              <Separator className="!my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa ({order.fee_percent}%)</span>
                <span className="text-muted-foreground font-medium">- R$ {fmt(order.fee_amount || 0)}</span>
              </div>
              <div className="flex justify-between items-baseline bg-primary/5 -mx-5 px-5 py-3 rounded-xl mt-1">
                <span className="font-semibold text-primary text-sm">Você recebe</span>
                <span className="font-bold text-primary text-lg">R$ {fmt(order.seller_payout || 0)}</span>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── Timeline ── */}
      {timeline.length > 0 && (
        <Section icon={Clock} title="Histórico" delay={0.2} collapsible defaultOpen={timeline.length <= 5}>
          <div className="pt-1">
            {timeline.map((ev, i) => (
              <TimelineItem key={ev.id} event={ev} isLast={i === timeline.length - 1} isFirst={i === 0} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Documents ── */}
      {documents.length > 0 && (
        <Section icon={FileText} title="Documentos" delay={0.24} collapsible>
          <div className="space-y-2">
            {documents.map(doc => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-border/60 transition-all text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="flex-1 truncate font-medium">{doc.document_name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* ── Sticky action bar ── */}
      {allowed_actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+56px)] md:bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/40 px-4 py-3 md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:px-0 md:py-0"
        >
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
            {allowed_actions.includes("pay") && (
              <Button
                className="flex-1 min-w-[130px] gap-2 h-11 font-semibold shadow-sm"
                onClick={() => navigate(`/pagamento/${order.order_code}`)}
              >
                <CreditCard className="h-4 w-4" /> Pagar agora
              </Button>
            )}
            {allowed_actions.includes("rate") && (
              <Button
                className="flex-1 min-w-[130px] gap-2 h-11 font-semibold shadow-sm"
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" /> Confirmar recebimento
              </Button>
            )}
            {allowed_actions.includes("open_dispute") && (
              <Button
                variant="outline"
                className="flex-1 min-w-[130px] gap-2 h-11 text-destructive border-destructive/30 hover:bg-destructive/5 font-semibold"
              >
                <AlertTriangle className="h-4 w-4" /> Reportar problema
              </Button>
            )}
            {allowed_actions.includes("ship") && (
              <Button className="flex-1 min-w-[130px] gap-2 h-11 font-semibold shadow-sm">
                <Truck className="h-4 w-4" />
                {order.shipping_mode === "bravenza" ? "Enviar ao Hub" : "Informar envio"}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 min-w-[130px] gap-2 h-11 font-medium"
              onClick={() => window.open("https://wa.me/5551999999999", "_blank")}
            >
              <MessageCircle className="h-4 w-4" /> Suporte
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── Confirm Delivery Dialog ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="w-14 h-14 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-2">
              <PackageCheck className="h-7 w-7 text-success" />
            </div>
            <AlertDialogTitle className="text-center">Confirmar recebimento</AlertDialogTitle>
            <AlertDialogDescription className="text-center leading-relaxed">
              Ao confirmar, você atesta que recebeu o produto em boas condições.
              O pagamento será liberado ao vendedor. Você terá até <strong>7 dias</strong> para
              abrir uma disputa caso identifique algum problema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelivery}
              disabled={confirming}
              className="rounded-xl gap-2"
            >
              {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar recebimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
