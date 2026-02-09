import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Sparkles, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  onProfileClick?: (memberId: string) => void;
}

const tierGradient = {
  member: "from-muted-foreground/30 to-muted-foreground/10",
  collector: "from-violet-400 to-purple-500",
  elite: "from-primary via-amber-400 to-primary",
};

export function CommunityOnlineUsers({ clientCpf, onProfileClick }: CommunityOnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);
    const usersInterval = setInterval(fetchOnlineUsers, 60000);
    return () => { clearInterval(presenceInterval); clearInterval(usersInterval); };
  }, [clientCpf]);

  const updatePresence = async () => {
    try { await supabase.rpc("update_presence", { p_cpf: clientCpf }); } catch {}
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_online_community_users", { p_minutes: 5 });
      if (!error && data) setOnlineUsers(data as OnlineUser[]);
    } catch {} finally { setIsLoading(false); }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-3 w-24 bg-muted/20 rounded animate-pulse" />
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-muted/20 animate-pulse border-2 border-background" />
          ))}
        </div>
      </div>
    );
  }

  if (onlineUsers.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-500 rounded-full" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {onlineUsers.length} online agora
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {onlineUsers.slice(0, 12).map((user, index) => (
          <motion.button
            key={user.user_id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="relative group"
            onClick={() => onProfileClick?.(user.user_id)}
            title={user.user_name}
          >
            <div className={cn(
              "p-[1.5px] rounded-full bg-gradient-to-br",
              tierGradient[user.user_tier]
            )}>
              <Avatar className="h-8 w-8 border-[1.5px] border-background">
                <AvatarFallback className="text-[10px] font-medium bg-secondary">
                  {getInitials(user.user_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-[1.5px] border-background" />
          </motion.button>
        ))}
        {onlineUsers.length > 12 && (
          <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
            +{onlineUsers.length - 12}
          </div>
        )}
      </div>
    </div>
  );
}
