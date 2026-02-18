import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown, Shield, Zap, Save, Loader2, Percent, Package, Sparkles,
  Rocket, Headphones, Star, Gauge, Search, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
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
