import { ReactNode } from "react";
import { motion } from "framer-motion";

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: "default" | "gold";
}

export const InfoCard = ({
  title,
  icon,
  children,
  variant = "default",
}: InfoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        variant === "gold"
          ? "card-premium-gold p-6"
          : "card-premium p-6"
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-lg ${
          variant === "gold" 
            ? "bg-primary/20 text-primary" 
            : "bg-secondary text-muted-foreground"
        }`}>
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-2.5 text-sm">{children}</div>
    </motion.div>
  );
};

interface InfoRowProps {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}

export const InfoRow = ({ label, value, highlight = false }: InfoRowProps) => {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-medium ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
};
