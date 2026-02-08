import { AlertTriangle, Shield, Clock, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VaultPolicyCardProps {
  compact?: boolean;
}

export const VaultPolicyCard = ({ compact = false }: VaultPolicyCardProps) => {
  if (compact) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-primary">Política VAULT (Encomenda)</h4>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Troca/reembolso somente por defeito no produto</li>
              <li>• Tamanho não é trocável/reembolsável</li>
              <li>• Prazo para suporte: até 7 dias úteis após recebimento</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-primary">Política de Trocas e Garantia - VAULT</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <RefreshCcw className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Troca/Reembolso</p>
            <p className="text-xs text-muted-foreground">
              Somente por defeito ou problema no produto
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Tamanho</p>
            <p className="text-xs text-muted-foreground">
              Não é trocável ou reembolsável
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Prazo para Suporte</p>
            <p className="text-xs text-muted-foreground">
              Até 7 dias úteis após o recebimento do produto
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground italic">
            Ao aprovar o orçamento, o cliente concorda com estas políticas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
