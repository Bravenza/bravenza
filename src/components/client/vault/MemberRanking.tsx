import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Sparkles, Trophy, Medal, Flame, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface RankedMember {
  member_id: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: string;
  client_name: string;
  total_score: number;
  current_streak: number;
  badges_count: number;
  stats_purchases_count_12m: number;
}

interface MemberRankingProps {
  currentMemberId?: string;
}

const tierIcons: Record<string, React.ElementType> = {
  member: Shield,
  collector: Crown,
  elite: Sparkles,
};

const tierColors: Record<string, string> = {
  member: "text-muted-foreground",
  collector: "text-amber-500",
  elite: "text-primary",
};

const podiumColors = [
  "from-amber-400/20 to-amber-500/10 border-amber-400/40",
  "from-slate-300/20 to-slate-400/10 border-slate-400/40",
  "from-orange-600/20 to-orange-700/10 border-orange-600/40",
];

export function MemberRanking({ currentMemberId }: MemberRankingProps) {
  const [rankings, setRankings] = useState<RankedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from("vault_member_rankings" as any)
        .select("*")
        .order("total_score", { ascending: false })
        .limit(10);

      if (!error && data) {
        setRankings(data as unknown as RankedMember[]);
      }
    } catch (err) {
      console.error("Rankings error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ranking em breve</p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Ranking Vault
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Top membros por atividade
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rankings.map((member, index) => {
            const isCurrentUser = member.member_id === currentMemberId;
            const TierIcon = tierIcons[member.tier] || Shield;
            const displayName = member.display_name || member.client_name.split(" ")[0];

            return (
              <motion.div
                key={member.member_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  index < 3
                    ? `bg-gradient-to-r ${podiumColors[index]}`
                    : "bg-muted/10 border-border/20",
                  isCurrentUser && "ring-1 ring-primary/40"
                )}
              >
                {/* Position */}
                <div className="w-7 text-center shrink-0">
                  {index === 0 ? (
                    <span className="text-lg">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-lg">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-lg">🥉</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(member.client_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name & tier */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-sm font-medium truncate", isCurrentUser && "text-primary")}>
                      {displayName}
                      {isCurrentUser && " (você)"}
                    </p>
                    <TierIcon className={cn("h-3.5 w-3.5 shrink-0", tierColors[member.tier])} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {member.current_streak > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5 text-orange-500" />
                        {member.current_streak}d
                      </span>
                    )}
                    {member.badges_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Award className="h-2.5 w-2.5" />
                        {member.badges_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs shrink-0",
                    index === 0 && "border-amber-400/50 text-amber-500"
                  )}
                >
                  {member.total_score} pts
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
