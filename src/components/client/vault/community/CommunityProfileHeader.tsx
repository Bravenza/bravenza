import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Settings, ChevronRight, Crown, Star, Shield, Sparkles, Gem
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CommunityProfileHeaderProps {
  memberId: string;
  onProfileClick: (memberId: string) => void;
}

interface ProfileData {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  tier: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

const tierConfig: Record<string, { 
  label: string; 
  icon: typeof Crown; 
  gradient: string; 
  glow: string;
  badge: string;
}> = {
  elite: { 
    label: "Black", 
    icon: Crown, 
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-600 text-black"
  },
  collector: { 
    label: "Privilege", 
    icon: Gem, 
    gradient: "from-violet-400 via-purple-500 to-violet-600",
    glow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]",
    badge: "bg-gradient-to-r from-violet-500 to-purple-600"
  },
  enthusiast: { 
    label: "Enthusiast", 
    icon: Star, 
    gradient: "from-sky-400 via-blue-500 to-sky-600",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.25)]",
    badge: "bg-gradient-to-r from-sky-500 to-blue-600"
  },
  member: { 
    label: "Member", 
    icon: Shield, 
    gradient: "from-zinc-400 via-zinc-500 to-zinc-600",
    glow: "",
    badge: "bg-secondary"
  },
};

export function CommunityProfileHeader({ memberId, onProfileClick }: CommunityProfileHeaderProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [memberId]);

  const fetchProfile = async () => {
    try {
      const { data: member } = await supabase
        .from("vault_members")
        .select(`
          display_name,
          avatar_url,
          bio,
          tier,
          followers_count,
          following_count,
          posts_count
        `)
        .eq("id", memberId)
        .single();

      if (member) {
        setProfile(member as ProfileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="h-20 rounded-2xl bg-secondary/30 animate-pulse" />
    );
  }

  const tier = profile.tier || "member";
  const tierData = tierConfig[tier] || tierConfig.member;
  const TierIcon = tierData.icon;
  const isElite = tier === "elite";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/50"
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-10",
        tierData.gradient
      )} />
      
      {/* Glow effect for elite */}
      {isElite && (
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
      )}

      <div className="relative p-4">
        <div className="flex items-center gap-4">
          {/* Avatar with tier ring */}
          <motion.button
            onClick={() => onProfileClick(memberId)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className={cn(
              "p-0.5 rounded-full bg-gradient-to-br",
              tierData.gradient,
              tierData.glow
            )}>
              <Avatar className="w-14 h-14 border-2 border-card">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-lg font-bold">
                  {profile.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Tier icon badge */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
              "bg-gradient-to-br border-2 border-card",
              tierData.gradient
            )}>
              <TierIcon className="w-3 h-3 text-white" />
            </div>
          </motion.button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button 
                onClick={() => onProfileClick(memberId)}
                className="font-bold text-base truncate hover:text-primary transition-colors"
              >
                {profile.display_name}
              </button>
              <Badge className={cn("text-[10px] px-1.5 py-0", tierData.badge)}>
                {tierData.label}
              </Badge>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{profile.posts_count || 0}</strong> posts
              </span>
              <span>
                <strong className="text-foreground">{profile.followers_count || 0}</strong> seguidores
              </span>
              <span>
                <strong className="text-foreground">{profile.following_count || 0}</strong> seguindo
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onProfileClick(memberId)}
              className="gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Perfil</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/vault/perfil")}
              className="gap-1.5 text-xs border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        </div>

        {/* Bio preview */}
        {profile.bio && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm text-muted-foreground line-clamp-1 pl-[4.5rem]"
          >
            {profile.bio}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
