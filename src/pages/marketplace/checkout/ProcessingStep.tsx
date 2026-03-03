import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessingStepProps {
  error: string | null;
  itemsCount: number;
  onRetry: () => void;
}

export function ProcessingStep({ error, itemsCount, onRetry }: ProcessingStepProps) {
  return (
    <div className="bg-background rounded-2xl border border-border/20 p-8 flex flex-col items-center text-center">
      {error ? (
        <>
          <AlertCircle className="h-12 w-12 text-destructive/60 mb-4" />
          <h2 className="font-bold text-lg mb-1">Erro no pagamento</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="font-bold text-lg mb-1">Processando pagamento</h2>
          <p className="text-sm text-muted-foreground">
            {itemsCount} {itemsCount === 1 ? "item" : "itens"} sendo processado{itemsCount !== 1 ? "s" : ""}...
          </p>
        </>
      )}
    </div>
  );
}
