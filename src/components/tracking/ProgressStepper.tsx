import { Check, Clock, Package } from "lucide-react";
import { motion } from "framer-motion";
import {
  ORDER_STATUS_LABELS,
  getStatusesForType,
  isStatusCompleted,
  isStatusActive,
  OrderType,
  getStatusIndex,
} from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressStepperProps {
  currentStatus: string;
  orderType: OrderType;
  history?: { status: string; notes: string | null; history_timestamp: string }[];
}

export const ProgressStepper = ({
  currentStatus,
  orderType,
  history = [],
}: ProgressStepperProps) => {
  const statuses = getStatusesForType(orderType);
  const currentIndex = getStatusIndex(currentStatus, orderType);
  const progressPercentage = ((currentIndex + 1) / statuses.length) * 100;

  const getStatusTime = (status: string): string | null => {
    const historyItem = history.find((h) => h.status === status);
    if (historyItem) {
      return new Date(historyItem.history_timestamp).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  // Show condensed version for mobile: first 2, current, and last 2
  const getVisibleStatuses = () => {
    if (statuses.length <= 5) return statuses.map((s, i) => ({ status: s, index: i }));
    
    const indices = new Set<number>();
    indices.add(0); // First
    indices.add(1); // Second
    if (currentIndex > 1 && currentIndex < statuses.length - 2) {
      indices.add(currentIndex); // Current
    }
    indices.add(statuses.length - 2); // Second to last
    indices.add(statuses.length - 1); // Last
    
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((i) => ({ status: statuses[i], index: i }));
  };

  const visibleStatuses = getVisibleStatuses();

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso do pedido</span>
          <span className="font-semibold text-primary">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Stepper visual */}
      <div className="relative pt-4">
        {/* Connection line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />
        <div
          className="absolute top-8 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {visibleStatuses.map(({ status, index }, i) => {
            const isCompleted = isStatusCompleted(currentStatus, status, orderType);
            const isActive = isStatusActive(currentStatus, status);
            const isPending = !isCompleted && !isActive;
            const statusTime = getStatusTime(status);
            const showGap = i > 0 && visibleStatuses[i - 1].index < index - 1;

            return (
              <div key={status} className="flex flex-col items-center relative">
                {/* Gap indicator */}
                {showGap && (
                  <div className="absolute -left-4 top-4 text-muted-foreground text-xs">
                    •••
                  </div>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                          : "bg-secondary border-2 border-border text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : isActive ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-card border-border text-foreground"
                  >
                    <div className="text-center">
                      <p className="font-medium">
                        {ORDER_STATUS_LABELS[status] || status}
                      </p>
                      {statusTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {statusTime}
                        </p>
                      )}
                      {isActive && (
                        <p className="text-xs text-primary mt-1">Status atual</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Label (only for key steps) */}
                <span
                  className={`mt-2 text-[10px] text-center max-w-[60px] leading-tight ${
                    isActive
                      ? "text-primary font-semibold"
                      : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {index === 0
                    ? "Início"
                    : index === statuses.length - 1
                    ? "Entregue"
                    : ORDER_STATUS_LABELS[status]?.split(" ")[0] || status.slice(0, 6)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step highlight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {ORDER_STATUS_LABELS[currentStatus] || currentStatus}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Etapa {currentIndex + 1} de {statuses.length}
        </p>
      </motion.div>
    </div>
  );
};
