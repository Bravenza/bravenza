import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Clock, ArrowRight, Zap, Lock, Bell, BellRing, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
      <motion.div
        key={value}
        initial={{ scale: 1.1, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-background/80 backdrop-blur-sm border border-destructive/30 flex items-center justify-center shadow-[0_0_20px_-4px_hsl(var(--destructive)/0.3)]"
      >
        <span className="text-2xl md:text-3xl font-black text-foreground font-display tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-[10px] text-destructive/80 mt-2 uppercase tracking-widest font-bold">{label}</span>
    </div>
  );
}

export const DropsCountdownSection = memo(function DropsCountdownSection() {
  const navigate = useNavigate();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

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

  const mockDrops: Drop[] = [
    {
      id: "mock-1",
      title: "Nike Dunk Low 'Panda' retorna em edição limitada",
      excerpt: "O clássico preto e branco ganha nova versão com materiais premium e numeração reduzida para o Brasil.",
      cover_image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=340&fit=crop",
      published_at: new Date().toISOString(),
      type: "release",
    },
    {
      id: "mock-2",
      title: "Jordan 1 Retro High OG 'Chicago' reimaginado",
      excerpt: "A silhueta mais icônica da história volta com couro italiano e detalhes que homenageiam o legado de MJ.",
      cover_image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=340&fit=crop",
      published_at: new Date().toISOString(),
      type: "release",
    },
    {
      id: "mock-3",
      title: "Guia: como identificar um sneaker falso em 30 segundos",
      excerpt: "Nossa equipe de autenticação revela os 5 pontos que separam o original da réplica.",
      cover_image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=340&fit=crop",
      published_at: new Date().toISOString(),
      type: "news",
    },
  ];

  useEffect(() => {
    const fetchDrops = async () => {
      const { data } = await supabase
        .from("vault_intel_posts")
        .select("id, title, excerpt, cover_image, published_at, type")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      setDrops(data && data.length > 0 ? data : mockDrops);
      setLoading(false);
    };
    fetchDrops();
  }, []);

  const handleNotify = () => {
    setNotifyEnabled(true);
    toast.success("🔔 Notificação ativada!", {
      description: "Você será avisado assim que o próximo drop for lançado.",
    });
  };

  if (loading) return null;

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* === URGENT BACKGROUND === */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-destructive/[0.04] to-background" />
      
      {/* Animated pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
        <div className="absolute inset-0 rounded-full border border-destructive/10 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-8 rounded-full border border-destructive/8 animate-ping" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
        <div className="absolute inset-16 rounded-full border border-destructive/5 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
      </div>

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-destructive/5 rounded-full blur-[120px]" />
      
      {/* Side accent lines */}
      <div className="absolute top-[20%] left-0 w-24 h-px bg-gradient-to-r from-destructive/40 to-transparent" />
      <div className="absolute bottom-[30%] right-0 w-32 h-px bg-gradient-to-l from-destructive/30 to-transparent" />

      {/* Top & bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header with countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Urgency badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-destructive/15 border border-destructive/30 backdrop-blur-sm"
          >
            <Flame className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-xs font-black text-destructive uppercase tracking-[0.2em]">Drop exclusivo</span>
            <Zap className="h-3.5 w-3.5 text-destructive" />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-2 font-display">
            Próximo drop em
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Sexta-feira, 12h. Não perca.
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 md:gap-5 mb-8">
            <CountdownUnit value={countdown.days} label="Dias" />
            <span className="text-2xl font-black text-destructive/40 mt-[-20px]">:</span>
            <CountdownUnit value={countdown.hours} label="Horas" />
            <span className="text-2xl font-black text-destructive/40 mt-[-20px]">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <span className="text-2xl font-black text-destructive/40 mt-[-20px]">:</span>
            <CountdownUnit value={countdown.seconds} label="Seg" />
          </div>

          {/* Notify + Early Access */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Button
              variant={notifyEnabled ? "outline" : "default"}
              size="sm"
              className={`rounded-full gap-2 ${notifyEnabled ? "border-emerald-500/30 text-emerald-500" : "bg-destructive hover:bg-destructive/90"}`}
              onClick={handleNotify}
              disabled={notifyEnabled}
            >
              {notifyEnabled ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {notifyEnabled ? "Notificação ativada" : "Avise-me do próximo drop"}
            </Button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
              <Crown className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                Membros Vault: acesso 2h antes
              </span>
              <Sparkles className="h-3 w-3 text-yellow-500" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/80">
            <Lock className="h-3 w-3" />
            <span>Acesso antecipado exclusivo para membros Vault</span>
          </div>
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
              <div className="rounded-2xl border border-destructive/15 bg-card/90 backdrop-blur-sm overflow-hidden group-hover:border-destructive/40 group-hover:shadow-[0_8px_40px_-8px_hsl(var(--destructive)/0.2)] transition-all duration-300">
                {drop.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img
                      src={drop.cover_image}
                      alt={drop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
                    
                    {/* Live indicator */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/90 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[9px] font-black text-white uppercase tracking-wider">Em breve</span>
                    </div>

                    {/* Early access badge for vault */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-500/90 text-yellow-950 border-0 text-[9px] font-bold gap-1">
                        <Crown className="h-2.5 w-2.5" /> Acesso antecipado
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <Badge variant="outline" className="text-[10px] mb-2 border-destructive/20 text-destructive font-bold">
                    {drop.type === "news" ? "Novidade" : drop.type === "release" ? "Lançamento" : "Intel"}
                  </Badge>
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 group-hover:text-destructive transition-colors">
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

        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
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
