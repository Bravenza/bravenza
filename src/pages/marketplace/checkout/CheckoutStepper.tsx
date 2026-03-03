import { motion } from "framer-motion";
import { ShoppingCart, MapPin, Truck, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "./types";

const STEPS: { key: Step; label: string; icon: typeof ShoppingCart }[] = [
  { key: "review", label: "Resumo", icon: ShoppingCart },
  { key: "address", label: "Endereço", icon: MapPin },
  { key: "freight", label: "Frete", icon: Truck },
  { key: "payment", label: "Pagamento", icon: CreditCard },
];

interface CheckoutStepperProps {
  currentStep: Step;
}

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  if (currentStep === "processing" || currentStep === "success") return null;

  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => {
        const isActive = s.key === currentStep;
        const isPast = currentStepIndex > i;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-1.5 flex-1">
            <motion.div
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-xl text-xs font-bold transition-all duration-300 shrink-0",
                isActive ? "bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)]" :
                isPast ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              )}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </motion.div>
            <span className={cn(
              "text-xs font-medium hidden sm:inline",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 rounded-full mx-1 transition-colors",
                isPast ? "bg-primary/30" : "bg-border/30"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
