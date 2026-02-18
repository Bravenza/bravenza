import { ShieldCheck, Package, Search, CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: ShieldCheck,
    title: "Compra segura",
    description: "Pagamento protegido — só é liberado após confirmação.",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Package,
    title: "Envio ao Hub",
    description: "O vendedor envia para nosso centro de inspeção.",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Search,
    title: "Inspeção técnica",
    description: "Verificamos autenticidade, condição e conformidade.",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: CheckCircle2,
    title: "Aprovado e enviado",
    description: "Produto aprovado é enviado com selo de autenticidade.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: RefreshCw,
    title: "Garantia 7 dias",
    description: "Não ficou satisfeito? Devolva e receba seu dinheiro.",
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

export function ProtectedPurchaseSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-base font-bold text-foreground tracking-tight">
            Compra Protegida Bravenza
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Clock className="h-2.5 w-2.5" />
          Garantia de 7 dias úteis
        </span>
      </div>

      {/* Horizontal step cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center text-center p-4 rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm group hover:border-border/40 transition-all"
          >
            {/* Step number */}
            <span className="absolute top-2 left-2.5 text-[9px] font-bold text-muted-foreground/40">
              {index + 1}
            </span>

            {/* Connector arrow (hidden on first and on mobile for cleanliness) */}
            {index > 0 && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-muted-foreground/20 hidden lg:block">
                →
              </div>
            )}

            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl mb-3 transition-transform group-hover:scale-110",
                step.bg
              )}
            >
              <step.icon className={cn("h-5 w-5", step.accent)} />
            </div>
            <h4 className="text-xs font-bold text-foreground leading-tight">{step.title}</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom trust reinforcement */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Todas as transações são intermediadas pela Bravenza. Seu dinheiro só é liberado ao vendedor após você receber e aprovar o produto.
        </p>
      </div>
    </div>
  );
}
