import bravenzaLogo from "@/assets/bravenza-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  return (
    <img 
      src={bravenzaLogo} 
      alt="BRAVENZA" 
      className={`${sizeClasses[size]} w-auto object-contain`}
    />
  );
};
