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
  FileText,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { StreakWidget } from "./StreakWidget";
import { MemberRanking } from "./MemberRanking";

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

const ALL_ACHIEVEMENTS = [
  { type: "first_purchase", name: "Primeiro Passo", icon: "shield", hint: "Faça sua primeira compra" },
  { type: "collector_3", name: "Colecionador", icon: "crown", hint: "Tenha 3 itens na coleção" },
  { type: "collector_10", name: "Curador Expert", icon: "star", hint: "Tenha 10 itens na coleção" },
  { type: "community_post", name: "Voz da Comunidade", icon: "zap", hint: "Faça seu primeiro post" },
  { type: "invite_converted", name: "Embaixador", icon: "award", hint: "Converta um convite" },
  { type: "review_given", name: "Crítico", icon: "star", hint: "Avalie um pedido" },
  { type: "wishlist_match", name: "Match Perfeito", icon: "zap", hint: "Aceite um match da wishlist" },
  { type: "tier_privilege", name: "Privilege", icon: "crown", hint: "Alcance o tier Privilege" },
  { type: "tier_black", name: "Black Member", icon: "star", hint: "Alcance o tier Black" },
  { type: "marketplace_sale", name: "Vendedor", icon: "award", hint: "Faça uma venda no marketplace" },
  { type: "streak_30d", name: "Engajado", icon: "zap", hint: "Acesse 30 dias seguidos" },
  { type: "referral_5", name: "Influenciador", icon: "crown", hint: "Converta 5 indicações" },
];

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
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(
      `${baseUrl}/vault/redeem?code=${code}`
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
      {/* Daily Streak */}
      <StreakWidget clientCpf={clientCpf} />

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Evolution Progress */}
        {member?.tier !== "elite" && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Progresso para evolução
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Cumpra 2 de 3 critérios para subir de tier
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Compras</span>
                    <Badge
                      variant={purchasesProgress >= 100 ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        purchasesProgress >= 100 && "bg-success"
                      )}
                    >
                      {member?.stats_purchases_count_12m || 0}/3
                    </Badge>
                  </div>
                  <Progress value={purchasesProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Últimos 12 meses
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Decisão</span>
                    <Badge
                      variant={decisionProgress >= 100 ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        decisionProgress >= 100 && "bg-success"
                      )}
                    >
                      {Math.round((member?.stats_decision_rate || 0) * 100)}%
                    </Badge>
                  </div>
                  <Progress value={decisionProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">Meta: 50%</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Indicações</span>
                    <Badge
                      variant={invitesProgress >= 100 ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        invitesProgress >= 100 && "bg-success"
                      )}
                    >
                      {member?.stats_converted_invites || 0}/1
                    </Badge>
                  </div>
                  <Progress value={invitesProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Convertidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SLA Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              SLA de atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">
                  Primeiro retorno
                </span>
                <span className="text-sm font-medium">
                  {tierInfo.slaFirstResponse}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">
                  Updates de curadoria
                </span>
                <span className="text-sm font-medium">{tierInfo.slaUpdate}</span>
              </div>
              <div className="flex justify-between items-center py-2">
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
              Benefícios do tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-2xl font-bold">
                  {member?.max_active_hunts || 1}
                </p>
                <p className="text-xs text-muted-foreground">Buscas ativas</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-2xl font-bold">
                  {member?.max_wishlist_items || 3}
                </p>
                <p className="text-xs text-muted-foreground">Wishlist</p>
              </div>
            </div>

            {member?.tier === "elite" && (
              <div className="space-y-2">
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
                    Curadoria por perfil
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Janela de decisão 24h
                  </li>
                </ul>
              </div>
            )}

            {member?.tier === "collector" && (
              <div className="space-y-2">
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
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Vault Pass
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Convide amigos e ganhe buscas extras
                </p>
              </div>
              <Button
                onClick={generateInvite}
                disabled={
                  isGenerating || !member || member.invites_remaining <= 0
                }
                size="sm"
                className="btn-gold"
              >
                {isGenerating ? "Gerando..." : "Gerar convite"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum convite gerado ainda</p>
                <p className="text-xs mt-1">
                  Gere um convite e compartilhe com amigos
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 bg-muted/30 border border-border/30 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm truncate">
                        {invite.invite_code}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {invite.status === "used" ? (
                          <span className="flex items-center gap-1 text-success">
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

      {/* Achievements Tracker — Premium */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Conquistas
          </CardTitle>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground">
              {badges.length} de {ALL_ACHIEVEMENTS.length} desbloqueadas
            </p>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {Math.round((badges.length / ALL_ACHIEVEMENTS.length) * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Progress
              value={(badges.length / ALL_ACHIEVEMENTS.length) * 100}
              className="h-2.5"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ALL_ACHIEVEMENTS.map((achievement, index) => {
              const earned = badges.find(
                (b) => b.badge_type === achievement.type
              );
              const AchIcon =
                badgeIcons[achievement.icon] || Award;
              return (
                <motion.div
                  key={achievement.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04, type: "spring", stiffness: 200, damping: 15 }}
                  whileHover={earned ? { scale: 1.05, y: -2 } : undefined}
                  className={cn(
                    "relative p-4 rounded-xl border text-center transition-all cursor-default group",
                    earned
                      ? "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/40 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.15)]"
                      : "bg-muted/10 border-border/20 opacity-40 grayscale"
                  )}
                >
                  {/* Golden glow ring for earned */}
                  {earned && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}
                  <div
                    className={cn(
                      "relative h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2.5 transition-all",
                      earned
                        ? "bg-gradient-to-br from-primary/30 to-primary/10 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]"
                        : "bg-muted/30"
                    )}
                  >
                    <AchIcon
                      className={cn(
                        "h-5 w-5 transition-transform",
                        earned ? "text-primary group-hover:scale-110" : "text-muted-foreground"
                      )}
                    />
                    {earned && (
                      <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-primary bg-card rounded-full" />
                    )}
                  </div>
                  <p className={cn("text-sm font-semibold", earned ? "text-foreground" : "text-muted-foreground")}>{achievement.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    {earned
                      ? new Date(earned.earned_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
                      : achievement.hint}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Member Ranking */}
      <MemberRanking currentMemberId={member?.id} />

      {/* Rules Link */}
      <Card>
        <CardContent className="py-4">
          <a
            href="/regras-marketplace"
            className="flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Código do Vault</p>
                <p className="text-xs text-muted-foreground">
                  Regras e políticas do clube
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
