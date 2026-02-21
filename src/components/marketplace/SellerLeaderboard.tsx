import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Users, Crown, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-seller`;

interface LeaderboardSeller {
  id: string;
  total_sales_count: number;
  total_sales_value: number;
  average_rating: number | null;
  plan_id: string;
  verified_badge: boolean;
  followers_count: number;
  member: { client_name: string; tier: string };
  badges: { badge_name: string; badge_icon: string; badge_type: string }[];
}

export function SellerLeaderboard({ className }: { className?: string }) {
  const [sellers, setSellers] = useState<LeaderboardSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${FUNCTION_URL}?action=seller-leaderboard`);
        const data = await res.json();
        setSellers(data.leaderboard || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className={cn("card-premium", className)}>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (sellers.length === 0) {
    return (
      <Card className={cn("card-premium", className)}>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Nenhum vendedor ranqueado ainda
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card className={cn("card-premium overflow-hidden", className)}>
      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Top Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sellers.slice(0, 10).map((seller, i) => (
          <motion.div
            key={seller.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
          >
            <span className={cn(
              "text-sm font-black w-7 text-center",
              i === 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{seller.member?.client_name || "Vendedor"}</p>
                {seller.verified_badge && <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {seller.badges.slice(0, 3).map((b, bi) => (
                  <span key={bi} className="text-[10px]" title={b.badge_name}>{b.badge_icon}</span>
                ))}
                <span className="text-[10px] text-muted-foreground">
                  {seller.total_sales_count} vendas
                </span>
                {seller.average_rating && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                    {seller.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold">{formatCurrency(seller.total_sales_value)}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                <Users className="h-2.5 w-2.5" />
                {seller.followers_count} seguidores
              </p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
