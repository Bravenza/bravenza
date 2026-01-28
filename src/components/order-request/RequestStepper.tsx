import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Step {
  id: number;
  label: string;
  icon: React.ReactNode;
}

interface RequestStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const RequestStepper = ({
  steps,
  currentStep,
  onStepClick,
}: RequestStepperProps) => {
  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isFuture = step.id > currentStep;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <button
                onClick={() => isCompleted && onStepClick?.(step.id)}
                disabled={!isCompleted}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all w-full",
                  isCompleted && "cursor-pointer hover:opacity-80",
                  !isCompleted && "cursor-default"
                )}
              >
                <div className="flex items-center w-full">
                  {/* Line before */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 transition-colors duration-300",
                        isCompleted || isActive ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}

                  {/* Circle */}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={cn(
                      "relative w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all shrink-0",
                      isCompleted && "bg-primary text-primary-foreground",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                      isFuture && "bg-muted text-muted-foreground border-2 border-border"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="flex items-center justify-center">
                        {step.icon}
                      </span>
                    )}
                  </motion.div>

                  {/* Line after */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 transition-colors duration-300",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium text-center leading-tight",
                    isActive && "text-primary",
                    isCompleted && "text-foreground",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            Etapa {currentStep} de {steps.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="bg-primary h-2 rounded-full"
          />
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && onStepClick?.(step.id)}
              disabled={step.id >= currentStep}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                step.id === currentStep && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                step.id < currentStep && "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
                step.id > currentStep && "bg-muted text-muted-foreground"
              )}
            >
              {step.id < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
