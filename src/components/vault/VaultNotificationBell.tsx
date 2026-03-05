import { useState } from "react";
import { Bell, Search, Users, Crown, AlertCircle, Gift, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VaultNotification } from "@/hooks/useVaultNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface VaultNotificationBellProps {
  notifications: VaultNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const notificationIcons: Record<VaultNotification["type"], React.ElementType> = {
  search_update: Search,
  match_room: Users,
  tier_upgrade: Crown,
  sla_alert: AlertCircle,
  invite_used: Gift,
  general: Bell,
};

const notificationColors: Record<VaultNotification["type"], string> = {
  search_update: "text-blue-400 bg-blue-500/10",
  match_room: "text-emerald-400 bg-emerald-500/10",
  tier_upgrade: "text-primary bg-primary/10",
  sla_alert: "text-destructive bg-destructive/10",
  invite_used: "text-purple-400 bg-purple-500/10",
  general: "text-muted-foreground bg-muted",
};

export function VaultNotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: VaultNotificationBellProps) {
  const [open, setOpen] = useState(false);

  const getNotificationLink = (notification: VaultNotification): string | null => {
    if (!notification.reference_id) return null;

    switch (notification.reference_type) {
      case "search":
        return `/app/wishlist`;
      case "match_room":
        return `/app/vault`;
      case "vault_item":
        return `/app/vault`;
      default:
        return null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-secondary/60 transition-colors active:scale-95">
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/15 rounded-xl" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-auto py-1"
              onClick={() => onMarkAllAsRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];
                const link = getNotificationLink(notification);

                const content = (
                  <div
                    className={`p-4 hover:bg-secondary/60 transition cursor-pointer ${
                      !notification.read ? "bg-secondary/30" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkAsRead(notification.id);
                      }
                      if (link) {
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={notification.id} to={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
