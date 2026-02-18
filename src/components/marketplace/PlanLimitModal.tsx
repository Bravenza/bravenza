import { useNavigate } from "react-router-dom";
import { AlertTriangle, Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PlanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "active_limit" | "monthly_limit" | string | null;
  currentPlan?: string;
}

const messages: Record<string, { title: string; desc: string }> = {
  active_limit: {
    title: "Limite de anúncios ativos",
    desc: "Você atingiu o limite de anúncios ativos do seu plano. Faça upgrade para anunciar mais.",
  },
  monthly_limit: {
    title: "Limite mensal de novos anúncios",
    desc: "Você atingiu o limite de novos anúncios do mês. Faça upgrade para continuar.",
  },
};

export function PlanLimitModal({ open, onOpenChange, reason, currentPlan }: PlanLimitModalProps) {
  const navigate = useNavigate();
  const msg = messages[reason || ""] || messages.active_limit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <DialogTitle className="text-lg">{msg.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm">{msg.desc}</DialogDescription>
        </DialogHeader>

        <div className="pt-4 space-y-3">
          <Button
            className="w-full btn-gold gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate("/marketplace/planos");
            }}
          >
            <Rocket className="h-4 w-4" />
            Ver planos e fazer upgrade
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
