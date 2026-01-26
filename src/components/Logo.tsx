import { forwardRef } from "react";
import bravenzaLogo from "@/assets/bravenza-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: "sm" | "md" | "lg";
}

export const Logo = forwardRef<HTMLImageElement, LogoProps>(
  ({ size = "md", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-3",
      md: "h-5",
      lg: "h-6",
    };

    return (
      <img
        ref={ref}
        src={bravenzaLogo}
        alt="BRAVENZA"
        className={cn(sizeClasses[size], "w-auto object-contain", className)}
        loading="lazy"
        decoding="async"
        {...props}
      />
    );
  }
);

Logo.displayName = "Logo";
