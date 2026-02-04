import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Sparkles, Box, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface OnlineUser {
  user_id: string;
  user_name: string;
  user_tier: "member" | "collector" | "elite";
  items_count: number;
  last_seen_at: string;
}

interface CommunityOnlineUsersProps {
  clientCpf: string;
}

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground", ring: "ring-muted" },
  collector: { icon: Crown, color: "text-amber-500", ring: "ring-amber-500" },
  elite: { icon: Sparkles, color: "text-primary", ring: "ring-primary" },
};

export function CommunityOnlineUsers({ clientCpf }: CommunityOnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
    updatePresence();

    // Update presence every 30 seconds
    const presenceInterval = setInterval(updatePresence, 30000);
    
    // Refresh online users every minute
    const usersInterval = setInterval(fetchOnlineUsers, 60000);

    return () => {
      clearInterval(presenceInterval);
      clearInterval(usersInterval);
    };
  }, [clientCpf]);

  const updatePresence = async () => {
    try {
      await supabase.rpc("update_presence", { p_cpf: clientCpf });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_online_community_users", {
        p_minutes: 5,
      });
      
      if (!error && data) {
        setOnlineUsers(data as OnlineUser[]);
      }
    } catch (error) {
      console.error("Error fetching online users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="relative">
            <Users className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          Membros online
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Ninguém online no momento
          </p>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((user, index) => {
              const tierInfo = tierConfig[user.user_tier];
              const TierIcon = tierInfo.icon;

              return (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className={cn("h-8 w-8 ring-2", tierInfo.ring)}>
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(user.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">
                        {user.user_name.split(" ")[0]}
                      </span>
                      <TierIcon className={cn("h-3 w-3 flex-shrink-0", tierInfo.color)} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Box className="h-2.5 w-2.5" />
                      {user.items_count} itens
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
