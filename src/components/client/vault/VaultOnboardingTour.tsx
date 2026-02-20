import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Box, Users, Store, Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bvz_vault_tour_done";

const steps = [
  {
    icon: Search,
    title: "Wishlist & Busca",
    description: "Adicione os sneakers que deseja e nossa equipe cuida da curadoria para encontrar a melhor opção.",
    tab: "wishlist",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Box,
    title: "Sua Coleção",
    description: "Todos os seus sneakers verificados ficam aqui, com Vault ID único e certificado de autenticidade.",
    tab: "vault",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Sparkles,
    title: "Drops & Conteúdos",
    description: "Fique por dentro de lançamentos, guias e conteúdos exclusivos para membros do clube.",
    tab: "drops",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Conecte-se com outros colecionadores, compartilhe sua coleção e participe de discussões.",
    tab: "comunidade",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Store,
    title: "Marketplace",
    description: "Compre e venda sneakers autenticados diretamente com outros membros do clube.",
    tab: "marketplace",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

interface VaultOnboardingTourProps {
  onNavigate?: (tab: string) => void;
}

export const VaultOnboardingTour = memo(function VaultOnboardingTour({ onNavigate }: VaultOnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismiss();
    }
  };

  const goToStep = (index: number) => {
    const step = steps[index];
    if (onNavigate && step.tab) {
      onNavigate(step.tab);
    }
    dismiss();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={dismiss}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Bem-vindo ao Vault Club!</span>
            </div>
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Step content */}
          <div className="p-6 text-center space-y-4">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mx-auto mb-4`}>
                <step.icon className={`h-7 w-7 ${step.color}`} />
              </div>
              <h3 className="text-base font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          </div>

          {/* Progress & actions */}
          <div className="p-4 border-t border-border/30 space-y-3">
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToStep(currentStep)}
                className="flex-1 text-xs"
              >
                Ir para {step.title}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
              <Button
                size="sm"
                onClick={next}
                className="flex-1 text-xs"
              >
                {currentStep < steps.length - 1 ? (
                  <>Próximo <ArrowRight className="h-3 w-3 ml-1" /></>
                ) : (
                  "Começar!"
                )}
              </Button>
            </div>

            <button
              onClick={dismiss}
              className="w-full text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Pular tour
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
