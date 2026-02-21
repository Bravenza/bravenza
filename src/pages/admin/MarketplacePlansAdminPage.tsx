import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown, Shield, Zap, Save, Loader2, Percent, Package, Sparkles,
  Rocket, Headphones, Star, Gauge, Search, RefreshCw, UserCog, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PlanRow {
  id: string;
  name: string;
  price_monthly: number;
  fee_percent: number;
  max_active_listings: number | null;
  max_new_listings_month: number | null;
  boost_slots: number;
  support_sla_hours: number;
  has_storefront: boolean;
  has_verified_badge: boolean;
  has_batch_tools: boolean;
  has_priority_search: boolean;
  is_active: boolean;
  features: string[];
}

const planIcons: Record<string, any> = { free: Shield, pro: Zap, elite: Crown };
const planColors: Record<string, string> = {
  free: "border-border/30",
  pro: "border-primary/40",
  elite: "border-primary ring-1 ring-primary/30",
};

export default function MarketplacePlansAdminPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editedPlans, setEditedPlans] = useState<Record<string, PlanRow>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_plans")
      .select("*")
      .order("price_monthly", { ascending: true });

    if (data) {
      const parsed = data.map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || "[]"),
      }));
      setPlans(parsed);
      const map: Record<string, PlanRow> = {};
      parsed.forEach((p: PlanRow) => { map[p.id] = { ...p }; });
      setEditedPlans(map);
    }
    if (error) toast.error("Erro ao carregar planos");
    setIsLoading(false);
  };

  const handleChange = (planId: string, field: keyof PlanRow, value: any) => {
    setEditedPlans((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const handleSave = async (planId: string) => {
    setSavingId(planId);
    const plan = editedPlans[planId];
    const { error } = await supabase
      .from("marketplace_plans")
      .update({
        name: plan.name,
        price_monthly: plan.price_monthly,
        fee_percent: plan.fee_percent,
        max_active_listings: plan.max_active_listings,
        max_new_listings_month: plan.max_new_listings_month,
        boost_slots: plan.boost_slots,
        support_sla_hours: plan.support_sla_hours,
        has_storefront: plan.has_storefront,
        has_verified_badge: plan.has_verified_badge,
        has_batch_tools: plan.has_batch_tools,
        has_priority_search: plan.has_priority_search,
        is_active: plan.is_active,
        features: plan.features as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (error) {
      toast.error("Erro ao salvar plano");
    } else {
      toast.success(`Plano ${plan.name} atualizado!`);
      fetchPlans();
    }
    setSavingId(null);
  };

  const hasChanges = (planId: string) => {
    const original = plans.find((p) => p.id === planId);
    const edited = editedPlans[planId];
    if (!original || !edited) return false;
    return JSON.stringify(original) !== JSON.stringify(edited);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Planos do Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie preços, limites e benefícios dos planos de vendedor.
          </p>
        </div>
        <Button variant="outline" onClick={fetchPlans} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const edited = editedPlans[plan.id];
          if (!edited) return null;
          const Icon = planIcons[plan.id] || Shield;
          const changed = hasChanges(plan.id);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`${planColors[plan.id]} relative`}>
                {changed && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="text-[10px] bg-warning text-warning-foreground">
                      Alterado
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>ID: {plan.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price & Fee */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <span>💰</span> Preço/mês (R$)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={edited.price_monthly}
                        onChange={(e) => handleChange(plan.id, "price_monthly", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Percent className="h-3 w-3" /> Comissão (%)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={edited.fee_percent}
                        onChange={(e) => handleChange(plan.id, "fee_percent", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Package className="h-3 w-3" /> Ativos (max)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="∞"
                        value={edited.max_active_listings ?? ""}
                        onChange={(e) => handleChange(plan.id, "max_active_listings", e.target.value === "" ? null : Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Novos/mês (max)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="∞"
                        value={edited.max_new_listings_month ?? ""}
                        onChange={(e) => handleChange(plan.id, "max_new_listings_month", e.target.value === "" ? null : Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Boost & SLA */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Rocket className="h-3 w-3" /> Boost slots
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={edited.boost_slots}
                        onChange={(e) => handleChange(plan.id, "boost_slots", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Headphones className="h-3 w-3" /> SLA (horas)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={edited.support_sla_hours}
                        onChange={(e) => handleChange(plan.id, "support_sla_hours", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Boolean features */}
                  <div className="space-y-3">
                    {[
                      { key: "has_storefront" as const, label: "Vitrine / Coleções", icon: Star },
                      { key: "has_verified_badge" as const, label: "Selo Verificado", icon: Shield },
                      { key: "has_batch_tools" as const, label: "Ferramentas de Lote", icon: Gauge },
                      { key: "has_priority_search" as const, label: "Prioridade na Busca", icon: Search },
                      { key: "is_active" as const, label: "Plano Ativo", icon: Zap },
                    ].map(({ key, label, icon: FIcon }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <FIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {label}
                        </div>
                        <Switch
                          checked={edited[key] as boolean}
                          onCheckedChange={(v) => handleChange(plan.id, key, v)}
                        />
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Save */}
                  <Button
                    className="w-full gap-2"
                    disabled={!changed || savingId === plan.id}
                    onClick={() => handleSave(plan.id)}
                  >
                    {savingId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar alterações
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Subscription stats */}
      <SubscriptionStats />

      {/* Fee Tiers */}
      <FeeTiersManager />

      {/* Seller Management */}
      <SellerSubscriptionManager />
    </div>
  );
}

function SubscriptionStats() {
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("marketplace_subscriptions")
        .select("plan_id, status")
        .neq("plan_id", "free");

      if (data) {
        const grouped: Record<string, Record<string, number>> = {};
        data.forEach((s: any) => {
          if (!grouped[s.plan_id]) grouped[s.plan_id] = {};
          grouped[s.plan_id][s.status] = (grouped[s.plan_id][s.status] || 0) + 1;
        });
        setStats(Object.entries(grouped).map(([plan, statuses]) => ({ plan, ...statuses })));
      }
    }
    fetch();
  }, []);

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assinaturas ativas</CardTitle>
        <CardDescription>Visão geral das assinaturas dos vendedores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.plan} className="p-3 rounded-lg border bg-card/50 text-center">
              <p className="text-xs text-muted-foreground uppercase font-medium">{s.plan}</p>
              <p className="text-2xl font-black mt-1">{s.active || 0}</p>
              <p className="text-[10px] text-muted-foreground">ativas</p>
              {s.past_due > 0 && (
                <Badge variant="outline" className="text-[10px] mt-1 border-warning/50 text-warning">
                  {s.past_due} inadimplentes
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeeTiersManager() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    const { data } = await supabase
      .from("marketplace_fee_tiers")
      .select("*")
      .order("plan_id")
      .order("min_sales", { ascending: true });
    if (data) setTiers(data);
  };

  const handleTierChange = (id: string, field: string, value: number) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const tier of tiers) {
      await supabase.from("marketplace_fee_tiers").update({
        min_sales: tier.min_sales,
        fee_discount: tier.fee_discount,
      }).eq("id", tier.id);
    }
    toast.success("Faixas de desconto atualizadas!");
    setSaving(false);
  };

  const proTiers = tiers.filter(t => t.plan_id === "pro");
  const eliteTiers = tiers.filter(t => t.plan_id === "elite");

  if (tiers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          Desconto progressivo por vendas
        </CardTitle>
        <CardDescription>
          Nos planos pagos, a comissão diminui automaticamente conforme o volume de vendas. 
          O plano Free mantém taxa fixa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{ label: "Pro", tiers: proTiers }, { label: "Elite", tiers: eliteTiers }].map(({ label, tiers: planTiers }) => (
            <div key={label}>
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1">
                {label === "Pro" ? <Zap className="h-4 w-4 text-primary" /> : <Crown className="h-4 w-4 text-primary" />}
                {label}
              </h4>
              <div className="space-y-2">
                {planTiers.map((tier) => (
                  <div key={tier.id} className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <Label className="text-xs">A partir de X vendas</Label>
                      <Input
                        type="number"
                        min={0}
                        value={tier.min_sales}
                        onChange={(e) => handleTierChange(tier.id, "min_sales", Number(e.target.value))}
                        className="mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Desconto (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={tier.fee_discount}
                        onChange={(e) => handleTierChange(tier.id, "fee_discount", Number(e.target.value))}
                        className="mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-4 gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar faixas
        </Button>
      </CardContent>
    </Card>
  );
}

function SellerSubscriptionManager() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("vault_seller_profiles")
      .select("id, plan_id, total_sales_count, total_sales_value, current_fee_percent, kyc_status, verified_badge, member_id")
      .order("total_sales_value", { ascending: false })
      .limit(50);

    if (data) {
      // Fetch member names
      const memberIds = data.map(s => s.member_id).filter(Boolean);
      const { data: members } = await supabase
        .from("vault_members")
        .select("id, client_name, client_email, tier")
        .in("id", memberIds);

      const memberMap = new Map((members || []).map(m => [m.id, m]));
      setSellers(data.map(s => ({ ...s, member: memberMap.get(s.member_id) })));
    }
    setIsLoading(false);
  };

  const handlePlanChange = async (sellerId: string, newPlan: string) => {
    setUpdatingId(sellerId);
    const { error } = await supabase
      .from("vault_seller_profiles")
      .update({ plan_id: newPlan })
      .eq("id", sellerId);

    if (error) {
      toast.error("Erro ao atualizar plano");
    } else {
      toast.success("Plano atualizado!");
      fetchSellers();
    }
    setUpdatingId(null);
  };

  const filtered = sellers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (s.member?.client_name || "").toLowerCase().includes(q) ||
      (s.member?.client_email || "").toLowerCase().includes(q);
  });

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      pro: "bg-primary/20 text-primary",
      elite: "bg-primary/30 text-primary font-bold",
    };
    return colors[plan] || colors.free;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCog className="h-5 w-5 text-primary" />
          Gerenciar Vendedores
        </CardTitle>
        <CardDescription>Visualize e altere planos individualmente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Nenhum vendedor encontrado</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{s.member?.client_name || "Vendedor"}</p>
                  <p className="text-xs text-muted-foreground">{s.member?.client_email || ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${planBadge(s.plan_id || "free")} text-[10px]`}>
                      {s.plan_id || "free"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {s.total_sales_count} vendas · R$ {(s.total_sales_value || 0).toLocaleString("pt-BR")} · {s.current_fee_percent}%
                    </span>
                    {s.verified_badge && <Shield className="h-3 w-3 text-primary" />}
                    {s.kyc_status === "approved" && <Badge variant="outline" className="text-[10px]">KYC ✓</Badge>}
                  </div>
                </div>
                <Select
                  value={s.plan_id || "free"}
                  onValueChange={(v) => handlePlanChange(s.id, v)}
                  disabled={updatingId === s.id}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
