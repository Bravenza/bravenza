import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, Shield, Sparkles, Gift, Copy, CheckCircle2, 
  TrendingUp, Award, Clock, Search, Users, Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    borderColor: "border-muted-foreground/30",
    bgColor: "bg-muted/20",
    nextTier: "Vault Privilege",
    slaFirstResponse: "24h úteis",
    slaUpdate: "72h úteis",
    slaMatchRoom: "48h úteis",
  },
  collector: { 
    name: "Vault Privilege", 
    icon: Crown, 
    color: "text-amber-500",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    nextTier: "Vault Black",
    slaFirstResponse: "12h úteis",
    slaUpdate: "48h úteis",
    slaMatchRoom: "24h úteis",
  },
  elite: { 
    name: "Vault Black", 
    icon: Sparkles, 
    color: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/10",
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
    <div className="space-y-6">
      {/* Tier Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border ${tierInfo.borderColor} ${tierInfo.bgColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${tierInfo.bgColor}`}>
              <tierInfo.icon className={`h-6 w-6 ${tierInfo.color}`} />
            </div>
            <div>
              <h3 className={`font-bold ${tierInfo.color}`}>{tierInfo.name}</h3>
              <p className="text-sm text-muted-foreground">
                {member?.total_purchases || 0} compras no Vault
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">{member?.invites_remaining || 0}</p>
            <p className="text-xs text-muted-foreground">convites</p>
          </div>
        </div>
        {tierInfo.nextTier && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Próximo: {tierInfo.nextTier}
            </Badge>
          </div>
        )}
      </motion.div>

      {/* Sub-navigation */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="w-full h-auto p-1 bg-muted/30 rounded-lg grid grid-cols-4 gap-1">
          <TabsTrigger value="status" className="text-xs py-2 rounded-md">Status</TabsTrigger>
          <TabsTrigger value="benefits" className="text-xs py-2 rounded-md">Benefícios</TabsTrigger>
          <TabsTrigger value="invites" className="text-xs py-2 rounded-md">Convites</TabsTrigger>
          <TabsTrigger value="badges" className="text-xs py-2 rounded-md" disabled={badges.length === 0}>Badges</TabsTrigger>
        </TabsList>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4 mt-4">
          {/* Eligibility Progress (only for non-elite) */}
          {member?.tier !== "elite" ? (
            <Card className="border-dashed">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Progresso para evolução</h4>
                  <span className="text-xs text-muted-foreground">2 de 3 critérios</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Compras (12 meses)</span>
                      <span className={purchasesProgress >= 100 ? "text-green-500 font-medium" : ""}>
                        {member?.stats_purchases_count_12m || 0}/3
                      </span>
                    </div>
                    <Progress value={purchasesProgress} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Taxa de decisão</span>
                      <span className={decisionProgress >= 100 ? "text-green-500 font-medium" : ""}>
                        {Math.round((member?.stats_decision_rate || 0) * 100)}%/50%
                      </span>
                    </div>
                    <Progress value={decisionProgress} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Indicações convertidas</span>
                      <span className={invitesProgress >= 100 ? "text-green-500 font-medium" : ""}>
                        {member?.stats_converted_invites || 0}/1
                      </span>
                    </div>
                    <Progress value={invitesProgress} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-6 text-center">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold">Você está no nível máximo!</h4>
                <p className="text-sm text-muted-foreground">Aproveite todos os benefícios exclusivos do Vault Black.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-4 mt-4">
          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <Search className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{member?.max_active_hunts || 1}</p>
              <p className="text-xs text-muted-foreground">Buscas simultâneas</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <Gift className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{member?.invites_remaining || 0}</p>
              <p className="text-xs text-muted-foreground">Convites/semestre</p>
            </div>
          </div>

          {/* SLA */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">SLA de Atendimento</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Primeiro retorno</span>
                  <span className="font-medium">{tierInfo.slaFirstResponse}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Updates de curadoria</span>
                  <span className="font-medium">{tierInfo.slaUpdate}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Match Room</span>
                  <span className="font-medium">{tierInfo.slaMatchRoom}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extra benefits */}
          {member?.tier === "elite" && (
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Exclusivo Black
                </h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Concierge dedicado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Curadoria personalizada mensal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Janela de decisão de 24h</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
          {member?.tier === "collector" && (
            <Card className="border-amber-500/20">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Exclusivo Privilege
                </h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-muted-foreground">Match Room com comparativo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-muted-foreground">Janela de decisão de 12h</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-muted-foreground">Prioridade operacional</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="space-y-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Vault Pass
              </h4>
              <p className="text-xs text-muted-foreground">Convide amigos para o Vault Club</p>
            </div>
            <Button
              onClick={generateInvite}
              disabled={isGenerating || !member || member.invites_remaining <= 0}
              size="sm"
              className="h-8"
            >
              {isGenerating ? "Gerando..." : "Gerar"}
            </Button>
          </div>

          {invites.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Gift className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não gerou nenhum convite
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm truncate">{invite.invite_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {invite.status === "used" ? (
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Usado por {invite.recipient_name || "alguém"}
                        </span>
                      ) : (
                        <>Expira em {new Date(invite.expires_at).toLocaleDateString("pt-BR")}</>
                      )}
                    </p>
                  </div>
                  {invite.status !== "used" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyInviteCode(invite.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reward info */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">
              Quando um convidado fizer a primeira compra, você ganha <span className="text-foreground font-medium">+1 busca ativa</span> por 30 dias ou <span className="text-foreground font-medium">upgrade de SLA</span>.
            </p>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((badge, index) => {
                const IconComponent = badgeIcons[badge.badge_icon] || Award;
                
                return (
                  <motion.div
                    key={badge.badge_type + badge.badge_name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium text-sm">{badge.badge_name}</p>
                    {badge.badge_description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {badge.badge_description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(badge.earned_at).toLocaleDateString("pt-BR")}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Award className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não conquistou nenhum badge
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
