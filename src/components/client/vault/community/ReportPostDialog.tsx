import { useState } from "react";
import { Flag, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  clientCpf: string;
}

const reportReasons = [
  { value: "spam", label: "Spam ou propaganda", description: "Conteúdo promocional não solicitado" },
  { value: "inappropriate", label: "Conteúdo impróprio", description: "Linguagem ofensiva, nudez ou violência" },
  { value: "harassment", label: "Assédio ou bullying", description: "Ataques pessoais ou intimidação" },
  { value: "fake", label: "Informação falsa", description: "Desinformação ou conteúdo enganoso" },
  { value: "counterfeit", label: "Produto falsificado", description: "Promoção de itens não autênticos" },
  { value: "other", label: "Outro motivo", description: "Especifique nos detalhes" },
];

export function ReportPostDialog({ 
  open, 
  onOpenChange, 
  postId, 
  postTitle,
  clientCpf 
}: ReportPostDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Selecione um motivo",
        description: "Por favor, escolha o motivo da denúncia",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("report_community_post", {
        p_cpf: clientCpf,
        p_post_id: postId,
        p_reason: selectedReason,
        p_details: details.trim() || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        if (result.error?.includes("already reported")) {
          toast({
            title: "Já denunciado",
            description: "Você já reportou esta publicação anteriormente",
            variant: "destructive",
          });
        } else {
          throw new Error(result.error || "Erro ao denunciar");
        }
        return;
      }

      toast({
        title: "Denúncia enviada",
        description: "Nossa equipe irá analisar o conteúdo. Obrigado por ajudar!",
      });

      // Send report email to admins
      try {
        const { sendMarketplaceEmail } = await import("@/lib/marketplace-email-notifications");
        const { data: reporter } = await supabase
          .from("vault_members")
          .select("client_name")
          .eq("client_cpf", clientCpf)
          .maybeSingle();
        sendMarketplaceEmail({
          type: "community_post_reported",
          recipient_name: "Admin Bravenza",
          recipient_email: "admin@bravenza.com.br",
          post_title: postTitle || "Post da comunidade",
          report_reason: selectedReason,
          reporter_name: reporter?.client_name || "Membro",
        });
      } catch (_) {}

      // Reset and close
      setSelectedReason("");
      setDetails("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error reporting post:", error);
      toast({
        title: "Erro ao denunciar",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="h-5 w-5" />
            Denunciar publicação
          </DialogTitle>
          <DialogDescription>
            Ajude a manter a comunidade segura reportando conteúdo inadequado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Post being reported */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Publicação:</p>
            <p className="font-medium text-sm truncate">{postTitle}</p>
          </div>

          {/* Reason selection */}
          <div className="space-y-3">
            <Label>Por que você está denunciando?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {reportReasons.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={reason.value} className="font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional details */}
          <div className="space-y-2">
            <Label htmlFor="details">Detalhes adicionais (opcional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Forneça mais informações para ajudar na análise..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{details.length}/500</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Denúncias falsas ou abusivas podem resultar em suspensão da sua conta.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Denunciar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
