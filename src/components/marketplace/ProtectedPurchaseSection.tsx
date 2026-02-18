import { ShieldCheck, Package, Search, CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: ShieldCheck,
    title: "Compra segura",
    description: "Pagamento protegido — seu dinheiro só é liberado após confirmação.",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Package,
    title: "Envio ao Hub",
    description: "O vendedor envia o produto para nosso centro de inspeção.",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Search,
    title: "Inspeção técnica",
    description: "Verificamos autenticidade, condição e conformidade com o anúncio.",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: CheckCircle2,
    title: "Aprovado e enviado",
    description: "Produto aprovado é enviado para você com selo de autenticidade.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: RefreshCw,
    title: "Garantia de 7 dias úteis",
    description: "Não ficou satisfeito? Devolva e receba seu dinheiro de volta.",
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

export function ProtectedPurchaseSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-base font-bold text-foreground tracking-tight">
          Compra Protegida Bravenza
        </h3>
      </div>

      <div className="relative">
        {/* Timeline connector line */}
        <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-primary/40 via-border/40 to-violet-500/40 hidden sm:block" />

        <div className="grid gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 group"
            >
              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110",
                  step.bg
                )}
              >
                <step.icon className={cn("h-5 w-5", step.accent)} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                  {index === steps.length - 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Clock className="h-2.5 w-2.5" />
                      7 dias úteis
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
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
