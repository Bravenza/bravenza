import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface InteractiveCardPreviewProps {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  brand: string;
  isFlipped: boolean;
}

const brandGradients: Record<string, string> = {
  visa: "from-[#1a1f71] to-[#2d4aa8]",
  mastercard: "from-[#1a1a2e] to-[#16213e]",
  amex: "from-[#006fcf] to-[#0047ab]",
  elo: "from-[#1a1a1a] to-[#333333]",
  hipercard: "from-[#822124] to-[#a52a2a]",
  diners: "from-[#0a0a2e] to-[#1b1b4b]",
  default: "from-[#1a1a2e] via-[#2a2a3e] to-[#1a1a2e]",
};

const brandLogos: Record<string, string> = {
  visa: "VISA",
  mastercard: "MASTERCARD",
  amex: "AMEX",
  elo: "ELO",
  hipercard: "HIPERCARD",
  diners: "DINERS",
};

export function InteractiveCardPreview({
  cardNumber,
  cardholderName,
  expirationMonth,
  expirationYear,
  securityCode,
  brand,
  isFlipped,
}: InteractiveCardPreviewProps) {
  const formattedNumber = useMemo(() => {
    const clean = cardNumber.replace(/\s/g, "");
    const groups = [];
    for (let i = 0; i < 4; i++) {
      const start = i * 4;
      const chunk = clean.slice(start, start + 4);
      groups.push(chunk.padEnd(4, "•").split("").join(""));
    }
    return groups;
  }, [cardNumber]);

  const gradient = brandGradients[brand] || brandGradients.default;
  const logoText = brandLogos[brand] || "";

  return (
    <div className="perspective-[1000px] w-full max-w-[320px] mx-auto select-none" style={{ perspective: "1000px" }}>
      <div
        className={cn(
          "relative w-full aspect-[1.586/1] transition-transform duration-700",
          "transform-gpu"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ===== FRONT ===== */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl p-5 flex flex-col justify-between",
            "bg-gradient-to-br shadow-2xl",
            gradient
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Chip + Brand */}
          <div className="flex items-start justify-between">
            {/* Chip */}
            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-500/60 border border-yellow-400/30 flex items-center justify-center overflow-hidden">
              <div className="grid grid-cols-3 grid-rows-3 gap-px w-7 h-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-yellow-600/40 rounded-[1px]" />
                ))}
              </div>
            </div>
            {/* Contactless */}
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/40">
                <path d="M8.5 16.5c-1.5-1.5-2.5-3.5-2.5-5.5s1-4 2.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 13c-.8-.8-1.3-1.8-1.3-2.8s.5-2 1.3-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15.5 9.5c.3.3.5.8.5 1.3s-.2 1-.5 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {logoText && (
                <span className="text-white/90 text-[11px] font-bold tracking-widest">{logoText}</span>
              )}
            </div>
          </div>

          {/* Card Number */}
          <div className="flex gap-3 sm:gap-4">
            {formattedNumber.map((group, i) => (
              <span
                key={i}
                className="text-white text-base sm:text-lg font-mono tracking-[0.15em] transition-all duration-200"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {group}
              </span>
            ))}
          </div>

          {/* Name + Expiry */}
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Titular</p>
              <p
                className="text-white text-xs sm:text-sm font-medium tracking-wide truncate transition-all duration-200"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {cardholderName || "SEU NOME AQUI"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Validade</p>
              <p
                className="text-white text-xs sm:text-sm font-mono tracking-wider transition-all duration-200"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {expirationMonth || "••"}/{expirationYear || "••"}
              </p>
            </div>
          </div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)`,
            }}
          />
        </div>

        {/* ===== BACK ===== */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl flex flex-col",
            "bg-gradient-to-br shadow-2xl overflow-hidden",
            gradient
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Magnetic strip */}
          <div className="w-full h-10 sm:h-12 bg-black/80 mt-5" />

          {/* CVV area */}
          <div className="flex-1 flex flex-col justify-center px-5 gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-8 sm:h-9 bg-white/90 rounded flex items-center justify-end px-3">
                <span className="text-black font-mono text-sm tracking-[0.2em] font-bold">
                  {securityCode || "•••"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/50 uppercase tracking-wider">CVV</p>
              </div>
            </div>
          </div>

          {/* Bottom brand */}
          <div className="flex justify-end px-5 pb-4">
            {logoText && (
              <span className="text-white/50 text-[10px] font-bold tracking-widest">{logoText}</span>
            )}
          </div>

          {/* Pattern overlay */}
          <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
