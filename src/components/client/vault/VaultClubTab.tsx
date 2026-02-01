import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, Shield, Sparkles, Gift, Copy, CheckCircle2, 
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VaultMember {
  id: string;
  tier: "member" | "collector" | "elite";
  total_purchases: number;
  invites_remaining: number;
  stats_purchases_count_12m: number;
  stats_spend_total_12m: number;
  stats_decision_rate: number;
  stats_converted_invites: number;
}

interface Invite {
  id: string;
  invite_code: string;
  recipient_name: string | null;
  status: string;
  used_at: string | null;
  expires_at: string;
  reward_granted: boolean;
  created_at: string;
}

interface VaultClubTabProps {
  clientCpf: string;
  member: VaultMember | null;
  onMemberUpdate: () => void;
}

const tierConfig = {
  member: { 
    name: "Vault Access", 
    icon: Shield, 
    color: "text-muted-foreground",
    bgGradient: "from-muted/50 to-muted/20",
    nextTier: "Vault Privilege",
  },
  collector: { 
    name: "Vault Privilege", 
    icon: Crown, 
    color: "text-amber-500",
    bgGradient: "from-amber-500/10 to-amber-500/5",
    nextTier: "Vault Black",
  },
  elite: { 
    name: "Vault Black", 
    icon: Sparkles, 
    color: "text-primary",
    bgGradient: "from-primary/10 to-primary/5",
    nextTier: null,
  },
};

export function VaultClubTab({ clientCpf, member, onMemberUpdate }: VaultClubTabProps) {
  const { toast } = useToast();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [clientCpf]);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_invites", { p_cpf: clientCpf });
      
      if (!error && data) {
        setInvites(data as unknown as Invite[]);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvite = async () => {
    if (!member || member.invites_remaining <= 0) {
      toast({
        title: "Sem convites disponíveis",
        description: "Você já usou todos os convites deste semestre",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase
        .rpc("create_vault_invite", { p_cpf: clientCpf });
      
      if (error) throw error;
      
      if (!data || data.length === 0 || !data[0].success) {
        throw new Error("Falha ao criar convite");
      }

      toast({
        title: "Convite gerado!",
        description: "Compartilhe o código com quem você deseja convidar",
      });

      fetchInvites();
      onMemberUpdate();
    } catch (error) {
      console.error("Error generating invite:", error);
      toast({
        title: "Erro ao gerar convite",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(`https://bravenza.lovable.app/vault/redeem?code=${code}`);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com quem você deseja convidar",
    });
  };

  const tierInfo = member ? tierConfig[member.tier] : tierConfig.member;

  // Calculate eligibility progress
  const purchasesProgress = member ? Math.min((member.stats_purchases_count_12m / 3) * 100, 100) : 0;
  const decisionProgress = member ? Math.min((member.stats_decision_rate / 0.5) * 100, 100) : 0;
  const invitesProgress = member ? Math.min((member.stats_converted_invites / 1) * 100, 100) : 0;

  if (isLoading && !member) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tier Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`bg-gradient-to-br ${tierInfo.bgGradient} overflow-hidden`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <tierInfo.icon className={`h-6 w-6 ${tierInfo.color}`} />
                  <span className={`text-lg font-bold ${tierInfo.color}`}>{tierInfo.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {member?.total_purchases || 0} compras no Vault
                </p>
                {tierInfo.nextTier && (
                  <Badge variant="outline">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Próximo: {tierInfo.nextTier}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{member?.invites_remaining || 0}</p>
                <p className="text-xs text-muted-foreground">convites restantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Eligibility Progress (only for non-elite) */}
      {member?.tier !== "elite" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progresso para evolução</CardTitle>
            <CardDescription className="text-xs">
              Cumpra 2 de 3 critérios para avançar de tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Compras (12 meses)</span>
                <span className={purchasesProgress >= 100 ? "text-green-500" : ""}>
                  {member?.stats_purchases_count_12m || 0}/3
                </span>
              </div>
              <Progress value={purchasesProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Taxa de decisão</span>
                <span className={decisionProgress >= 100 ? "text-green-500" : ""}>
                  {Math.round((member?.stats_decision_rate || 0) * 100)}%/50%
                </span>
              </div>
              <Progress value={decisionProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Indicações convertidas</span>
                <span className={invitesProgress >= 100 ? "text-green-500" : ""}>
                  {member?.stats_converted_invites || 0}/1
                </span>
              </div>
              <Progress value={invitesProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invites Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Vault Pass
              </CardTitle>
              <CardDescription className="text-xs">
                Convide amigos para o Vault Club
              </CardDescription>
            </div>
            <Button
              onClick={generateInvite}
              disabled={isGenerating || !member || member.invites_remaining <= 0}
              size="sm"
            >
              {isGenerating ? "Gerando..." : "Gerar convite"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Você ainda não gerou nenhum convite
            </p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-mono text-sm">{invite.invite_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {invite.status === "used" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />
                          Usado por {invite.recipient_name || "alguém"}
                        </>
                      ) : (
                        <>Expira em {new Date(invite.expires_at).toLocaleDateString("pt-BR")}</>
                      )}
                    </p>
                  </div>
                  {invite.status !== "used" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteCode(invite.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
