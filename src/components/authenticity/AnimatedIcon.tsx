import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  variant?: "pulse" | "bounce" | "glow" | "rotate" | "shake";
  color?: "primary" | "success" | "muted";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-500",
  muted: "bg-muted text-muted-foreground",
};

const animations = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  bounce: {
    y: [0, -4, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  glow: {
    boxShadow: [
      "0 0 0 0 rgba(255, 215, 0, 0)",
      "0 0 20px 5px rgba(255, 215, 0, 0.3)",
      "0 0 0 0 rgba(255, 215, 0, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  rotate: {
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  shake: {
    x: [0, -2, 2, -2, 2, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
};

const hoverAnimations = {
  scale: 1.15,
  rotate: [0, -10, 10, 0],
  transition: {
    rotate: {
      duration: 0.3,
    },
  },
};

export function AnimatedIcon({
  icon: Icon,
  className,
  iconClassName,
  variant = "pulse",
  color = "primary",
  size = "md",
}: AnimatedIconProps) {
  return (
    <motion.div
      className={cn(
        "rounded-xl flex items-center justify-center cursor-pointer",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={animations[variant]}
      whileHover={hoverAnimations}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={{ rotate: 0 }}
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className={cn(iconSizeClasses[size], iconClassName)} />
      </motion.div>
    </motion.div>
  );
}
