import bravenzaLogo from "@/assets/bravenza-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Logo = ({ size = "md", className }: LogoProps) => {
  const sizeClasses = {
    sm: "h-3",
    md: "h-5",
    lg: "h-6",
  };

  return (
    <img 
      src={bravenzaLogo} 
      alt="BRAVENZA" 
      className={cn(sizeClasses[size], "w-auto object-contain", className)}
    />
  );
};
