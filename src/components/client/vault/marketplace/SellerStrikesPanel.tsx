import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Clock, MessageSquare, CheckCircle2, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface Strike {
  id: string;
  strike_type: string;
  severity: string;
  reason: string;
  is_active: boolean;
  appeal_status: string | null;
  appeal_message: string | null;
  suspension_starts_at: string | null;
  suspension_ends_at: string | null;
  created_at: string;
}

interface StrikesData {
  strikes: Strike[];
  active_count: number;
  suspended_until: string | null;
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  warning: { color: "text-warning", label: "Aviso", bg: "bg-warning/10 border-warning/20" },
  minor: { color: "text-amber-500", label: "Suspensão 7d", bg: "bg-amber-500/10 border-amber-500/20" },
  major: { color: "text-destructive", label: "Suspensão 30d", bg: "bg-destructive/10 border-destructive/20" },
  critical: { color: "text-destructive", label: "Banimento", bg: "bg-destructive/10 border-destructive/20" },
};

const STRIKE_TYPE_LABELS: Record<string, string> = {
  cancellation: "Cancelamento de venda",
  fake_item: "Item não autêntico",
  late_shipping: "Atraso no envio",
  policy_violation: "Violação de política",
  buyer_complaint: "Reclamação de comprador",
};

interface SellerStrikesPanelProps {
  clientCpf: string;
  sellerId: string;
}

export function SellerStrikesPanel({ clientCpf, sellerId }: SellerStrikesPanelProps) {
  const { toast } = useToast();
  const [data, setData] = useState<StrikesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appealText, setAppealText] = useState("");
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStrikes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await marketplaceRequest(clientCpf, "my-strikes");
      setData(res);
    } catch (err) {
      console.error("Strikes fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientCpf]);

  useEffect(() => { fetchStrikes(); }, [fetchStrikes]);

  const handleAppeal = async (strikeId: string) => {
    if (!appealText.trim()) return;
    setSubmitting(true);
    try {
      await marketplaceRequest(clientCpf, "appeal-strike", "POST", {
        strike_id: strikeId,
        message: appealText.trim(),
      });
      toast({ title: "Recurso enviado!", description: "Nossa equipe analisará seu pedido em até 48h." });
      setAppealingId(null);
      setAppealText("");
      fetchStrikes();
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const strikes = data?.strikes ?? [];
  const activeCount = data?.active_count ?? 0;
  const suspendedUntil = data?.suspended_until;
  const maxStrikes = 3;
  const progressPercent = Math.min((activeCount / maxStrikes) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`card-premium ${suspendedUntil ? "border-destructive/30" : activeCount > 0 ? "border-warning/30" : "border-emerald-500/30"}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              {suspendedUntil ? (
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              ) : activeCount > 0 ? (
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">
                  {suspendedUntil
                    ? `Conta suspensa até ${formatDate(suspendedUntil)}`
                    : activeCount === 0
                      ? "Nenhum aviso ativo"
                      : `${activeCount} aviso${activeCount > 1 ? "s" : ""} ativo${activeCount > 1 ? "s" : ""}`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeCount === 0
                    ? "Sua conta está em boa situação"
                    : `${maxStrikes - activeCount} aviso${maxStrikes - activeCount !== 1 ? "s" : ""} restante${maxStrikes - activeCount !== 1 ? "s" : ""} antes de suspensão`
                  }
                </p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">0</span>
              <span className="text-[10px] text-muted-foreground">{maxStrikes} avisos = suspensão</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Como funciona:</strong> O sistema de avisos protege a comunidade.</p>
              <p>• 1º aviso: notificação + orientação</p>
              <p>• 2º aviso: suspensão de 7 dias</p>
              <p>• 3º aviso: suspensão de 30 dias</p>
              <p>Você pode recorrer de qualquer aviso com justificativa.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strikes List */}
      {strikes.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-10 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum aviso registrado</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Continue vendendo com excelência!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {strikes.map((strike, i) => {
            const sev = SEVERITY_CONFIG[strike.severity] || SEVERITY_CONFIG.warning;
            return (
              <motion.div
                key={strike.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`card-premium ${sev.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] ${sev.color}`}>
                            {sev.label}
                          </Badge>
                          {!strike.is_active && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Resolvido</Badge>
                          )}
                          {strike.appeal_status === "pending" && (
                            <Badge variant="outline" className="text-[10px] text-blue-500">Recurso em análise</Badge>
                          )}
                          {strike.appeal_status === "accepted" && (
                            <Badge variant="outline" className="text-[10px] text-emerald-500">Recurso aceito</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">
                          {STRIKE_TYPE_LABELS[strike.strike_type] || strike.strike_type}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDate(strike.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{strike.reason}</p>

                    {strike.suspension_starts_at && strike.suspension_ends_at && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 mb-2">
                        <Clock className="h-3 w-3" />
                        Suspensão: {formatDate(strike.suspension_starts_at)} – {formatDate(strike.suspension_ends_at)}
                      </p>
                    )}

                    {/* Appeal button */}
                    {strike.is_active && !strike.appeal_status && (
                      <Dialog open={appealingId === strike.id} onOpenChange={(o) => { if (!o) setAppealingId(null); }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 mt-1"
                            onClick={() => setAppealingId(strike.id)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Recorrer
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-base">Recorrer do aviso</DialogTitle>
                          </DialogHeader>
                          <p className="text-xs text-muted-foreground">
                            Explique por que você acredita que este aviso não é justo. Nossa equipe analisará em até 48h.
                          </p>
                          <Textarea
                            placeholder="Descreva sua justificativa..."
                            value={appealText}
                            onChange={(e) => setAppealText(e.target.value)}
                            rows={4}
                          />
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline" size="sm">Cancelar</Button>
                            </DialogClose>
                            <Button
                              size="sm"
                              disabled={submitting || !appealText.trim()}
                              onClick={() => handleAppeal(strike.id)}
                            >
                              {submitting ? "Enviando..." : "Enviar recurso"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Appeal message shown */}
                    {strike.appeal_message && (
                      <div className="mt-2 p-2 rounded-lg bg-card/50 border border-border/30">
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Seu recurso:</p>
                        <p className="text-xs text-muted-foreground">{strike.appeal_message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
