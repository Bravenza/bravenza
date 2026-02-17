import { memo } from "react";

/** Text-based brand logos styled to mimic official typefaces */
const brandStyles: Record<string, string> = {
  Nike: "font-black italic uppercase tracking-tighter",
  Jordan: "font-black uppercase tracking-tight",
  adidas: "font-bold lowercase tracking-widest",
  "New Balance": "font-extrabold uppercase tracking-tight text-[10px] md:text-xs",
  Yeezy: "font-black uppercase tracking-[0.3em] text-[10px] md:text-xs",
  Asics: "font-black uppercase tracking-wider text-[10px] md:text-xs",
  Puma: "font-extrabold uppercase tracking-wide",
  Converse: "font-bold uppercase tracking-wider text-[10px] md:text-xs",
  Vans: "font-black uppercase italic tracking-tight",
  Reebok: "font-bold uppercase tracking-widest text-[10px] md:text-xs",
};

export const popularBrands = [
  "Nike", "Jordan", "adidas", "New Balance", "Yeezy",
  "Asics", "Puma", "Converse", "Vans", "Reebok",
];

export function BrandLogo({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const style = brandStyles[name] || "font-bold uppercase tracking-wide";
  const sizeClass = size === "sm" ? "text-[11px]" : "text-xs md:text-sm";

  return (
    <span className={`${style} ${sizeClass} select-none`}>
      {name}
    </span>
  );
}

export const BrandLogos = memo(function BrandLogos() {
  return null; // Utility component, no standalone render
});
