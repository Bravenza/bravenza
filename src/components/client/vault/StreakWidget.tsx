import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Calendar, Trophy, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_logins: number;
  is_new_day: boolean;
  streak_broken?: boolean;
}

interface StreakWidgetProps {
  clientCpf: string;
}

const STREAK_MILESTONES = [7, 14, 30, 60, 90];

export function StreakWidget({ clientCpf }: StreakWidgetProps) {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showFlame, setShowFlame] = useState(false);

  useEffect(() => {
    recordLogin();
  }, [clientCpf]);

  const recordLogin = async () => {
    try {
      const { data, error } = await supabase.rpc("record_vault_login", {
        p_cpf: clientCpf,
      });

      if (!error && data) {
        const d = data as unknown as StreakData;
        setStreak(d);
        if (d.is_new_day && d.current_streak > 1) {
          setShowFlame(true);
          setTimeout(() => setShowFlame(false), 3000);
        }
      }
    } catch (err) {
      console.error("Streak error:", err);
    }
  };

  if (!streak) return null;

  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak.current_streak) || 100;
  const milestoneProgress = (streak.current_streak / nextMilestone) * 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Flame Icon */}
          <div className="relative">
            <motion.div
              animate={
                streak.current_streak > 0
                  ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center",
                streak.current_streak >= 30
                  ? "bg-gradient-to-br from-orange-500/20 to-red-500/20"
                  : streak.current_streak >= 7
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
                  : "bg-muted/30"
              )}
            >
              <Flame
                className={cn(
                  "h-7 w-7",
                  streak.current_streak >= 30
                    ? "text-red-500"
                    : streak.current_streak >= 7
                    ? "text-orange-500"
                    : streak.current_streak >= 1
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              />
            </motion.div>

            {/* Celebration burst */}
            <AnimatePresence>
              {showFlame && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0 rounded-2xl border-2 border-orange-400"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold">{streak.current_streak}</span>
              <span className="text-sm text-muted-foreground">dias seguidos</span>
              {streak.current_streak >= 7 && (
                <Badge variant="outline" className="text-[10px] border-orange-400/40 text-orange-500">
                  🔥 On fire
                </Badge>
              )}
            </div>

            {/* Milestone progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                />
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                Meta: {nextMilestone}d
              </span>
            </div>
          </div>

          {/* Side stats */}
          <div className="hidden sm:flex gap-3">
            <div className="text-center px-3 py-1.5 rounded-lg bg-muted/20">
              <Trophy className="h-3.5 w-3.5 text-amber-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold">{streak.longest_streak}</p>
              <p className="text-[9px] text-muted-foreground">Recorde</p>
            </div>
            <div className="text-center px-3 py-1.5 rounded-lg bg-muted/20">
              <Calendar className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
              <p className="text-sm font-bold">{streak.total_logins}</p>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
