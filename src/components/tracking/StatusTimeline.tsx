import { Check, Clock, Package } from "lucide-react";
import { motion } from "framer-motion";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_DESCRIPTIONS,
  getStatusesForType,
  isStatusCompleted,
  isStatusActive,
  OrderType,
} from "@/lib/constants";

interface StatusTimelineProps {
  currentStatus: string;
  orderType: OrderType;
  history?: { status: string; notes: string | null; history_timestamp: string }[];
}

export const StatusTimeline = ({
  currentStatus,
  orderType,
  history = [],
}: StatusTimelineProps) => {
  const statuses = getStatusesForType(orderType);

  const getStatusTime = (status: string): string | null => {
    const historyItem = history.find((h) => h.status === status);
    if (historyItem) {
      return new Date(historyItem.history_timestamp).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  return (
    <div className="space-y-0">
      {statuses.map((status, index) => {
        const isCompleted = isStatusCompleted(currentStatus, status, orderType);
        const isActive = isStatusActive(currentStatus, status);
        const isPending = !isCompleted && !isActive;
        const statusTime = getStatusTime(status);

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Connector line */}
            {index < statuses.length - 1 && (
              <div
                className={`absolute left-4 top-10 w-0.5 h-[calc(100%-8px)] transition-colors duration-300 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}

            {/* Status icon */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground pulse-gold"
                    : "bg-secondary border border-border text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Package className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Status content */}
            <div className={`flex-1 pb-8 ${isPending ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-2">
                <h4
                  className={`font-semibold ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {ORDER_STATUS_LABELS[status] || status}
                </h4>
                {isActive && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {ORDER_STATUS_DESCRIPTIONS[status] || ""}
              </p>
              {statusTime && (
                <p className="text-xs text-muted-foreground mt-2">
                  {statusTime}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
