import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Shield,
  Sparkles,
  Gift,
  Copy,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  Search,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
    gradient: "from-muted/20 to-transparent",
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
    gradient: "from-amber-500/10 to-transparent",
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
    gradient: "from-primary/10 to-transparent",
    nextTier: null,
    slaFirstResponse: "6h úteis",
    slaUpdate: "24h úteis",
    slaMatchRoom: "12h úteis",
  },
};

const badgeIcons: Record<string, React.ElementType> = {
  crown: Crown,
  star: Sparkles,
  shield: Shield,
  award: Award,
  zap: Zap,
};

export function VaultClubTab({
  clientCpf,
  member,
  onMemberUpdate,
}: VaultClubTabProps) {
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
      const { data, error } = await supabase.rpc("create_vault_invite", {
        p_cpf: clientCpf,
      });

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
    navigator.clipboard.writeText(
      `https://bravenza.lovable.app/vault/redeem?code=${code}`
    );
    toast({
      title: "Link copiado!",
      description: "Compartilhe com quem você deseja convidar",
    });
  };

  const tierInfo = member ? tierConfig[member.tier] : tierConfig.member;

  // Calculate eligibility progress
  const purchasesProgress = member
    ? Math.min((member.stats_purchases_count_12m / 3) * 100, 100)
    : 0;
  const decisionProgress = member
    ? Math.min((member.stats_decision_rate / 0.5) * 100, 100)
    : 0;
  const invitesProgress = member
    ? Math.min((member.stats_converted_invites / 1) * 100, 100)
    : 0;

  if (isLoading && !member) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Status Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-6 rounded-2xl border-2 bg-gradient-to-br",
          tierInfo.borderColor,
          tierInfo.gradient
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-4 rounded-xl",
                tierInfo.bgColor
              )}
            >
              <tierInfo.icon className={cn("h-8 w-8", tierInfo.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seu nível</p>
              <h2 className={cn("text-2xl font-bold", tierInfo.color)}>
                {tierInfo.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {member?.total_purchases || 0} compras no Vault
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold">{member?.max_active_hunts || 1}</p>
              <p className="text-xs text-muted-foreground">Buscas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{member?.invites_remaining || 0}</p>
              <p className="text-xs text-muted-foreground">Convites</p>
            </div>
          </div>
        </div>
        {tierInfo.nextTier && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <Badge variant="outline" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              Próximo: {tierInfo.nextTier}
            </Badge>
          </div>
        )}
      </motion.div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Evolution Progress */}
        {member?.tier !== "elite" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Progresso para evolução
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Cumpra 2 de 3 critérios
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Compras (12 meses)</span>
                  <span
                    className={cn(
                      "font-medium",
                      purchasesProgress >= 100 && "text-green-500"
                    )}
                  >
                    {member?.stats_purchases_count_12m || 0}/3
                  </span>
                </div>
                <Progress value={purchasesProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Taxa de decisão</span>
                  <span
                    className={cn(
                      "font-medium",
                      decisionProgress >= 100 && "text-green-500"
                    )}
                  >
                    {Math.round((member?.stats_decision_rate || 0) * 100)}%/50%
                  </span>
                </div>
                <Progress value={decisionProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Indicações convertidas
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      invitesProgress >= 100 && "text-green-500"
                    )}
                  >
                    {member?.stats_converted_invites || 0}/1
                  </span>
                </div>
                <Progress value={invitesProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* SLA Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              SLA de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">
                  Primeiro retorno
                </span>
                <span className="text-sm font-medium">
                  {tierInfo.slaFirstResponse}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">
                  Updates de curadoria
                </span>
                <span className="text-sm font-medium">{tierInfo.slaUpdate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Match Room</span>
                <span className="text-sm font-medium">
                  {tierInfo.slaMatchRoom}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Benefits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Benefícios do Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-2xl font-bold">{member?.max_active_hunts || 1}</p>
                <p className="text-xs text-muted-foreground">
                  Buscas simultâneas
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-2xl font-bold">
                  {member?.max_wishlist_items || 3}
                </p>
                <p className="text-xs text-muted-foreground">Itens na wishlist</p>
              </div>
            </div>

            {member?.tier === "elite" && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Exclusivo Black
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Concierge dedicado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Curadoria personalizada
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Janela de decisão 24h
                  </li>
                </ul>
              </div>
            )}

            {member?.tier === "collector" && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-amber-500 flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Exclusivo Privilege
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-amber-500" />
                    Match Room comparativo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-amber-500" />
                    Janela de decisão 12h
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-amber-500" />
                    Prioridade operacional
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invites */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Vault Pass
              </CardTitle>
              <Button
                onClick={generateInvite}
                disabled={
                  isGenerating || !member || member.invites_remaining <= 0
                }
                size="sm"
              >
                {isGenerating ? "Gerando..." : "Gerar convite"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Convide amigos para o Vault Club
            </p>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum convite gerado</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm truncate">
                        {invite.invite_code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invite.status === "used" ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Usado
                          </span>
                        ) : (
                          <>
                            Expira em{" "}
                            {new Date(invite.expires_at).toLocaleDateString(
                              "pt-BR"
                            )}
                          </>
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
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">
                Cada convite convertido = +1 busca ativa por 30 dias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map((badge, index) => {
                const BadgeIcon =
                  badgeIcons[badge.badge_icon] || Award;
                return (
                  <motion.div
                    key={badge.badge_type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 text-center"
                  >
                    <BadgeIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">{badge.badge_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.badge_description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
