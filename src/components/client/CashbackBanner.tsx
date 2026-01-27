import { useState, useEffect } from "react";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CashbackBannerProps {
  clientCpf: string;
  onNavigateToReferrals?: () => void;
}

export function CashbackBanner({ clientCpf, onNavigateToReferrals }: CashbackBannerProps) {
  const [pendingCashback, setPendingCashback] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
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
      
      // Pending = converted but not yet used
      const pending = referrals
        .filter((r: any) => r.status === "converted" && !r.discount_used)
        .reduce((acc: number, r: any) => acc + (r.discount_percentage || 0), 0);
      
      // Total earned = all rewards (used + pending)
      const total = referrals
        .filter((r: any) => r.status === "converted" || r.status === "rewarded")
        .reduce((acc: number, r: any) => acc + (r.discount_percentage || 0), 0);

      setPendingCashback(pending);
      setTotalEarned(total);
    } catch (err) {
      console.error("Error fetching cashback data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  // Show banner if there's pending cashback or to encourage referrals
  const hasPendingCashback = pendingCashback > 0;

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
                  Use no seu próximo pedido! Suas indicações já geraram {totalEarned}% em recompensas.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg">
                  Ganhe cashback indicando amigos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Compartilhe seu código e ganhe 5% de desconto por cada indicação que comprar.
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
