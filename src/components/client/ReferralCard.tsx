import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Copy, Check, Users, Percent, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralData {
  id: string;
  referral_code: string;
  referred_name: string | null;
  status: string;
  discount_percentage: number;
  discount_used: boolean;
  created_at: string;
}

interface ReferralCardProps {
  clientCpf: string;
  clientName: string;
  clientEmail?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando uso",
  converted: "Indicado realizou pedido",
  rewarded: "Desconto aplicado",
  expired: "Expirado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  converted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rewarded: "bg-green-500/20 text-green-400 border-green-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function ReferralCard({ clientCpf, clientName, clientEmail }: ReferralCardProps) {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [cashbackPercentage, setCashbackPercentage] = useState<number>(5);

  const myReferralCode = referrals.find(r => r.status === "pending")?.referral_code;
  const referralLink = myReferralCode 
    ? `${window.location.origin}/solicitar?ref=${myReferralCode}` 
    : null;

  useEffect(() => {
    fetchReferrals();
    fetchCashbackPercentage();
  }, [clientCpf]);

  const fetchCashbackPercentage = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "referral_cashback_percentage")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCashbackPercentage(parseFloat(String(data.value).replace(/"/g, "")) || 5);
      }
    } catch (err) {
      console.error("Error fetching cashback percentage:", err);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase.rpc("get_client_referrals", {
        p_cpf: clientCpf.replace(/\D/g, ""),
      });

      if (error) throw error;
      setReferrals(data || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createReferralCode = async () => {
    setIsCreating(true);
    try {
      // Generate code using the database function
      const { data: codeData, error: codeError } = await supabase.rpc("generate_referral_code");
      
      if (codeError) throw codeError;

      const referralCode = codeData;

      // Create the referral entry with the configured cashback percentage
      const { error } = await supabase
        .from("referrals")
        .insert({
          referrer_cpf: clientCpf.replace(/\D/g, ""),
          referrer_name: clientName,
          referrer_email: clientEmail || null,
          referral_code: referralCode,
          discount_percentage: cashbackPercentage,
          status: "pending",
        });

      if (error) {
        if (error.message?.includes("duplicate")) {
          toast.error("Você já possui um código de indicação ativo");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Código de indicação criado com sucesso!");
      fetchReferrals();
    } catch (err: any) {
      console.error("Error creating referral:", err);
      toast.error("Erro ao criar código de indicação");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (!myReferralCode) return;
    navigator.clipboard.writeText(myReferralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Código copiado!");
  };

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Link copiado!");
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const pendingReferrals = referrals.filter(r => r.status === "pending");
  const convertedReferrals = referrals.filter(r => r.status === "converted");
  const rewardedReferrals = referrals.filter(r => r.status === "rewarded");

  const totalDiscount = rewardedReferrals.reduce((acc, r) => acc + (r.discount_percentage || 0), 0);
  const pendingDiscount = convertedReferrals.reduce((acc, r) => acc + (r.discount_percentage || 0), 0);

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Programa de Indicação
        </CardTitle>
        <CardDescription>
          Indique amigos e ganhe desconto no seu próximo pedido!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{convertedReferrals.length}</p>
            <p className="text-xs text-muted-foreground">Indicados</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Percent className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{totalDiscount}%</p>
            <p className="text-xs text-muted-foreground">Usado</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Gift className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{pendingDiscount}%</p>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </div>
        </div>

        {/* My Referral Code */}
        {myReferralCode ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-2">Seu código de indicação:</p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono font-bold text-primary flex-1">
                  {myReferralCode}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyCode}
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copiar Link de Indicação
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Quando alguém fizer um pedido usando seu link, você ganha {cashbackPercentage}% de desconto no próximo pedido!
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Você ainda não tem um código de indicação. Crie agora e comece a ganhar descontos!
            </p>
            <Button onClick={createReferralCode} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Meu Código de Indicação"}
            </Button>
          </div>
        )}

        {/* Referral History */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Histórico de Indicações</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {referrals.filter(r => r.referred_name).map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{referral.referred_name}</p>
                    <Badge className={STATUS_COLORS[referral.status] || ""}>
                      {STATUS_LABELS[referral.status] || referral.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-primary font-medium">
                    +{referral.discount_percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}