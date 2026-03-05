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
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-zinc-900 border-zinc-800" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-white h-auto py-1"
              onClick={() => onMarkAllAsRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];
                const link = getNotificationLink(notification);

                const content = (
                  <div
                    className={`p-4 hover:bg-zinc-800/50 transition cursor-pointer ${
                      !notification.read ? "bg-zinc-800/30" : ""
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
                          <p className={`text-sm font-medium ${!notification.read ? "text-white" : "text-zinc-300"}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
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
