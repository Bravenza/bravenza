import bravenzaLogo from "@/assets/bravenza-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-3",
    md: "h-5",
    lg: "h-6",
  };

  return (
    <img 
      src={bravenzaLogo} 
      alt="BRAVENZA" 
      className={`${sizeClasses[size]} w-auto object-contain`}
    />
  );
};
