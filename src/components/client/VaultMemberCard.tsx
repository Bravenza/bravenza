import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Crown, 
  Box, 
  Search, 
  Ticket, 
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VaultMemberData {
  id: string;
  tier: "member" | "collector" | "elite";
  total_purchases: number;
  active_hunts: number;
  max_active_hunts: number;
  max_wishlist_items: number;
  invites_remaining: number;
}

interface VaultMemberCardProps {
  clientCpf: string;
}

const tierConfig = {
  member: {
    label: "Vault Access",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50 border-border",
    icon: Shield,
  },
  collector: {
    label: "Vault Privilege",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    icon: Crown,
  },
  elite: {
    label: "Vault Black",
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/30",
    icon: Sparkles,
  },
};

export function VaultMemberCard({ clientCpf }: VaultMemberCardProps) {
  const [member, setMember] = useState<VaultMemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const { data, error } = await supabase
          .rpc("get_vault_member", { p_cpf: clientCpf });

        if (error) throw error;

        if (data && data.length > 0) {
          setMember(data[0] as unknown as VaultMemberData);
        }
      } catch (err) {
        console.error("Error fetching vault member:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberData();
  }, [clientCpf]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!member) return null;

  const tier = tierConfig[member.tier];
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className={`border overflow-hidden ${tier.bgColor}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Vault Club
            </CardTitle>
            <Badge className={`${tier.bgColor} ${tier.color} border`}>
              <TierIcon className="h-3 w-3 mr-1" />
              {tier.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-xl font-bold text-primary">
                {member.total_purchases}
              </div>
              <div className="text-xs text-muted-foreground">
                <Box className="h-3 w-3 inline mr-1" />
                Itens
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-primary">
                {member.active_hunts}/{member.max_active_hunts}
              </div>
              <div className="text-xs text-muted-foreground">
                <Search className="h-3 w-3 inline mr-1" />
                Buscas
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-primary">
                {member.invites_remaining}
              </div>
              <div className="text-xs text-muted-foreground">
                <Ticket className="h-3 w-3 inline mr-1" />
                Convites
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
