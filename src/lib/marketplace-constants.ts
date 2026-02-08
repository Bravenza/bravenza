import { ShieldCheck, AlertTriangle, Package } from "lucide-react";

export const conditionLabels: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Excelente",
  usado_bom: "Bom",
  usado_regular: "Regular",
};

export const conditionColors: Record<string, string> = {
  novo: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  usado_excelente: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  usado_bom: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  usado_regular: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export const proLabels: Record<string, { text: string; color: string; icon: typeof ShieldCheck }> = {
  pro_mandatory: { text: "PRO obrigatório", color: "bg-primary/20 text-primary border-primary/30", icon: ShieldCheck },
  pro_recommended: { text: "PRO recomendado", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle },
  direct_allowed: { text: "Direto", color: "bg-muted text-muted-foreground border-border", icon: Package },
};

export function normalizeShippingMode(mode: string | undefined): string {
  if (mode === "seller_ships") return "direct";
  if (mode === "hub") return "bravenza";
  return mode || "direct";
}
