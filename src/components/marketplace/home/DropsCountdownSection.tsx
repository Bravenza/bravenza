import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Drop {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  type: string;
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm">
        <span className="text-xl md:text-2xl font-black text-foreground font-display tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

export const DropsCountdownSection = memo(function DropsCountdownSection() {
  const navigate = useNavigate();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  // Next Friday at 12:00 BRT as countdown target
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

  useEffect(() => {
    const fetchDrops = async () => {
      const { data } = await supabase
        .from("vault_intel_posts")
        .select("id, title, excerpt, cover_image, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      setDrops(data || []);
      setLoading(false);
    };
    fetchDrops();
  }, []);

  if (loading || drops.length === 0) return null;

  return (
    <section className="py-16 md:py-20 border-t border-border/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header with countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20">
            <Flame className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">Drops & novidades</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-3 font-display">
            Próximo drop em
          </h2>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-6">
            <CountdownUnit value={countdown.days} label="Dias" />
            <span className="text-xl font-bold text-muted-foreground/30 mt-[-14px]">:</span>
            <CountdownUnit value={countdown.hours} label="Horas" />
            <span className="text-xl font-bold text-muted-foreground/30 mt-[-14px]">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <span className="text-xl font-bold text-muted-foreground/30 mt-[-14px]">:</span>
            <CountdownUnit value={countdown.seconds} label="Seg" />
          </div>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Fique por dentro dos últimos lançamentos e conteúdos exclusivos da comunidade
          </p>
        </motion.div>

        {/* Drop cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {drops.map((drop, i) => (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/drops/${drop.id}`)}
            >
              <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5 transition-all duration-300">
                {drop.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={drop.cover_image}
                      alt={drop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-4">
                  <Badge variant="outline" className="text-[10px] mb-2 border-primary/20 text-primary">
                    {drop.type === "news" ? "Novidade" : drop.type === "release" ? "Lançamento" : "Intel"}
                  </Badge>
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {drop.title}
                  </h3>
                  {drop.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{drop.excerpt}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={() => navigate("/vault/intel")}
          >
            <Clock className="h-3.5 w-3.5" />
            Ver todos os drops
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
});
