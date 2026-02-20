import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, ShieldAlert, Upload, Camera, MessageSquare, 
  CheckCircle, Clock, FileText, ChevronRight, X, Image as ImageIcon 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const disputeReasons = [
  { value: "wrong_item", label: "Recebi o item errado", icon: "📦", severity: "high" },
  { value: "not_as_described", label: "Item diferente do anunciado", icon: "🔍", severity: "medium" },
  { value: "damaged", label: "Item danificado no transporte", icon: "💥", severity: "high" },
  { value: "fake", label: "Suspeita de produto falso", icon: "🚫", severity: "critical" },
  { value: "not_received", label: "Não recebi o produto", icon: "❌", severity: "high" },
  { value: "other", label: "Outro motivo", icon: "💬", severity: "low" },
];

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub`;

interface DisputeDialogProps {
  orderId: string;
  clientCpf: string;
  protectionEndsAt: string | null;
  onSuccess: () => void;
}

type Step = "reason" | "evidence" | "details" | "review";

const STEPS: Step[] = ["reason", "evidence", "details", "review"];

export function DisputeDialog({ orderId, clientCpf, protectionEndsAt, onSuccess }: DisputeDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("reason");
  const [reasonType, setReasonType] = useState("");
  const [details, setDetails] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExpired = protectionEndsAt ? new Date(protectionEndsAt) < new Date() : false;
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const selectedReason = disputeReasons.find(r => r.value === reasonType);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEvidencePhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setEvidencePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reasonType || !details.trim()) return;
    setLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const reasonLabel = selectedReason?.label || reasonType;
      const res = await fetch(`${FUNCTION_URL}?action=open-dispute`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          order_id: orderId,
          reason: `${reasonLabel}: ${details}`,
          evidence_count: evidencePhotos.length,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao abrir disputa");
      }

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
        onSuccess();
      }, 2500);
    } catch (err: any) {
      console.error("Dispute error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("reason");
    setReasonType("");
    setDetails("");
    setEvidencePhotos([]);
    setSubmitted(false);
  };

  const canProceed = () => {
    switch (step) {
      case "reason": return !!reasonType;
      case "evidence": return true; // optional
      case "details": return details.trim().length >= 10;
      case "review": return true;
    }
  };

  const nextStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const prevStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive border-destructive/30">
          <ShieldAlert className="h-3 w-3" />
          Abrir disputa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Abrir disputa
          </DialogTitle>
          <DialogDescription>
            Siga os passos para registrar seu problema. Nossa equipe mediará a resolução.
          </DialogDescription>
        </DialogHeader>

        {isExpired ? (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
            <p className="font-medium text-destructive">Período de proteção expirado</p>
            <p className="text-muted-foreground mt-1">
              O prazo de 7 dias úteis para abertura de disputas já encerrou.
            </p>
          </div>
        ) : submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <CheckCircle className="h-16 w-16 mx-auto text-emerald-500" />
            </motion.div>
            <h3 className="text-lg font-bold">Disputa registrada</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Sua disputa foi aberta com sucesso. Nossa equipe entrará em contato em até 24h.
            </p>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Clock className="h-3 w-3 mr-1" /> Prazo: 24h para primeira resposta
            </Badge>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Passo {stepIndex + 1} de {STEPS.length}</span>
                <span>{["Motivo", "Evidências", "Detalhes", "Revisão"][stepIndex]}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Reason */}
                {step === "reason" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Qual o problema?</label>
                    <div className="grid grid-cols-1 gap-2">
                      {disputeReasons.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setReasonType(r.value)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            reasonType === r.value
                              ? "border-destructive/50 bg-destructive/5 shadow-sm"
                              : "border-border/50 hover:border-border"
                          }`}
                        >
                          <span className="text-lg">{r.icon}</span>
                          <span className="text-sm font-medium flex-1">{r.label}</span>
                          {r.severity === "critical" && (
                            <Badge variant="destructive" className="text-[9px]">Urgente</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Evidence */}
                {step === "evidence" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Adicione evidências (opcional)</label>
                    <p className="text-xs text-muted-foreground">Fotos ajudam a acelerar a resolução da disputa.</p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    
                    <div className="grid grid-cols-3 gap-2">
                      {evidencePhotos.map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                          <img src={photo} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/90 flex items-center justify-center"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {evidencePhotos.length < 5 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                        >
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Adicionar</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{evidencePhotos.length}/5 fotos</p>
                  </div>
                )}

                {/* Step 3: Details */}
                {step === "details" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Descreva o problema</label>
                    <Textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Explique com detalhes o que aconteceu. Quanto mais informação, mais rápido resolvemos..."
                      rows={5}
                      className="resize-none"
                    />
                    <p className={`text-[10px] ${details.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                      Mínimo 10 caracteres ({details.length}/10)
                    </p>
                  </div>
                )}

                {/* Step 4: Review */}
                {step === "review" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold">Confirme os dados da disputa</h4>
                    <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Motivo</span>
                        <span className="text-xs font-medium flex items-center gap-1">
                          {selectedReason?.icon} {selectedReason?.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Evidências</span>
                        <span className="text-xs font-medium">{evidencePhotos.length} foto(s)</span>
                      </div>
                      <div className="border-t border-border/30 pt-2 mt-2">
                        <span className="text-xs text-muted-foreground">Descrição</span>
                        <p className="text-xs mt-1">{details}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium">Mediação Bravenza</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Sua disputa será mediada pela equipe Bravenza. Prazo de resposta: 24h. 
                            O valor ficará retido até a resolução.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Protection info */}
            {protectionEndsAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                🛡️ Proteção válida até {new Date(protectionEndsAt).toLocaleDateString("pt-BR")}
              </p>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep} className="text-xs">
                  Voltar
                </Button>
              )}
              <div className="flex-1" />
              {step === "review" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                >
                  {loading ? "Enviando..." : "Confirmar disputa"}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  size="sm"
                  className="gap-1"
                >
                  Próximo <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
