import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Search,
  Eye,
  SendHorizonal,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/integrations/supabase/types";

type SearchStatus = Database["public"]["Enums"]["search_status"];

/* ── Step definitions ── */

interface StepDef {
  key: SearchStatus;
  label: string;
  description: string;
  icon: React.ElementType;
}

const CURATION_STEPS: StepDef[] = [
  {
    key: "RECEIVED",
    label: "Solicitação recebida",
    description: "Sua busca foi registrada e será analisada pela curadoria.",
    icon: Clock,
  },
  {
    key: "IN_CURATION",
    label: "Em curadoria",
    description: "Nossa equipe está vasculhando o mercado global por você.",
    icon: Search,
  },
  {
    key: "OPTIONS_IDENTIFIED",
    label: "Opções identificadas",
    description: "Encontramos possíveis matches para sua busca.",
    icon: Eye,
  },
  {
    key: "VALIDATING",
    label: "Validando",
    description: "Verificando autenticidade e condições com o fornecedor.",
    icon: Eye,
  },
  {
    key: "MATCH_SENT",
    label: "Match enviado",
    description: "Uma proposta foi enviada para sua avaliação.",
    icon: SendHorizonal,
  },
  {
    key: "AWAITING_DECISION",
    label: "Aguardando decisão",
    description: "Estamos aguardando sua resposta na Match Room.",
    icon: MessageSquare,
  },
];

const CLOSED_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CLOSED_APPROVED: { label: "Aprovado", color: "text-emerald-500", icon: CheckCircle2 },
  CLOSED_NOT_FOUND: { label: "Não encontrado", color: "text-muted-foreground", icon: XCircle },
  CLOSED_CANCELLED: { label: "Cancelado", color: "text-destructive", icon: XCircle },
};

function getStepIndex(status: SearchStatus): number {
  const idx = CURATION_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? CURATION_STEPS.length : idx;
}

/* ── Props ── */

interface CurationProgressTrackerProps {
  searchId: string;
  /** Pre-loaded status; if provided, used as initial value before realtime kicks in */
  initialStatus?: SearchStatus;
  /** Pre-loaded progress message */
  initialProgressMessage?: string | null;
  /** Pre-loaded progress percentage (0-100) */
  initialProgressPercentage?: number | null;
}

/* ── Component ── */

export function CurationProgressTracker({
  searchId,
  initialStatus = "RECEIVED",
  initialProgressMessage,
  initialProgressPercentage,
}: CurationProgressTrackerProps) {
  const [status, setStatus] = useState<SearchStatus>(initialStatus);
  const [progressMessage, setProgressMessage] = useState(initialProgressMessage ?? null);
  const [progressPct, setProgressPct] = useState(initialProgressPercentage ?? null);
  const [connected, setConnected] = useState(false);

  const isClosed = status.startsWith("CLOSED_");
  const currentIdx = getStepIndex(status);
  const barPct = isClosed ? 100 : ((currentIdx + 1) / CURATION_STEPS.length) * 100;

  /* ── Realtime subscription ── */
  useEffect(() => {
    if (!searchId) return;

    const channel = supabase
      .channel(`curation-${searchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vault_searches",
          filter: `id=eq.${searchId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.status) setStatus(row.status as SearchStatus);
          if (row.progress_message !== undefined) setProgressMessage(row.progress_message as string | null);
          if (row.progress_percentage !== undefined) setProgressPct(row.progress_percentage as number | null);
        }
      )
      .subscribe((st) => {
        setConnected(st === "SUBSCRIBED");
      });

    // Polling fallback every 15s
    const poll = async () => {
      const { data } = await supabase
        .from("vault_searches")
        .select("status, progress_message, progress_percentage")
        .eq("id", searchId)
        .single();
      if (data) {
        setStatus(data.status);
        setProgressMessage(data.progress_message);
        setProgressPct(data.progress_percentage);
      }
    };
    const interval = setInterval(poll, 15_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [searchId]);

  /* ── Render ── */
  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso da curadoria</span>
          <div className="flex items-center gap-2">
            {connected && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </span>
            )}
            <span className="font-semibold text-primary">{Math.round(progressPct ?? barPct)}%</span>
          </div>
        </div>
        <Progress value={progressPct ?? barPct} className="h-2" />
        {progressMessage && (
          <p className="text-xs text-muted-foreground italic">{progressMessage}</p>
        )}
      </div>

      {/* Vertical stepper (mobile-first) */}
      <div className="relative pl-8 space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-border" />
        <motion.div
          className="absolute left-[15px] top-3 w-0.5 bg-primary origin-top"
          initial={{ height: 0 }}
          animate={{ height: `${barPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {CURATION_STEPS.map((step, i) => {
          const isCompleted = i < currentIdx || isClosed;
          const isActive = i === currentIdx && !isClosed;
          const isPending = i > currentIdx && !isClosed;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative flex items-start gap-3 pb-6 last:pb-0">
              {/* Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
                className={cn(
                  "absolute -left-8 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground ring-4 ring-primary/25",
                  isPending && "bg-secondary border-2 border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" />
                )}
              </motion.div>

              {/* Content */}
              <div className="min-w-0 pt-1">
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isActive && "text-primary",
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {(isActive || isCompleted) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-muted-foreground mt-0.5 leading-relaxed"
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}

        {/* Closed state */}
        {isClosed && CLOSED_LABELS[status] && (() => {
          const closed = CLOSED_LABELS[status];
          const ClosedIcon = closed.icon;
          return (
            <div className="relative flex items-start gap-3 pt-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute -left-8 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary border-2",
                  status === "CLOSED_APPROVED" ? "border-emerald-500 text-emerald-500" : "border-border text-muted-foreground"
                )}
              >
                <ClosedIcon className="h-4 w-4" />
              </motion.div>
              <p className={cn("text-sm font-bold pt-1", closed.color)}>
                {closed.label}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Current step highlight */}
      {!isClosed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">
              {CURATION_STEPS[currentIdx]?.label || status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Etapa {currentIdx + 1} de {CURATION_STEPS.length}
          </p>
        </motion.div>
      )}
    </div>
  );
}
