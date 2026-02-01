import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, Shield, Sparkles, Gift, Copy, CheckCircle2, 
  TrendingUp, Award, Clock, Search, Users, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VaultMember {
  id: string;
  tier: "member" | "collector" | "elite";
  total_purchases: number;
  invites_remaining: number;
  max_active_hunts: number;
  max_wishlist_items: number;
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

interface VaultBadge {
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
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
    slaFirstResponse: "24h úteis",
    slaUpdate: "72h úteis",
    slaMatchRoom: "48h úteis",
  },
  collector: { 
    name: "Vault Privilege", 
    icon: Crown, 
    color: "text-amber-500",
    bgGradient: "from-amber-500/10 to-amber-500/5",
    nextTier: "Vault Black",
    slaFirstResponse: "12h úteis",
    slaUpdate: "48h úteis",
    slaMatchRoom: "24h úteis",
  },
  elite: { 
    name: "Vault Black", 
    icon: Sparkles, 
    color: "text-primary",
    bgGradient: "from-primary/10 to-primary/5",
    nextTier: null,
    slaFirstResponse: "6h úteis",
    slaUpdate: "24h úteis",
    slaMatchRoom: "12h úteis",
  },
};

const badgeIcons: Record<string, any> = {
  crown: Crown,
  star: Sparkles,
  shield: Shield,
  award: Award,
  zap: Zap,
};

export function VaultClubTab({ clientCpf, member, onMemberUpdate }: VaultClubTabProps) {
  const { toast } = useToast();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [badges, setBadges] = useState<VaultBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [clientCpf]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invitesRes, badgesRes] = await Promise.all([
        supabase.rpc("get_vault_invites", { p_cpf: clientCpf }),
        supabase.rpc("get_vault_badges", { p_cpf: clientCpf }),
      ]);
      
      if (!invitesRes.error && invitesRes.data) {
        setInvites(invitesRes.data as unknown as Invite[]);
      }
      if (!badgesRes.error && badgesRes.data) {
        setBadges(badgesRes.data as unknown as VaultBadge[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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

      fetchData();
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
    <Tabs defaultValue="status" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="benefits">Benefícios</TabsTrigger>
        <TabsTrigger value="invites">Convites</TabsTrigger>
        {badges.length > 0 && <TabsTrigger value="badges">Badges</TabsTrigger>}
      </TabsList>

      {/* Status Tab */}
      <TabsContent value="status" className="space-y-4">
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
      </TabsContent>

      {/* Benefits Tab */}
      <TabsContent value="benefits" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <tierInfo.icon className={`h-5 w-5 ${tierInfo.color}`} />
              Benefícios {tierInfo.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Search className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{member?.max_active_hunts || 1}</p>
                  <p className="text-xs text-muted-foreground">Buscas simultâneas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{member?.invites_remaining || 0}</p>
                  <p className="text-xs text-muted-foreground">Convites/semestre</p>
                </div>
              </div>
            </div>

            {/* SLA */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                SLA de atendimento
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeiro retorno</span>
                  <span className="font-medium">{tierInfo.slaFirstResponse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequência de updates</span>
                  <span className="font-medium">{tierInfo.slaUpdate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Match Room</span>
                  <span className="font-medium">{tierInfo.slaMatchRoom}</span>
                </div>
              </div>
            </div>

            {/* Extra benefits */}
            {member?.tier === "elite" && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Exclusivo Black</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Concierge dedicado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Curadoria personalizada mensal
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Janela de decisão de 24h
                  </li>
                </ul>
              </div>
            )}
            {member?.tier === "collector" && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Exclusivo Privilege</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    Match Room com comparativo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    Janela de decisão de 12h
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    Prioridade operacional
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Invites Tab */}
      <TabsContent value="invites" className="space-y-4">
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

        {/* Reward info */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              Quando um convidado fizer a primeira compra, você ganha <strong>+1 busca ativa</strong> por 30 dias ou <strong>upgrade de SLA</strong>.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Badges Tab */}
      {badges.length > 0 && (
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge, index) => {
              const IconComponent = badgeIcons[badge.badge_icon] || Award;
              
              return (
                <motion.div
                  key={badge.badge_type + badge.badge_name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="text-center">
                    <CardContent className="pt-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium text-sm">{badge.badge_name}</p>
                      {badge.badge_description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {badge.badge_description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(badge.earned_at).toLocaleDateString("pt-BR")}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
