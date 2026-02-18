import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Flame, Bell, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Release {
  brand: string;
  model: string;
  colorway: string;
  release_date: string;
  retail_price_brl: number | null;
  image_url: string | null;
  hype_level: "low" | "medium" | "high" | "grail";
}

// Fallback data for when AI isn't available yet
const fallbackReleases: Release[] = [
  { brand: "Nike", model: "Air Jordan 1 Retro High OG", colorway: "Black/Varsity Red", release_date: "2026-03-15", retail_price_brl: 1299, image_url: null, hype_level: "grail" },
  { brand: "Adidas", model: "Yeezy Boost 350 V2", colorway: "Onyx", release_date: "2026-03-22", retail_price_brl: 1599, image_url: null, hype_level: "high" },
  { brand: "Nike", model: "Dunk Low Retro", colorway: "Panda 2.0", release_date: "2026-03-28", retail_price_brl: 799, image_url: null, hype_level: "high" },
  { brand: "New Balance", model: "550", colorway: "Sea Salt/Green", release_date: "2026-04-05", retail_price_brl: 899, image_url: null, hype_level: "medium" },
  { brand: "Nike", model: "Air Max 1", colorway: "Anniversary Red", release_date: "2026-04-12", retail_price_brl: 999, image_url: null, hype_level: "high" },
  { brand: "Jordan", model: "Air Jordan 4 Retro", colorway: "Military Blue", release_date: "2026-04-20", retail_price_brl: 1499, image_url: null, hype_level: "grail" },
];

const hypeBadge: Record<string, { label: string; className: string }> = {
  grail: { label: "🔥 GRAIL", className: "bg-destructive text-destructive-foreground" },
  high: { label: "🔥 HYPE", className: "bg-primary text-primary-foreground" },
  medium: { label: "Em alta", className: "bg-muted text-muted-foreground" },
  low: { label: "Normal", className: "bg-muted/50 text-muted-foreground/70" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const UpcomingReleasesSection = memo(function UpcomingReleasesSection() {
  const [releases, setReleases] = useState<Release[]>(fallbackReleases);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchReleases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mk-releases");
      if (!error && data?.releases?.length) {
        setReleases(data.releases);
        setLastUpdated(new Date().toLocaleString("pt-BR"));
      }
    } catch {
      // Use fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  return (
    <section className="py-14 md:py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/6 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">
                Próximos Lançamentos
              </h2>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">
              Os drops mais aguardados do mercado · Atualizado via IA
              {lastUpdated && (
                <span className="ml-2 text-[10px] text-muted-foreground/50">({lastUpdated})</span>
              )}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground self-start md:self-auto"
            onClick={fetchReleases}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar
          </Button>
        </motion.div>

        {/* Releases list */}
        <div className="space-y-3">
          {releases.map((release, i) => {
            const days = daysUntil(release.release_date);
            const isPast = days < 0;
            const isSoon = days >= 0 && days <= 7;
            const hype = hypeBadge[release.hype_level] || hypeBadge.medium;

            return (
              <motion.div
                key={`${release.brand}-${release.model}-${release.release_date}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={cn(
                  "group flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all",
                  isPast
                    ? "bg-muted/20 border-border/20 opacity-60"
                    : isSoon
                      ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                      : "bg-card/60 border-border/30 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                )}
              >
                {/* Image placeholder */}
                <div className="w-16 h-12 md:w-20 md:h-14 rounded-xl bg-white border border-border/20 overflow-hidden shrink-0 flex items-center justify-center">
                  {release.image_url ? (
                    <img src={release.image_url} alt={release.model} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl opacity-20">👟</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{release.brand}</span>
                    <Badge className={cn("text-[9px] px-1.5 py-0 font-bold border-0", hype.className)}>
                      {hype.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate mt-0.5">
                    {release.model}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 truncate">{release.colorway}</p>
                </div>

                {/* Price */}
                <div className="hidden md:block text-right shrink-0">
                  {release.retail_price_brl ? (
                    <p className="text-sm font-bold text-foreground">
                      R$ {release.retail_price_brl.toLocaleString("pt-BR")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">TBA</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">retail</p>
                </div>

                {/* Date */}
                <div className={cn(
                  "text-right shrink-0 min-w-[70px]",
                  isSoon && !isPast && "text-destructive"
                )}>
                  <p className="text-sm font-black tracking-tight">
                    {formatDate(release.release_date)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isPast ? "Lançado" : days === 0 ? "HOJE!" : `em ${days}d`}
                  </p>
                </div>

                {/* Action */}
                {!isPast && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Lembrar-me"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
