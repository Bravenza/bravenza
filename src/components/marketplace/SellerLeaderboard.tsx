import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, ShieldCheck, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FollowSellerButton } from "./FollowSellerButton";

import { marketplaceRequest } from "@/hooks/marketplace/api";

interface LeaderboardSeller {
  id: string;
  total_sales_count: number;
  average_rating: number | null;
  plan_id: string;
  verified_badge: boolean;
  member: { client_name: string; tier: string };
}

export function SellerLeaderboard({ className }: { className?: string }) {
  const [sellers, setSellers] = useState<LeaderboardSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await marketplaceRequest("", "seller-leaderboard");
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

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="py-12 border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">
              Top Vendedores
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Os vendedores mais ativos da comunidade
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sellers.slice(0, 10).map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 border border-border/20 hover:border-primary/20 hover:bg-card/80 transition-all"
            >
              <span className={cn(
                "text-sm font-black w-8 text-center shrink-0",
                i === 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{seller.member?.client_name || "Vendedor"}</p>
                  {seller.verified_badge && <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {seller.total_sales_count} vendas
                  </span>
                  {seller.average_rating && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                      {seller.average_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <FollowSellerButton sellerId={seller.id} size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => navigate(`/marketplace/seller/${seller.id}`)}
                >
                  <Store className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Loja</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
