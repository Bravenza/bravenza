import { useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink, Package, CreditCard, Truck, Gift, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClientNotifications, ClientNotification } from "@/hooks/useClientNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const notificationIcons: Record<string, React.ReactNode> = {
  order_status_update: <Truck className="h-4 w-4 text-blue-500" />,
  budget_sent: <Package className="h-4 w-4 text-purple-500" />,
  payment_received: <CreditCard className="h-4 w-4 text-green-500" />,
  order_delivered: <CheckCheck className="h-4 w-4 text-emerald-500" />,
  cashback_available: <Gift className="h-4 w-4 text-primary" />,
  cashback_expiring: <AlertCircle className="h-4 w-4 text-amber-500" />,
};

function NotificationItem({ 
  notification, 
  onMarkAsRead,
  onNavigate 
}: { 
  notification: ClientNotification;
  onMarkAsRead: (id: string) => void;
  onNavigate: (notification: ClientNotification) => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNavigate(notification);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {notificationIcons[notification.type] || <Bell className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm truncate",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

interface ClientNotificationBellProps {
  clientCpf: string;
}

export function ClientNotificationBell({ clientCpf }: ClientNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useClientNotifications(clientCpf);

  const handleNavigate = (notification: ClientNotification) => {
    setOpen(false);
    
    if (notification.reference_type === "order" && notification.reference_id) {
      navigate(`/rastreio/${notification.reference_id}`, { 
        state: { cpf: clientCpf } 
      });
    } else if (notification.type === "cashback_available" || notification.type === "cashback_expiring") {
      // Scroll to referral section or navigate appropriately
      const referralSection = document.getElementById("referral-section");
      if (referralSection) {
        referralSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full active:scale-90 transition-transform">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Marcar como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
