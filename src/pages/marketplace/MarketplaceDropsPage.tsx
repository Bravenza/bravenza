import { useState, useEffect, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Clock, ArrowLeft, CalendarDays, Bell, BellRing,
  Crown, Sparkles, Zap, Lock, Filter, Loader2, RefreshCw,
  TrendingUp, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useNavigate } from "react-router-dom";
import { useClientSession } from "@/hooks/useClientSession";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { toast } from "sonner";

interface Release {
  brand: string;
  model: string;
  colorway: string;
  release_date: string;
  image_url: string | null;
  hype_level: "low" | "medium" | "high" | "grail";
}

type FilterBrand = "all" | "Nike" | "Jordan" | "Adidas" | "New Balance" | "Puma";
type FilterStatus = "all" | "upcoming" | "today" | "past";

// ── Countdown hook ──
function useCountdown(targetDate: Date) {
  const getTimeLeft = () => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = useState(getTimeLeft());
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return t;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.08, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-14 h-14 md:w-18 md:h-18 rounded-xl bg-background/80 backdrop-blur-sm border border-destructive/30 flex items-center justify-center shadow-[0_0_20px_-4px_hsl(var(--destructive)/0.3)]"
      >
        <span className="text-xl md:text-2xl font-black text-foreground tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-[9px] text-destructive/80 mt-1.5 uppercase tracking-widest font-bold">{label}</span>
    </div>
  );
}

const hypeBadge: Record<string, { label: string; className: string }> = {
  grail: { label: "🔥 GRAIL", className: "bg-destructive text-destructive-foreground" },
  high: { label: "🔥 HYPE", className: "bg-primary text-primary-foreground" },
  medium: { label: "Em alta", className: "bg-muted text-muted-foreground" },
  low: { label: "Normal", className: "bg-muted/50 text-muted-foreground/70" },
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr + "T12:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MarketplaceDropsPage() {
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf;

  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [brandFilter, setBrandFilter] = useState<FilterBrand>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("upcoming");

  // Next friday countdown
  const getNextFriday = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilFriday = ((5 - day + 7) % 7) || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilFriday);
    next.setHours(12, 0, 0, 0);
    return next;
  };
  const countdown = useCountdown(getNextFriday());

  const fetchReleases = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getMarketplaceHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-releases`, { headers });
      const data = await res.json();
      if (data?.releases?.length) setReleases(data.releases);
    } catch { /* fallback */ }
    finally { setIsLoading(false); }
  }, []);

  const fetchReminders = useCallback(async () => {
    if (!cpf) return;
    try {
      const h = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "drop-reminders" });
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover?${params}`, { headers: h });
      const data = await res.json();
      setReminders(new Set((data.reminders || []).map((r: any) => r.release_key)));
    } catch { /* ignore */ }
  }, [cpf]);

  useEffect(() => { fetchReleases(); fetchReminders(); }, [fetchReleases, fetchReminders]);

  const toggleReminder = async (release: Release) => {
    if (!cpf) {
      toast.error("Faça login para ativar lembretes");
      return;
    }
    const key = `${release.brand}|${release.model}|${release.release_date}`;
    try {
      const h = await getMarketplaceHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover?action=toggle-drop-reminder`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          release_key: key,
          release_brand: release.brand,
          release_model: release.model,
          release_date: release.release_date,
        }),
      });
      const data = await res.json();
      if (data.active) {
        setReminders(prev => new Set([...prev, key]));
        toast.success("🔔 Lembrete ativado!");
      } else {
        setReminders(prev => { const s = new Set(prev); s.delete(key); return s; });
        toast("Lembrete removido");
      }
    } catch {
      toast.error("Erro ao salvar lembrete");
    }
  };

  const brands = useMemo(() => {
    const set = new Set(releases.map(r => r.brand));
    return ["all", ...Array.from(set).sort()] as FilterBrand[];
  }, [releases]);

  const filtered = useMemo(() => {
    return releases.filter(r => {
      if (brandFilter !== "all" && r.brand !== brandFilter) return false;
      const days = daysUntil(r.release_date);
      if (statusFilter === "upcoming" && days <= 0) return false;
      if (statusFilter === "today" && days !== 0) return false;
      if (statusFilter === "past" && days >= 0) return false;
      return true;
    });
  }, [releases, brandFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Drops & Lançamentos | BRAVENZA Marketplace</title>
        <meta name="description" content="Fique por dentro dos próximos lançamentos de sneakers. Ative lembretes e não perca nenhum drop exclusivo." />
      </Helmet>

      {/* ── HERO COUNTDOWN ── */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-destructive/[0.04] to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
          <div className="absolute inset-0 rounded-full border border-destructive/10 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-12 rounded-full border border-destructive/5 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <button
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
          </button>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full bg-destructive/15 border border-destructive/30"
          >
            <Flame className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-xs font-black text-destructive uppercase tracking-[0.2em]">Drops exclusivos</span>
            <Zap className="h-3.5 w-3.5 text-destructive" />
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Próximo drop em</h1>
          <p className="text-sm text-muted-foreground mb-8">Sexta-feira, 12h. Não perca.</p>

          <div className="flex items-center justify-center gap-3 md:gap-4 mb-8">
            <CountdownUnit value={countdown.days} label="Dias" />
            <span className="text-xl font-black text-destructive/40 mt-[-16px]">:</span>
            <CountdownUnit value={countdown.hours} label="Horas" />
            <span className="text-xl font-black text-destructive/40 mt-[-16px]">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <span className="text-xl font-black text-destructive/40 mt-[-16px]">:</span>
            <CountdownUnit value={countdown.seconds} label="Seg" />
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 w-fit mx-auto">
            <Crown className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Membros Vault: acesso 2h antes</span>
            <Sparkles className="h-3 w-3 text-yellow-500" />
          </div>
        </div>
      </section>

      {/* ── FILTERS ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtros:
          </div>
          {/* Brand */}
          <div className="flex gap-1.5 flex-wrap">
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setBrandFilter(b)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  brandFilter === b
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/30 text-muted-foreground hover:border-primary/30"
                )}
              >
                {b === "all" ? "Todas" : b}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { v: "upcoming" as const, l: "Próximos" },
            { v: "today" as const, l: "Hoje" },
            { v: "past" as const, l: "Lançados" },
            { v: "all" as const, l: "Todos" },
          ]).map(o => (
            <button
              key={o.v}
              onClick={() => setStatusFilter(o.v)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                statusFilter === o.v
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border/30 text-muted-foreground hover:border-destructive/30"
              )}
            >
              {o.l}
            </button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5 text-muted-foreground h-8"
            onClick={fetchReleases}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* ── RELEASES GRID ── */}
      <div className="max-w-7xl mx-auto px-4 pb-20 md:pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum lançamento encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((release, i) => {
                const days = daysUntil(release.release_date);
                const isPast = days < 0;
                const isSoon = days >= 0 && days <= 3;
                const isToday = days === 0;
                const hype = hypeBadge[release.hype_level] || hypeBadge.medium;
                const key = `${release.brand}|${release.model}|${release.release_date}`;
                const hasReminder = reminders.has(key);

                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className={cn(
                      "group flex items-center gap-4 p-4 rounded-2xl border transition-all relative",
                      isPast
                        ? "bg-muted/20 border-border/20 opacity-60"
                        : isToday
                          ? "bg-destructive/10 border-destructive/30 shadow-lg shadow-destructive/10"
                          : isSoon
                            ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                            : "bg-card/60 border-border/30 hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    {/* Image */}
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
                        {isToday && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-destructive text-white border-0 animate-pulse">
                            HOJE!
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-1">{release.model}</p>
                      <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5">{release.colorway}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{formatDate(release.release_date)}</p>
                    </div>

                    {/* Right side: days + reminder */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={cn("text-right", isSoon && !isPast ? "text-destructive" : "")}>
                        <p className="text-sm font-black tracking-tight">
                          {isPast ? "Lançado" : isToday ? "HOJE" : `${days}d`}
                        </p>
                      </div>
                      {!isPast && cpf && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleReminder(release); }}
                          className={cn(
                            "p-2 rounded-xl border transition-all",
                            hasReminder
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                              : "bg-muted/10 border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary"
                          )}
                        >
                          {hasReminder ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: CalendarDays, label: "Lançamentos", value: releases.length },
            { icon: TrendingUp, label: "Grails", value: releases.filter(r => r.hype_level === "grail").length },
            { icon: Flame, label: "Hype", value: releases.filter(r => r.hype_level === "high").length },
            { icon: ShoppingBag, label: "Marcas", value: new Set(releases.map(r => r.brand)).size },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl bg-card/60 border border-border/20 text-center">
              <s.icon className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
