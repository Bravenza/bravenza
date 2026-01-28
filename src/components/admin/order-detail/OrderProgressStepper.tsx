import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Step {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  hasWarning?: boolean;
  warningMessage?: string;
}

interface OrderProgressStepperProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
}

export const OrderProgressStepper = ({
  steps,
  currentStep,
  onStepClick,
}: OrderProgressStepperProps) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div
              key={step.id}
              className="flex-1 flex items-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onStepClick?.(step.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 transition-all w-full",
                      onStepClick && "cursor-pointer hover:opacity-80",
                      !onStepClick && "cursor-default"
                    )}
                  >
                    <div className="flex items-center w-full">
                      {/* Line before */}
                      {index > 0 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 transition-colors",
                            isPast || isActive ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}

                      {/* Circle */}
                      <div
                        className={cn(
                          "relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all shrink-0",
                          step.isComplete && "bg-primary text-primary-foreground",
                          isActive && !step.isComplete && "bg-primary/20 text-primary ring-4 ring-primary/30",
                          isFuture && !step.isComplete && "bg-muted text-muted-foreground border-2 border-border"
                        )}
                      >
                        {step.isComplete ? (
                          <Check className="h-5 w-5" />
                        ) : step.hasWarning ? (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        ) : (
                          index + 1
                        )}

                        {/* Warning indicator */}
                        {step.hasWarning && !step.isComplete && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full animate-pulse" />
                        )}
                      </div>

                      {/* Line after */}
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 transition-colors",
                            isPast ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "text-xs font-medium text-center max-w-[100px] leading-tight",
                        isActive && "text-primary",
                        step.isComplete && "text-foreground",
                        isFuture && !step.isComplete && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="text-center">
                    <p className="font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    {step.hasWarning && step.warningMessage && (
                      <p className="text-xs text-warning mt-1 font-medium">
                        ⚠️ {step.warningMessage}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Etapa {currentIndex + 1} de {steps.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {steps[currentIndex]?.label}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-1 mt-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                step.id === currentStep && "bg-primary text-primary-foreground",
                step.isComplete && step.id !== currentStep && "bg-primary/20 text-primary",
                !step.isComplete && step.id !== currentStep && "bg-muted text-muted-foreground",
                step.hasWarning && "ring-2 ring-warning"
              )}
            >
              {step.isComplete && <Check className="h-3 w-3 inline mr-1" />}
              {step.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
