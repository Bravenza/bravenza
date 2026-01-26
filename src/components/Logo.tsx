import { Crown } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
        <Crown className={`${sizeClasses[size]} text-primary relative z-10`} />
      </div>
      {showText && (
        <span
          className={`${textSizeClasses[size]} font-bold tracking-tight text-gradient-gold`}
        >
          BRAVENZA
        </span>
      )}
    </div>
  );
};
