import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Crown, 
  Box, 
  Search, 
  Ticket, 
  ArrowRight,
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
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10 border-zinc-500/30",
    icon: Shield,
  },
  collector: {
    label: "Vault Privilege",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    icon: Crown,
  },
  elite: {
    label: "Vault Black",
    color: "text-white",
    bgColor: "bg-gradient-to-r from-zinc-900 to-black border-white/20",
    icon: Sparkles,
  },
};

export function VaultMemberCard({ clientCpf }: VaultMemberCardProps) {
  const [member, setMember] = useState<VaultMemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notMember, setNotMember] = useState(false);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const { data, error } = await supabase
          .rpc("get_vault_member", { p_cpf: clientCpf });

        if (error) throw error;

        if (data && data.length > 0) {
          setMember(data[0] as unknown as VaultMemberData);
        } else {
          setNotMember(true);
        }
      } catch (err) {
        console.error("Error fetching vault member:", err);
        setNotMember(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberData();
  }, [clientCpf]);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show invitation CTA if not a member
  if (notMember) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Bravenza Vault Club
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Acesso exclusivo a curadoria global de tênis raros e colecionáveis.
            </p>
            <Button asChild size="sm" variant="outline" className="w-full border-primary/50 hover:bg-primary/10">
              <Link to="/vault">
                Saiba mais
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
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
      <Card className={`border overflow-hidden relative ${member.tier === 'elite' ? 'bg-black text-white border-white/20' : 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent'}`}>
        {/* Glow effect for elite */}
        {member.tier === 'elite' && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10" />
        )}
        
        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className={`h-5 w-5 ${member.tier === 'elite' ? 'text-amber-400' : 'text-amber-500'}`} />
              Vault Club
            </CardTitle>
            <Badge className={`${tier.bgColor} ${tier.color} border`}>
              <TierIcon className="h-3 w-3 mr-1" />
              {tier.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${member.tier === 'elite' ? 'text-amber-400' : 'text-primary'}`}>
                {member.total_purchases}
              </div>
              <div className="text-xs text-muted-foreground">
                <Box className="h-3 w-3 inline mr-1" />
                Itens
              </div>
            </div>
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${member.tier === 'elite' ? 'text-amber-400' : 'text-primary'}`}>
                {member.active_hunts}/{member.max_active_hunts}
              </div>
              <div className="text-xs text-muted-foreground">
                <Search className="h-3 w-3 inline mr-1" />
                Buscas
              </div>
            </div>
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${member.tier === 'elite' ? 'text-amber-400' : 'text-primary'}`}>
                {member.invites_remaining}
              </div>
              <div className="text-xs text-muted-foreground">
                <Ticket className="h-3 w-3 inline mr-1" />
                Convites
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            asChild 
            className={`w-full ${member.tier === 'elite' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}`}
          >
            <Link to="/vault/app">
              Acessar Vault Club
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
