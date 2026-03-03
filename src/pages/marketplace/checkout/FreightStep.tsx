import { ArrowLeft, ChevronRight, Truck, ShieldCheck, Package, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmt, type FreightOption } from "./types";

interface FreightStepProps {
  isLoading: boolean;
  error: string | null;
  options: FreightOption[];
  selected: FreightOption | null;
  onSelect: (opt: FreightOption) => void;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function FreightStep({ isLoading, error, options, selected, onSelect, onRetry, onBack, onNext }: FreightStepProps) {
  return (
    <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-base">Escolha a modalidade de entrega</h2>
      </div>

      <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 text-primary font-semibold text-sm mb-1">
          <ShieldCheck className="h-4 w-4" />
          Compra PRO — Autenticação garantida
        </div>
        <p>Seu item passa primeiro pelo HUB Bravenza para receber uma certificação de autenticidade antes de ser enviado a você.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Calculando opções de frete...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive/60" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const sorted = [...options].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            const cheapestId = sorted[0]?.id;
            const fastestId = sorted.length > 1
              ? sorted.reduce((f, o) => o.delivery_time < f.delivery_time ? o : f, sorted[0]).id
              : null;

            return options.map(opt => {
              const isPac = /pac/i.test(opt.name || opt.company?.name || "");
              const isSedex = /sedex|expresso/i.test(opt.name || opt.company?.name || "");
              const minDays = isSedex ? 3 : isPac ? 11 : Math.max(1, opt.delivery_time - 7);
              const maxDays = isSedex ? 17 : isPac ? 24 : opt.delivery_time;
              const isCheapest = opt.id === cheapestId;
              const isFastest = opt.id === fastestId && fastestId !== cheapestId;

              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all relative",
                    selected?.id === opt.id
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                      : "border-border/30 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isCheapest && (
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] px-2 py-0 h-5">
                        Mais econômico
                      </Badge>
                    )}
                    {isFastest && (
                      <Badge className="bg-sky-500/15 text-sky-500 border-sky-500/30 text-[10px] px-2 py-0 h-5">
                        Mais rápido
                      </Badge>
                    )}
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0 h-5 gap-0.5">
                      <ShieldCheck className="h-2.5 w-2.5" /> PRO
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{opt.name || opt.company?.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Passa pelo HUB para certificação de autenticidade
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {minDays === maxDays
                            ? `${maxDays} dias úteis`
                            : `${minDays} a ${maxDays} dias úteis`
                          }
                        </span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-base font-bold whitespace-nowrap",
                      selected?.id === opt.id ? "text-primary" : "text-foreground"
                    )}>
                      R$ {fmt(parseFloat(opt.price))}
                    </p>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 btn-gold gap-2 h-12 text-sm font-bold rounded-xl"
          size="lg"
        >
          Continuar para pagamento
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
