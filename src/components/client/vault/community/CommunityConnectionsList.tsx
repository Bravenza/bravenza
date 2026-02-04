import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Check, Shield, Crown, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Connection {
  member_id: string;
  display_name: string;
  avatar_url: string | null;
  tier: "member" | "privilege" | "black";
  is_following: boolean;
}

interface CommunityConnectionsListProps {
  clientCpf: string;
  memberId: string;
  type: "followers" | "following";
  memberName: string;
  onClose: () => void;
  onProfileClick: (memberId: string) => void;
}

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground" },
  privilege: { icon: Crown, color: "text-primary" },
  black: { icon: Sparkles, color: "text-foreground" },
};

export function CommunityConnectionsList({
  clientCpf,
  memberId,
  type,
  memberName,
  onClose,
  onProfileClick,
}: CommunityConnectionsListProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(type);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchConnections(activeTab);
  }, [activeTab, memberId]);

  const fetchConnections = async (connectionType: "followers" | "following") => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("get_member_connections", {
        p_cpf: clientCpf,
        p_member_id: memberId,
        p_type: connectionType,
      });

      if (error) throw error;
      setConnections((data as Connection[]) || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async (targetMemberId: string) => {
    setTogglingIds(prev => new Set(prev).add(targetMemberId));
    
    try {
      const { data, error } = await (supabase.rpc as any)("toggle_follow", {
        p_cpf: clientCpf,
        p_target_member_id: targetMemberId,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setConnections(prev => 
          prev.map(c => 
            c.member_id === targetMemberId 
              ? { ...c, is_following: result.is_following }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Erro",
        variant: "destructive",
      });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(targetMemberId);
        return next;
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>{memberName}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followers" | "following")}>
          <TabsList className="w-full">
            <TabsTrigger value="followers" className="flex-1">
              Seguidores
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Seguindo
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : connections.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {activeTab === "followers" 
                  ? "Nenhum seguidor ainda"
                  : "Não segue ninguém ainda"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {connections.map((connection, index) => {
                const TierIcon = tierConfig[connection.tier].icon;
                const isToggling = togglingIds.has(connection.member_id);
                
                return (
                  <motion.div
                    key={connection.member_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <button
                      onClick={() => onProfileClick(connection.member_id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <Avatar className="h-10 w-10">
                        {connection.avatar_url ? (
                          <AvatarImage src={connection.avatar_url} alt={connection.display_name} />
                        ) : null}
                        <AvatarFallback className="bg-secondary text-sm">
                          {getInitials(connection.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">
                            {connection.display_name}
                          </span>
                          <TierIcon className={`h-3.5 w-3.5 flex-shrink-0 ${tierConfig[connection.tier].color}`} />
                        </div>
                      </div>
                    </button>

                    <Button
                      size="sm"
                      variant={connection.is_following ? "outline" : "default"}
                      className="flex-shrink-0 h-8 px-3 text-xs"
                      onClick={() => handleToggleFollow(connection.member_id)}
                      disabled={isToggling}
                    >
                      {connection.is_following ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Seguir
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
