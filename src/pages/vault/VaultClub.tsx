import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Crown, Shield, Sparkles, Gift, Copy, CheckCircle2, 
  TrendingUp, Users, Package, Percent, ArrowRight, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";

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

const tierConfig = {
  member: { 
    name: "Vault Access", 
    icon: Shield, 
    color: "text-muted-foreground",
    bgGradient: "from-muted/20 to-card",
    nextTier: "Vault Privilege",
  },
  collector: { 
    name: "Vault Privilege", 
    icon: Crown, 
    color: "text-primary",
    bgGradient: "from-primary/10 to-card",
    nextTier: "Vault Black",
  },
  elite: { 
    name: "Vault Black", 
    icon: Sparkles, 
    color: "text-foreground",
    bgGradient: "from-primary/5 to-background",
    nextTier: null,
  },
};

export default function VaultClub() {
  const { session } = useClientAuth();
  const context = useOutletContext<{ member: VaultMember | null; refreshMember: () => void }>();
  const { toast } = useToast();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (session?.cpf) {
      fetchInvites();
    }
  }, [session?.cpf]);

  const fetchInvites = async () => {
    if (!session?.cpf) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_invites", { p_cpf: session.cpf });
      
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
    const member = context?.member;
    
    if (!member || member.invites_remaining <= 0) {
      toast({
        title: "Sem convites disponíveis",
        description: "Você já usou todos os convites deste semestre",
        variant: "destructive",
      });
      return;
    }

    if (!session?.cpf) return;

    setIsGenerating(true);
    
    try {
      // Use RPC function to create invite
      const { data, error } = await supabase
        .rpc("create_vault_invite", { p_cpf: session.cpf });
      
      if (error) throw error;
      
      if (!data || data.length === 0 || !data[0].success) {
        throw new Error("Falha ao criar convite");
      }

      toast({
        title: "Convite gerado!",
        description: "Compartilhe o código com quem você deseja convidar",
      });

      fetchInvites();
      context?.refreshMember();
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

  const member = context?.member;
  const tierInfo = member ? tierConfig[member.tier] : tierConfig.member;

  // Calculate eligibility progress
  const purchasesProgress = member ? Math.min((member.stats_purchases_count_12m / 3) * 100, 100) : 0;
  const decisionProgress = member ? Math.min((member.stats_decision_rate / 0.5) * 100, 100) : 0;
  const invitesProgress = member ? Math.min((member.stats_converted_invites / 1) * 100, 100) : 0;

  if (isLoading && !member) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Tier Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`bg-gradient-to-br ${tierInfo.bgGradient} border-border overflow-hidden`}>
          <CardContent className="p-6">
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
                  <Badge variant="outline" className="border-border text-muted-foreground">
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
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Progresso para evolução</CardTitle>
            <CardDescription>
              Cumpra 2 de 3 critérios para avançar de tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Compras (12 meses)</span>
                <span className={purchasesProgress >= 100 ? "text-success" : ""}>
                  {member?.stats_purchases_count_12m || 0}/3
                </span>
              </div>
              <Progress value={purchasesProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Taxa de decisão</span>
                <span className={decisionProgress >= 100 ? "text-success" : ""}>
                  {Math.round((member?.stats_decision_rate || 0) * 100)}%/50%
                </span>
              </div>
              <Progress value={decisionProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Indicações convertidas</span>
                <span className={invitesProgress >= 100 ? "text-success" : ""}>
                  {member?.stats_converted_invites || 0}/1
                </span>
              </div>
              <Progress value={invitesProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invites Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Vault Pass
              </CardTitle>
              <CardDescription>
                Convide amigos para o Vault Club
              </CardDescription>
            </div>
            <Button
              onClick={generateInvite}
              disabled={isGenerating || !member || member.invites_remaining <= 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-mono text-sm">{invite.invite_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {invite.status === "used" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 inline mr-1 text-success" />
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

      {/* Rules Link */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Link
            to="/regras-marketplace"
            className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/80 transition"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Código do Vault</p>
                <p className="text-xs text-muted-foreground">Regras e políticas do clube</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}