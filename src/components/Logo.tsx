import bravenzaLogo from "@/assets/bravenza-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  };

  return (
    <img 
      src={bravenzaLogo} 
      alt="BRAVENZA" 
      className={`${sizeClasses[size]} w-auto object-contain`}
    />
  );
};
