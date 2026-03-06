import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Bell, Send, Users, Filter, Plus, Trash2, Eye, Clock,
  Crown, TrendingUp, Target, CheckCircle2, BarChart3, Loader2, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  message: string;
  channel: "push" | "email" | "whatsapp" | "in_app";
  segment: string;
  status: "draft" | "scheduled" | "sent";
  sent_count: number;
  open_count: number;
  created_at: string;
  scheduled_at?: string;
  filters: CampaignFilters;
}

interface CampaignFilters {
  tiers?: string[];
  brands?: string[];
  states?: string[];
  min_purchases?: number;
  has_watchlist?: boolean;
  seller_only?: boolean;
}

const TIERS = [
  { value: "member", label: "Vault Access" },
  { value: "collector", label: "Vault Privilege" },
  { value: "elite", label: "Vault Black" },
];

const CHANNELS = [
  { value: "in_app", label: "In-App", icon: Bell },
  { value: "email", label: "E-mail", icon: Send },
  { value: "push", label: "Push", icon: Target },
];

const SEGMENTS = [
  { value: "all", label: "Todos os membros" },
  { value: "buyers", label: "Compradores ativos" },
  { value: "sellers", label: "Vendedores" },
  { value: "watchlist", label: "Com watchlist ativa" },
  { value: "inactive", label: "Inativos (30+ dias)" },
  { value: "high_value", label: "Alto valor (R$5k+)" },
];

const CHANNEL_LABELS: Record<string, string> = {
  in_app: "In-App",
  email: "E-mail",
  push: "Push",
  whatsapp: "WhatsApp",
};

export default function MarketplaceCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    message: "",
    channel: "in_app" as Campaign["channel"],
    segment: "all",
    selectedTiers: [] as string[],
  });
  const [estimatedReach, setEstimatedReach] = useState(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsEstimating(true);
    debounceRef.current = setTimeout(() => {
      estimateReach();
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [newCampaign.segment, newCampaign.selectedTiers]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("reference_type", "campaign")
        .order("created_at", { ascending: false })
        .limit(50);

      const campaignMap = new Map<string, Campaign>();
      for (const n of (data || [])) {
        const refId = n.reference_id || n.id;
        if (!campaignMap.has(refId)) {
          campaignMap.set(refId, {
            id: refId,
            title: n.title,
            message: n.message,
            channel: "in_app",
            segment: "all",
            status: "sent",
            sent_count: 0,
            open_count: 0,
            created_at: n.created_at,
            filters: {},
          });
        }
        const c = campaignMap.get(refId)!;
        c.sent_count++;
        if (n.read) c.open_count++;
      }
      setCampaigns(Array.from(campaignMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const estimateReach = async () => {
    try {
      let query = supabase.from("vault_members").select("id", { count: "exact", head: true }).eq("is_active", true);
      
      if (newCampaign.selectedTiers.length > 0) {
        query = query.in("tier", newCampaign.selectedTiers as any);
      }
      if (newCampaign.segment === "sellers") {
        const { count } = await supabase.from("vault_seller_profiles").select("id", { count: "exact", head: true });
        setEstimatedReach(count || 0);
        return;
      }
      if (newCampaign.segment === "high_value") {
        query = query.gte("total_spent", 5000);
      }

      const { count } = await query;
      setEstimatedReach(count || 0);
    } catch {
      setEstimatedReach(0);
    }
  };

  const handleSendClick = () => {
    if (!newCampaign.title || !newCampaign.message) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setShowConfirm(true);
  };

  const sendCampaign = async () => {
    setShowConfirm(false);
    setIsSending(true);
    setSendProgress({ current: 0, total: 0 });

    try {
      // Get target members
      let query = supabase.from("vault_members").select("client_cpf, client_name, client_email, tier").eq("is_active", true);
      
      if (newCampaign.selectedTiers.length > 0) {
        query = query.in("tier", newCampaign.selectedTiers as any);
      }
      if (newCampaign.segment === "high_value") {
        query = query.gte("total_spent", 5000);
      }

      const { data: members } = await query;
      if (!members || members.length === 0) {
        toast.error("Nenhum destinatário encontrado");
        setIsSending(false);
        return;
      }

      const campaignId = crypto.randomUUID();
      const total = members.length;
      setSendProgress({ current: 0, total });

      // 1. Always create in-app notifications (internal record)
      const notifications = members.map(m => ({
        title: newCampaign.title,
        message: newCampaign.message,
        target: "client" as const,
        target_client_cpf: m.client_cpf,
        type: "system_alert" as const,
        reference_type: "campaign",
        reference_id: campaignId,
      }));

      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        await supabase.from("notifications").insert(batch);
        setSendProgress({ current: Math.min(i + 100, total), total });
      }

      // 2. Dispatch to selected channel
      const channel = newCampaign.channel;

      if (channel === "email") {
        const withEmail = members.filter(m => m.client_email);
        setSendProgress({ current: 0, total: withEmail.length });
        for (let i = 0; i < withEmail.length; i += 10) {
          const batch = withEmail.slice(i, i + 10);
          await Promise.all(batch.map(m =>
            supabase.functions.invoke("send-marketplace-email", {
              body: {
                type: "mk_campaign",
                recipient_name: m.client_name,
                recipient_email: m.client_email,
                campaign_title: newCampaign.title,
                campaign_message: newCampaign.message,
              },
            })
          ));
          setSendProgress({ current: Math.min(i + 10, withEmail.length), total: withEmail.length });
        }
      } else if (channel === "push") {
        setSendProgress({ current: 0, total: 1 });
        await supabase.functions.invoke("send-push", {
          body: {
            title: newCampaign.title,
            body: newCampaign.message,
            target_cpfs: members.map(m => m.client_cpf),
          },
        });
        setSendProgress({ current: 1, total: 1 });
      } else if (channel === "whatsapp") {
        // Get phone numbers from client_profiles
        const cpfs = members.map(m => m.client_cpf);
        const { data: profiles } = await supabase
          .from("client_profiles")
          .select("cpf, phone, full_name")
          .in("cpf", cpfs);
        const withPhone = (profiles || []).filter(p => p.phone);
        setSendProgress({ current: 0, total: withPhone.length });
        for (let i = 0; i < withPhone.length; i += 10) {
          const batch = withPhone.slice(i, i + 10);
          await Promise.all(batch.map(p =>
            supabase.functions.invoke("send-whatsapp", {
              body: {
                message_type: "mk_campaign",
                phone: p.phone,
                client_name: p.full_name,
                campaign_title: newCampaign.title,
                campaign_message: newCampaign.message,
              },
            })
          ));
          setSendProgress({ current: Math.min(i + 10, withPhone.length), total: withPhone.length });
        }
      }

      toast.success(`Campanha enviada para ${members.length} membros via ${CHANNEL_LABELS[channel]}!`);
      setShowCreate(false);
      setNewCampaign({ title: "", message: "", channel: "in_app", segment: "all", selectedTiers: [] });
      fetchCampaigns();
    } catch (err) {
      toast.error("Erro ao enviar campanha: " + (err instanceof Error ? err.message : "Erro inesperado"));
    } finally {
      setIsSending(false);
      setSendProgress({ current: 0, total: 0 });
    }
  };

  const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.open_count, 0);
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const progressPercent = sendProgress.total > 0 ? Math.round((sendProgress.current / sendProgress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Campanhas de Notificação
          </h1>
          <p className="text-muted-foreground">Crie e gerencie campanhas segmentadas</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={newCampaign.title}
                  onChange={e => setNewCampaign(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: 🔥 Novos drops exclusivos!"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea
                  value={newCampaign.message}
                  onChange={e => setNewCampaign(p => ({ ...p, message: e.target.value }))}
                  placeholder="Corpo da notificação..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Canal</label>
                <Select value={newCampaign.channel} onValueChange={v => setNewCampaign(p => ({ ...p, channel: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Segmento</label>
                <Select value={newCampaign.segment} onValueChange={v => setNewCampaign(p => ({ ...p, segment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filtrar por Tier</label>
                <div className="flex gap-3">
                  {TIERS.map(t => (
                    <label key={t.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newCampaign.selectedTiers.includes(t.value)}
                        onCheckedChange={checked => {
                          setNewCampaign(p => ({
                            ...p,
                            selectedTiers: checked
                              ? [...p.selectedTiers, t.value]
                              : p.selectedTiers.filter(x => x !== t.value),
                          }));
                        }}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{estimatedReach} destinatários</p>
                    <p className="text-xs text-muted-foreground">Alcance estimado via {CHANNEL_LABELS[newCampaign.channel]}</p>
                  </div>
                </CardContent>
              </Card>

              {isSending && sendProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Enviando...</span>
                    <span className="font-medium">{sendProgress.current} de {sendProgress.total}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}

              <Button onClick={handleSendClick} className="w-full gap-2" disabled={isSending}>
                <Send className="h-4 w-4" /> {isSending ? "Enviando..." : "Enviar Agora"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio de campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Esta campanha será enviada para <strong>{estimatedReach} pessoas</strong> por <strong>{CHANNEL_LABELS[newCampaign.channel]}</strong>.
              Esta ação não pode ser desfeita. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={sendCampaign}>Confirmar Envio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Send, label: "Campanhas", value: campaigns.length, color: "text-primary", bg: "bg-primary/10" },
          { icon: Users, label: "Total Enviados", value: totalSent, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Eye, label: "Total Abertos", value: totalOpened, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: TrendingUp, label: "Taxa Abertura", value: `${avgOpenRate}%`, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className={`h-9 w-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-xl font-black">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Campaign List */}
      <Card className="card-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Histórico de Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhuma campanha enviada ainda
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c, i) => {
                const openRate = c.sent_count > 0 ? ((c.open_count / c.sent_count) * 100).toFixed(1) : "0";
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {c.sent_count} enviados
                        </Badge>
                        <Badge variant={parseFloat(openRate) > 30 ? "default" : "secondary"} className="text-[10px]">
                          {openRate}% abertos
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
