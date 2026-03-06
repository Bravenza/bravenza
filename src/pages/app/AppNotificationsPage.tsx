import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useClientNotifications, ClientNotification } from "@/hooks/useClientNotifications";
import { Bell, Check, CheckCheck, Settings2, ShieldCheck, MessageSquare, Rocket, TrendingDown, Megaphone, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppContext {
  cpf: string | null;
  profile: { full_name?: string; cpf?: string } | null;
}

interface NotificationPrefs {
  chat: boolean;
  drops: boolean;
  price_alerts: boolean;
  marketing: boolean;
  seller_tips: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  chat: true,
  drops: true,
  price_alerts: true,
  marketing: false,
  seller_tips: true,
};

const OPTIONAL_PREFS = [
  { key: "chat" as const, label: "Novas mensagens de chat", icon: MessageSquare, description: "Receba avisos quando alguém enviar uma mensagem" },
  { key: "drops" as const, label: "Drops e lançamentos", icon: Rocket, description: "Novos lançamentos e releases de sneakers" },
  { key: "price_alerts" as const, label: "Alertas de preço", icon: TrendingDown, description: "Quando um produto da sua busca salva baixar de preço" },
  { key: "marketing" as const, label: "Novidades e promoções", icon: Megaphone, description: "Ofertas especiais e novidades da Bravenza" },
  { key: "seller_tips" as const, label: "Dicas de venda", icon: Lightbulb, description: "Sugestões para melhorar seus anúncios (vendedores)" },
];

const TRANSACTIONAL = [
  "Confirmação de pagamento",
  "Status do pedido (enviado, entregue)",
  "Disputas e reembolsos",
];

export default function AppNotificationsPage() {
  const { cpf } = useOutletContext<AppContext>();
  const navigate = useNavigate();

  if (!cpf) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Helmet>
        <title>Notificações | BRAVENZA</title>
      </Helmet>
      <NotificationPreferences cpf={cpf} />
      <Separator />
      <NotificationsContent cpf={cpf} />
    </div>
  );
}

function NotificationPreferences({ cpf }: { cpf: string }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("client_preferences")
        .select("notification_prefs")
        .eq("client_cpf", cpf)
        .maybeSingle();
      if (data?.notification_prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...(data.notification_prefs as Record<string, boolean>) });
      }
      setLoading(false);
    };
    load();
  }, [cpf]);

  const toggle = async (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("client_preferences")
        .upsert(
          { client_cpf: cpf, notification_prefs: updated as any },
          { onConflict: "client_cpf" }
        );
      if (error) throw error;
      toast.success("Preferência atualizada");
    } catch {
      setPrefs(prefs); // rollback
      toast.error("Erro ao salvar preferência");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          Preferências de notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Transactional — always on */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Transacionais — sempre ativas
          </p>
          <div className="space-y-2">
            {TRANSACTIONAL.map((label) => (
              <div key={label} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-500">
                  Sempre ativa
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator className="opacity-40" />

        {/* Optional toggles */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Opcionais
          </p>
          <div className="space-y-3">
            {OPTIONAL_PREFS.map(({ key, label, icon: Icon, description }) => (
              <div key={key} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={() => toggle(key)}
                  disabled={saving}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsContent({ cpf }: { cpf: string }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useClientNotifications(cpf);

  const handleClick = (notification: ClientNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.reference_type === "order" && notification.reference_id) {
      navigate(`/app/pedidos`);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando notificações...</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Histórico</h2>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl transition-colors flex gap-3",
                n.read ? "hover:bg-secondary" : "bg-primary/5 hover:bg-primary/10"
              )}
            >
              <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", n.read ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
