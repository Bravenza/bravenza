import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
}

export const Logo = forwardRef<HTMLSpanElement, LogoProps>(
  ({ size = "md", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "font-display font-bold tracking-tight text-gradient-gold",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        BRAVENZA
      </span>
    );
  }
);

Logo.displayName = "Logo";
