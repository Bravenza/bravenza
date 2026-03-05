import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Trash2, DollarSign, Hash, Zap, Mail, Package, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useClientSession } from "@/hooks/useClientSession";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  product_id: string;
  target_price: number | null;
  target_size: string | null;
  channels: string;
  is_active: boolean;
  cooldown_until: string | null;
  created_at: string;
  product?: { brand: string; model: string; images?: string[]; slug?: string | null };
}

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const channelIcon = (ch: string) => {
  if (ch === "push") return <Zap className="h-3 w-3" />;
  if (ch === "email") return <Mail className="h-3 w-3" />;
  return <><Zap className="h-3 w-3" /><Mail className="h-3 w-3" /></>;
};

const channelLabel = (ch: string) => {
  if (ch === "push") return "Push";
  if (ch === "email") return "E-mail";
  return "Push + E-mail";
};

export default function MyAlertsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useClientSession();
  const cpf = profile?.cpf || null;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAlerts = async () => {
    if (!cpf) return;
    try {
      const res = await marketplaceRequest(cpf, "alerts:list", "GET");
      const raw = res.data || [];
      // Enrich with product info
      const productIds = [...new Set(raw.map((a: any) => a.product_id))] as string[];
      let products: Record<string, any> = {};
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from("marketplace_products")
          .select("id, brand, model, images, slug")
          .in("id", productIds);
        (prods || []).forEach((p: any) => { products[p.id] = p; });
      }
      setAlerts(raw.map((a: any) => ({ ...a, product: products[a.product_id] || null })));
    } catch (err) {
      console.error("fetch alerts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [cpf]);

  const handleToggle = async (alert: Alert) => {
    try {
      await marketplaceRequest(cpf!, "alerts:upsert", "POST", {
        id: alert.id,
        product_id: alert.product_id,
        target_price: alert.target_price,
        target_size: alert.target_size,
        channels: alert.channels,
        is_active: !alert.is_active,
      });
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_active: !a.is_active } : a));
      toast({ title: alert.is_active ? "Alerta pausado" : "Alerta reativado" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm("Excluir este alerta?")) return;
    setDeleting(alertId);
    try {
      await marketplaceRequest(cpf!, "alerts:delete", "DELETE", undefined, { alert_id: alertId });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({ title: "Alerta excluído" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const activeCount = alerts.filter(a => a.is_active).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-black tracking-tight">Meus Alertas</h1>
          <p className="text-xs text-muted-foreground">
            {activeCount} alerta{activeCount !== 1 ? "s" : ""} ativo{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="p-8 text-center space-y-3">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum alerta configurado</p>
            <p className="text-xs text-muted-foreground">
              Acesse a página de um produto e clique em "Criar alerta" para ser notificado sobre quedas de preço.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
              Explorar catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {alerts.map(alert => {
            const productName = alert.product ? `${alert.product.brand} ${alert.product.model}` : "Produto";
            const img = alert.product?.images?.[0];
            const isInCooldown = alert.cooldown_until && new Date(alert.cooldown_until) > new Date();

            return (
              <motion.div key={alert.id} variants={fadeUp}>
                <Card className={`border-border/30 overflow-hidden transition-opacity ${!alert.is_active ? "opacity-50" : ""}`}>
                  <div className={`h-0.5 ${alert.is_active ? "bg-gradient-to-r from-primary/60 to-primary/20" : "bg-muted"}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Product image */}
                      <button
                        onClick={() => navigate(alert.product?.slug ? `/marketplace/${alert.product.slug}` : `/marketplace/product/${alert.product_id}`)}
                        className="shrink-0"
                      >
                        {img ? (
                          <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-border/20" loading="lazy" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(alert.product?.slug ? `/marketplace/${alert.product.slug}` : `/marketplace/product/${alert.product_id}`)}
                          className="text-sm font-semibold line-clamp-1 hover:text-primary transition-colors text-left"
                        >
                          {productName}
                        </button>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {alert.target_price && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <DollarSign className="h-2.5 w-2.5" />
                              ≤ R$ {alert.target_price.toLocaleString("pt-BR")}
                            </Badge>
                          )}
                          {alert.target_size && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <Hash className="h-2.5 w-2.5" />
                              {alert.target_size}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            {channelIcon(alert.channels)}
                            {channelLabel(alert.channels)}
                          </Badge>
                          {isInCooldown && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning border-warning/20">
                              Cooldown
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggle(alert)}
                          title={alert.is_active ? "Pausar" : "Reativar"}
                        >
                          {alert.is_active ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(alert.id)}
                          disabled={deleting === alert.id}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
