import { useState, useEffect } from "react";
import { Bot, Play, Pause, Trash2, Plus, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatPriceBR } from "@/lib/budget-calculator";
import { toast } from "sonner";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

interface AutoCutRule {
  id: string;
  offer_id: string;
  min_price: number;
  reduction_amount: number;
  reduction_type: "fixed" | "percent";
  interval_hours: number;
  is_active: boolean;
  last_cut_at: string | null;
  cuts_count: number;
}

interface AutoCutManagerProps {
  sellerId: string;
  listings: MarketplaceListing[];
}

export function AutoCutManager({ sellerId, listings }: AutoCutManagerProps) {
  const [rules, setRules] = useState<(AutoCutRule & { listing?: MarketplaceListing })[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedOffer, setSelectedOffer] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [reductionAmount, setReductionAmount] = useState("5");
  const [reductionType, setReductionType] = useState<"fixed" | "percent">("fixed");
  const [intervalHours, setIntervalHours] = useState("24");

  const activeListings = listings.filter(l => l.status === "active");

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_autocut_rules")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching autocut rules:", error);
    } else {
      const enriched = (data || []).map((rule: any) => ({
        ...rule,
        listing: listings.find(l => l.id === rule.offer_id),
      }));
      setRules(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sellerId) fetchRules();
  }, [sellerId]);

  const offersWithoutRules = activeListings.filter(
    l => !rules.some(r => r.offer_id === l.id)
  );

  const handleCreate = async () => {
    if (!selectedOffer || !minPrice || !reductionAmount) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("marketplace_autocut_rules")
        .insert({
          seller_id: sellerId,
          offer_id: selectedOffer,
          min_price: parseFloat(minPrice),
          reduction_amount: parseFloat(reductionAmount),
          reduction_type: reductionType,
          interval_hours: parseInt(intervalHours),
          is_active: true,
        });

      if (error) throw error;
      toast.success("AutoCut configurado!");
      setCreateOpen(false);
      resetForm();
      fetchRules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar regra");
    }
    setSaving(false);
  };

  const toggleRule = async (ruleId: string, active: boolean) => {
    await supabase
      .from("marketplace_autocut_rules")
      .update({ is_active: active })
      .eq("id", ruleId);
    fetchRules();
  };

  const deleteRule = async (ruleId: string) => {
    await supabase
      .from("marketplace_autocut_rules")
      .delete()
      .eq("id", ruleId);
    toast.success("Regra removida");
    fetchRules();
  };

  const resetForm = () => {
    setSelectedOffer("");
    setMinPrice("");
    setReductionAmount("5");
    setReductionType("fixed");
    setIntervalHours("24");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AutoCut</CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Beta</Badge>
          </div>
          <Button
            size="sm"
            className="gap-1 text-xs h-8"
            onClick={() => setCreateOpen(true)}
            disabled={offersWithoutRules.length === 0}
          >
            <Plus className="h-3 w-3" /> Novo
          </Button>
        </div>
        <CardDescription className="text-xs">
          Reduza preços automaticamente e venda mais rápido. Configure o preço mínimo e o intervalo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            Nenhuma regra de AutoCut configurada.
          </div>
        ) : (
          rules.map((rule) => {
            const listing = rule.listing;
            return (
              <div
                key={rule.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  rule.is_active ? "border-primary/20 bg-primary/5" : "border-border/30 bg-muted/5 opacity-60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {listing?.title || "Anúncio removido"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Mínimo: {formatPriceBR(rule.min_price)} · Reduz {rule.reduction_type === "percent" ? `${rule.reduction_amount}%` : formatPriceBR(rule.reduction_amount)} a cada {rule.interval_hours}h
                  </p>
                  {rule.cuts_count > 0 && (
                    <p className="text-[10px] text-primary">
                      {rule.cuts_count} redução{rule.cuts_count > 1 ? "ões" : ""} aplicada{rule.cuts_count > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(v) => toggleRule(rule.id, v)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteRule(rule.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Configurar AutoCut
            </DialogTitle>
            <DialogDescription>
              O sistema reduzirá o preço automaticamente no intervalo definido, até atingir o preço mínimo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Offer selection */}
            <div>
              <Label>Anúncio</Label>
              <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um anúncio" />
                </SelectTrigger>
                <SelectContent>
                  {offersWithoutRules.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title} — {formatPriceBR(l.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min price */}
            <div>
              <Label>Preço mínimo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Ex: 500.00"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                O preço nunca será reduzido abaixo deste valor.
              </p>
            </div>

            {/* Reduction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Redução</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={reductionAmount}
                  onChange={(e) => setReductionAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={reductionType} onValueChange={(v) => setReductionType(v as "fixed" | "percent")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">R$ (fixo)</SelectItem>
                    <SelectItem value="percent">% (percentual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interval */}
            <div>
              <Label>Intervalo entre reduções</Label>
              <Select value={intervalHours} onValueChange={setIntervalHours}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">A cada 6 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">A cada 24 horas</SelectItem>
                  <SelectItem value="48">A cada 2 dias</SelectItem>
                  <SelectItem value="72">A cada 3 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/20">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                A redução será aplicada automaticamente pelo sistema. Quando o preço atingir o mínimo, o AutoCut será desativado automaticamente.
              </p>
            </div>

            <Button
              className="w-full btn-gold gap-2"
              onClick={handleCreate}
              disabled={saving || !selectedOffer || !minPrice || !reductionAmount}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Ativar AutoCut
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
