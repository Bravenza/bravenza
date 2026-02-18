import { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
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

const disputeReasons = [
  { value: "wrong_item", label: "Recebi o item errado" },
  { value: "not_as_described", label: "Item diferente do anunciado" },
  { value: "damaged", label: "Item danificado no transporte" },
  { value: "fake", label: "Suspeita de produto falso" },
  { value: "not_received", label: "Não recebi o produto" },
  { value: "other", label: "Outro motivo" },
];

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub`;

interface DisputeDialogProps {
  orderId: string;
  clientCpf: string;
  protectionEndsAt: string | null;
  onSuccess: () => void;
}

export function DisputeDialog({ orderId, clientCpf, protectionEndsAt, onSuccess }: DisputeDialogProps) {
  const [open, setOpen] = useState(false);
  const [reasonType, setReasonType] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const isExpired = protectionEndsAt ? new Date(protectionEndsAt) < new Date() : false;

  const handleSubmit = async () => {
    if (!reasonType || !details.trim()) return;
    setLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const reasonLabel = disputeReasons.find((r) => r.value === reasonType)?.label || reasonType;
      const res = await fetch(`${FUNCTION_URL}?action=open-dispute`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          order_id: orderId,
          reason: `${reasonLabel}: ${details}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao abrir disputa");
      }

      setOpen(false);
      setReasonType("");
      setDetails("");
      onSuccess();
    } catch (err: any) {
      console.error("Dispute error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive border-destructive/30">
          <ShieldAlert className="h-3 w-3" />
          Abrir disputa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Abrir disputa
          </DialogTitle>
          <DialogDescription>
            Descreva o problema com seu pedido. Nossa equipe irá mediar a resolução.
          </DialogDescription>
        </DialogHeader>

        {isExpired ? (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
            <p className="font-medium text-destructive">Período de proteção expirado</p>
            <p className="text-muted-foreground mt-1">
              O prazo de 7 dias úteis para abertura de disputas já encerrou.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo</label>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {disputeReasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Detalhes</label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Descreva o problema com o máximo de detalhes..."
                rows={4}
              />
            </div>

            {protectionEndsAt && (
              <p className="text-xs text-muted-foreground">
                🛡️ Proteção válida até {new Date(protectionEndsAt).toLocaleDateString("pt-BR")}
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !reasonType || !details.trim()}
              className="w-full"
              variant="destructive"
            >
              {loading ? "Enviando..." : "Confirmar disputa"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
