import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { differenceInBusinessDays, differenceInHours, addBusinessDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContestationBannerProps {
  deliveredAt: string | null;
  protectionEndsAt: string | null;
  status: string;
  disputeStatus: string | null;
  onOpenDispute: () => void;
}

export function ContestationBanner({
  deliveredAt,
  protectionEndsAt,
  status,
  disputeStatus,
  onOpenDispute,
}: ContestationBannerProps) {
  if (!deliveredAt || status === "cancelled") return null;

  const now = new Date();
  const delivered = new Date(deliveredAt);
  const protectionEnd = protectionEndsAt
    ? new Date(protectionEndsAt)
    : addBusinessDays(delivered, 7);

  const isExpired = now > protectionEnd;
  const hoursLeft = differenceInHours(protectionEnd, now);
  const daysLeft = Math.ceil(hoursLeft / 24);

  // Already has dispute open
  if (disputeStatus === "open") {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Disputa em análise</p>
          <p className="text-xs text-muted-foreground">
            Nossa equipe está avaliando seu caso. Fique tranquilo.
          </p>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
          Em análise
        </Badge>
      </div>
    );
  }

  if (disputeStatus === "resolved_buyer" || disputeStatus === "resolved_seller") {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-xl">
        <ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Disputa resolvida</p>
          <p className="text-xs text-muted-foreground">
            {disputeStatus === "resolved_buyer"
              ? "Resolvida a favor do comprador."
              : "Resolvida a favor do vendedor."}
          </p>
        </div>
      </div>
    );
  }

  // Protection expired — payout eligible
  if (isExpired) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Proteção encerrada</p>
          <p className="text-xs text-muted-foreground">
            Período de proteção de 7 dias úteis concluído. Pagamento liberado ao vendedor em até 8 dias úteis.
          </p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
          Concluído
        </Badge>
      </div>
    );
  }

  // Active protection window
  const isUrgent = hoursLeft <= 48;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border",
        isUrgent
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-primary/5 border-primary/20"
      )}
    >
      <Clock
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isUrgent ? "text-amber-400" : "text-primary"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Proteção do comprador</p>
        <p className="text-xs text-muted-foreground">
          {daysLeft > 1
            ? `${daysLeft} dias restantes`
            : `${hoursLeft}h restantes`}{" "}
          — até {format(protectionEnd, "dd/MM", { locale: ptBR })}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className={cn(
          "text-xs h-7 gap-1",
          isUrgent ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : ""
        )}
        onClick={onOpenDispute}
      >
        <AlertTriangle className="h-3 w-3" />
        Abrir disputa
      </Button>
    </div>
  );
}
