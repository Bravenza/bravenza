import { Helmet } from "react-helmet-async";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useClientNotifications, ClientNotification } from "@/hooks/useClientNotifications";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AppContext {
  cpf: string | null;
  profile: { full_name?: string; cpf?: string } | null;
}

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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Helmet>
        <title>Notificações | BRAVENZA</title>
      </Helmet>
      <NotificationsContent cpf={cpf} />
    </div>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Notificações</h1>
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
