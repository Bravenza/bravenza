import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Crown, Star, Shield, Sparkles, Gem
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
}> = {
  elite: { 
    label: "Black", 
    icon: Crown, 
    gradient: "from-primary via-amber-400 to-primary",
  },
  collector: { 
    label: "Privilege", 
    icon: Gem, 
    gradient: "from-violet-400 via-purple-500 to-violet-400",
  },
  enthusiast: { 
    label: "Enthusiast", 
    icon: Star, 
    gradient: "from-sky-400 via-blue-500 to-sky-400",
  },
  member: { 
    label: "Member", 
    icon: Shield, 
    gradient: "from-muted-foreground/30 to-muted-foreground/10",
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
        .select("display_name, avatar_url, bio, tier, followers_count, following_count, posts_count")
        .eq("id", memberId)
        .single();
      if (member) setProfile(member as ProfileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return <div className="h-16 rounded-2xl bg-muted/10 animate-pulse" />;
  }

  const tier = profile.tier || "member";
  const tierData = tierConfig[tier] || tierConfig.member;

  const stats = [
    { label: "publicações", value: profile.posts_count || 0 },
    { label: "seguidores", value: profile.followers_count || 0 },
    { label: "seguindo", value: profile.following_count || 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 py-4"
    >
      {/* Avatar with tier ring */}
      <button onClick={() => onProfileClick(memberId)} className="shrink-0">
        <div className={cn("p-[2.5px] rounded-full bg-gradient-to-br", tierData.gradient)}>
          <Avatar className="w-16 h-16 border-[3px] border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-xl font-bold">
              {profile.display_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </button>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={() => onProfileClick(memberId)}
            className="font-bold text-base truncate hover:text-primary transition-colors"
          >
            {profile.display_name}
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/vault/perfil")}
            className="h-7 w-7 rounded-full"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-5">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => onProfileClick(memberId)}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <span className="block font-bold text-sm">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
