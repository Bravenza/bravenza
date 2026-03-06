import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { cn } from "@/lib/utils";

interface Release {
  brand: string;
  model: string;
  colorway: string;
  release_date: string;
  image_url: string | null;
  hype_level: "low" | "medium" | "high" | "grail";
}

const fallbackReleases: Release[] = [
  { brand: "Nike", model: "Air Jordan 1 Retro High OG", colorway: "Black/Varsity Red", release_date: "2026-03-15", image_url: null, hype_level: "grail" },
  { brand: "Adidas", model: "Yeezy Boost 350 V2", colorway: "Onyx", release_date: "2026-03-22", image_url: null, hype_level: "high" },
  { brand: "Nike", model: "Dunk Low Retro", colorway: "Panda 2.0", release_date: "2026-03-28", image_url: null, hype_level: "high" },
  { brand: "New Balance", model: "550", colorway: "Sea Salt/Green", release_date: "2026-04-05", image_url: null, hype_level: "medium" },
  { brand: "Nike", model: "Air Max 1", colorway: "Anniversary Red", release_date: "2026-04-12", image_url: null, hype_level: "high" },
  { brand: "Jordan", model: "Air Jordan 4 Retro", colorway: "Military Blue", release_date: "2026-04-20", image_url: null, hype_level: "grail" },
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

  const fetchReleases = async () => {
    setIsLoading(true);
    try {
      const headers = await getMarketplaceHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-releases`, { headers });
      const data = await res.json();
      if (data?.releases?.length) {
        setReleases(data.releases);
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
    <section className="py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">
              Próximos Lançamentos
            </h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={fetchReleases}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar
          </Button>
        </motion.div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {releases.map((release, i) => {
            const days = daysUntil(release.release_date);
            const isPast = days < 0;
            const isSoon = days >= 0 && days <= 7;
            const hype = hypeBadge[release.hype_level] || hypeBadge.medium;

            return (
              <motion.div
                key={`${release.brand}-${release.model}-${release.release_date}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={cn(
                  "group flex items-center gap-4 p-3 md:p-4 rounded-2xl border transition-all",
                  isPast
                    ? "bg-muted/20 border-border/20 opacity-50"
                    : isSoon
                      ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                      : "bg-card/60 border-border/30 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                )}
              >
                {/* Product image */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white border border-border/20 overflow-hidden shrink-0 flex items-center justify-center">
                  {release.image_url && release.image_url !== "null" ? (
                    <img
                      src={release.image_url}
                      alt={`${release.brand} ${release.model}`}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        el.parentElement!.innerHTML = `<span class="text-3xl opacity-15">👟</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-3xl opacity-15">👟</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{release.brand}</span>
                    <Badge className={cn("text-[9px] px-1.5 py-0 font-bold border-0", hype.className)}>
                      {hype.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug line-clamp-1">
                    {release.model}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5">{release.colorway}</p>
                </div>

                {/* Date */}
                <div className={cn(
                  "text-right shrink-0 min-w-[60px]",
                  isSoon && !isPast ? "text-destructive" : ""
                )}>
                  <p className="text-sm font-black tracking-tight">
                    {formatDate(release.release_date)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isPast ? "Lançado" : days === 0 ? "HOJE!" : `em ${days}d`}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
