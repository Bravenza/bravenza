import { cn } from "@/lib/utils";

const BRAND_GRADIENTS: Record<string, string> = {
  nike: "from-[#111] to-[#333]",
  jordan: "from-[#1a1a1a] to-[#c41230]",
  adidas: "from-[#1a1a1a] to-[#2d2d2d]",
  "new balance": "from-[#1a1a2e] to-[#2d3a4a]",
  puma: "from-[#1a1a1a] to-[#2a3a2a]",
  asics: "from-[#1a1a2e] to-[#2a2a3e]",
  yeezy: "from-[#2a2015] to-[#3a3025]",
  default: "from-muted to-muted-foreground/10",
};

const BRAND_LOGOS: Record<string, string> = {
  nike: "NIKE",
  jordan: "JORDAN",
  adidas: "adidas",
  "new balance": "NB",
  puma: "PUMA",
  asics: "ASICS",
  yeezy: "YEEZY",
};

interface DropImagePlaceholderProps {
  brand: string;
  className?: string;
}

export function DropImagePlaceholder({ brand, className }: DropImagePlaceholderProps) {
  const key = brand.toLowerCase();
  const gradient = BRAND_GRADIENTS[key] || BRAND_GRADIENTS.default;
  const logo = BRAND_LOGOS[key] || brand.toUpperCase();

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br rounded-xl overflow-hidden relative",
        gradient,
        className
      )}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
        backgroundSize: "16px 16px",
      }} />

      {/* Sneaker silhouette SVG */}
      <svg
        viewBox="0 0 64 40"
        fill="none"
        className="w-10 h-6 md:w-12 md:h-8 opacity-20 mb-1"
      >
        <path
          d="M4 32c0 0 2-8 8-12s14-6 20-6c4 0 10 1 14 3s8 5 10 7c2 2 4 6 4 8H4z"
          fill="white"
        />
        <path
          d="M12 20c0 0-2-4-2-8s2-8 6-8c2 0 4 2 8 2s8-2 12-2c6 0 10 4 12 8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Brand text */}
      <span className="text-[10px] md:text-xs font-black tracking-[0.25em] text-white/30 uppercase select-none">
        {logo}
      </span>
    </div>
  );
}