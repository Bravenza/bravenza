import { useState, useEffect } from "react";
import { Gift, ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CashbackBannerProps {
  clientCpf: string;
  onNavigateToReferrals?: () => void;
}

// Maximum cashback usage is 25% of order value
export const MAX_CASHBACK_PERCENTAGE = 25;

export function CashbackBanner({ clientCpf, onNavigateToReferrals }: CashbackBannerProps) {
  const [pendingCashback, setPendingCashback] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [nextExpiration, setNextExpiration] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCashbackData();
  }, [clientCpf]);

  const fetchCashbackData = async () => {
    try {
      const { data, error } = await supabase.rpc("get_client_referrals", {
        p_cpf: clientCpf.replace(/\D/g, ""),
      });

      if (error) throw error;

      const referrals = data || [];
      const now = new Date();
      
      // Filter only non-expired, converted but not used cashback
      const validPending = referrals.filter((r: any) => {
        if (r.status !== "converted" || r.discount_used) return false;
        // Check expiration (90 days from created_at)
        const createdAt = new Date(r.created_at);
        const expiresAt = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
        return expiresAt > now;
      });

      // Calculate pending cashback (capped at MAX_CASHBACK_PERCENTAGE)
      const rawPending = validPending.reduce((acc: number, r: any) => acc + (r.discount_percentage || 0), 0);
      const cappedPending = Math.min(rawPending, MAX_CASHBACK_PERCENTAGE);
      
      // Find next expiration date
      if (validPending.length > 0) {
        const expirations = validPending.map((r: any) => {
          const createdAt = new Date(r.created_at);
          return new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
        });
        expirations.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        setNextExpiration(expirations[0]);
      }
      
      // Total earned = all rewards (used + pending valid)
      const total = referrals
        .filter((r: any) => r.status === "converted" || r.status === "rewarded")
        .reduce((acc: number, r: any) => acc + (r.discount_percentage || 0), 0);

      setPendingCashback(cappedPending);
      setTotalEarned(total);
    } catch (err) {
      console.error("Error fetching cashback data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysUntilExpiration = () => {
    if (!nextExpiration) return null;
    const now = new Date();
    const diffTime = nextExpiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) return null;

  // Show banner if there's pending cashback or to encourage referrals
  const hasPendingCashback = pendingCashback > 0;
  const daysUntilExpiration = getDaysUntilExpiration();

  return (
    <div className={`relative overflow-hidden rounded-xl p-6 ${
      hasPendingCashback 
        ? "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30" 
        : "bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50"
    }`}>
      {/* Animated sparkles for pending cashback */}
      {hasPendingCashback && (
        <div className="absolute top-2 right-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            hasPendingCashback ? "bg-primary/30" : "bg-muted"
          }`}>
            <Gift className={`h-6 w-6 ${
              hasPendingCashback ? "text-primary" : "text-muted-foreground"
            }`} />
          </div>
          
          <div>
            {hasPendingCashback ? (
              <>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Você tem cashback disponível!
                  <span className="text-2xl font-bold text-primary">{pendingCashback}%</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use no seu próximo pedido! (máximo {MAX_CASHBACK_PERCENTAGE}% por pedido)
                </p>
                {daysUntilExpiration !== null && daysUntilExpiration <= 30 && (
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {daysUntilExpiration <= 7 
                      ? `Atenção: expira em ${daysUntilExpiration} dia${daysUntilExpiration !== 1 ? 's' : ''}!`
                      : `Válido por mais ${daysUntilExpiration} dias`
                    }
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg">
                  Ganhe cashback indicando amigos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Compartilhe seu código e ganhe até {MAX_CASHBACK_PERCENTAGE}% de desconto no próximo pedido.
                  {totalEarned > 0 && ` Você já ganhou ${totalEarned}% em recompensas!`}
                </p>
              </>
            )}
          </div>
        </div>

        <Button 
          onClick={onNavigateToReferrals}
          variant={hasPendingCashback ? "default" : "outline"}
          className="gap-2 shrink-0"
        >
          {hasPendingCashback ? "Ver meu cashback" : "Começar a indicar"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}