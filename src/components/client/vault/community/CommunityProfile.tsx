import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, MapPin, Calendar, ShoppingBag, Users, UserPlus, UserMinus,
  Instagram, Facebook, Linkedin, Twitter, Shield, Crown, Sparkles,
  Settings, ExternalLink, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CommunityConnectionsList } from "./CommunityConnectionsList";

interface VaultItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  colorway: string | null;
  size: string | null;
  inspection_photos: string[] | null;
  verified_status: string | null;
  purchase_date: string | null;
}

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  tier: "member" | "privilege" | "black";
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  is_profile_public: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  joined_at: string;
  total_purchases: number;
  is_following: boolean;
  is_own_profile: boolean;
}

interface CommunityProfileProps {
  memberId: string | null;
  clientCpf: string;
  onClose: () => void;
  onFollowChange?: () => void;
}

const tierConfig = {
  member: { icon: Shield, label: "Member", color: "text-muted-foreground", bg: "bg-secondary" },
  privilege: { icon: Crown, label: "Privilege", color: "text-primary", bg: "bg-primary/10" },
  black: { icon: Sparkles, label: "Black", color: "text-foreground", bg: "bg-foreground/10" },
};

export function CommunityProfile({ memberId, clientCpf, onClose, onFollowChange }: CommunityProfileProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showConnections, setShowConnections] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (memberId) {
      fetchProfile();
    }
  }, [memberId]);

  const fetchProfile = async () => {
    if (!memberId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("get_member_public_profile", {
        p_cpf: clientCpf,
        p_member_id: memberId,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setProfile(result.profile);
        setItems(result.items || []);
        setIsFollowing(result.profile.is_following);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erro ao carregar perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!memberId || profile?.is_own_profile) return;

    setIsToggling(true);
    try {
      const { data, error } = await (supabase.rpc as any)("toggle_follow", {
        p_cpf: clientCpf,
        p_target_member_id: memberId,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setIsFollowing(result.is_following);
        setProfile(prev => prev ? {
          ...prev,
          is_following: result.is_following,
          followers_count: result.is_following 
            ? prev.followers_count + 1 
            : prev.followers_count - 1,
        } : null);
        
        toast({
          title: result.is_following ? "Seguindo!" : "Deixou de seguir",
          description: result.is_following 
            ? `Agora você segue ${profile?.display_name}`
            : `Você deixou de seguir ${profile?.display_name}`,
        });
        
        onFollowChange?.();
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar a ação",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (!memberId) return null;

  const tier = profile?.tier || "member";
  const TierIcon = tierConfig[tier].icon;

  return (
    <>
      <Dialog open={!!memberId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-lg p-0 gap-0 bg-card border-border overflow-hidden max-h-[90vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : profile ? (
            <ScrollArea className="max-h-[90vh]">
              {/* Header with Cover */}
              <div className="relative">
                <div className={`h-24 ${tierConfig[tier].bg} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                  {tier === "black" && (
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        background: [
                          "linear-gradient(45deg, rgba(255,215,0,0.1) 0%, transparent 50%)",
                          "linear-gradient(45deg, transparent 0%, rgba(255,215,0,0.1) 50%)",
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                    />
                  )}
                </div>
                
                {/* Avatar */}
                <div className="absolute -bottom-12 left-6">
                  <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                    ) : null}
                    <AvatarFallback className={`text-xl font-bold ${tierConfig[tier].bg} ${tierConfig[tier].color}`}>
                      {getInitials(profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {profile.is_own_profile ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => {
                        onClose();
                        navigate("/vault/perfil");
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={isFollowing ? "outline" : "default"}
                      className="gap-1.5"
                      onClick={handleToggleFollow}
                      disabled={isToggling}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="h-4 w-4" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Seguir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-14 px-6 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{profile.display_name}</h2>
                  <Badge variant="outline" className={`${tierConfig[tier].color} border-current gap-1`}>
                    <TierIcon className="h-3 w-3" />
                    {tierConfig[tier].label}
                  </Badge>
                </div>

                {(profile.city || profile.state) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-sm text-foreground/80 mb-4">{profile.bio}</p>
                )}

                {/* Social Links */}
                <div className="flex gap-2 mb-4">
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm mb-4">
                  <button
                    onClick={() => setShowConnections("followers")}
                    className="hover:text-primary transition-colors"
                  >
                    <span className="font-bold">{profile.followers_count}</span>
                    <span className="text-muted-foreground ml-1">seguidores</span>
                  </button>
                  <button
                    onClick={() => setShowConnections("following")}
                    className="hover:text-primary transition-colors"
                  >
                    <span className="font-bold">{profile.following_count}</span>
                    <span className="text-muted-foreground ml-1">seguindo</span>
                  </button>
                  <div>
                    <span className="font-bold">{profile.posts_count}</span>
                    <span className="text-muted-foreground ml-1">posts</span>
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Membro desde {formatDate(profile.joined_at)}
                  </span>
                  {profile.total_purchases > 0 && (
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {profile.total_purchases} compras
                    </span>
                  )}
                </div>
              </div>

              {/* Collection */}
              {items.length > 0 && (
                <div className="px-6 pb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Coleção ({items.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {items.slice(0, 6).map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className="aspect-square rounded-lg overflow-hidden bg-secondary relative group"
                      >
                        {item.inspection_photos?.[0] ? (
                          <img
                            src={item.inspection_photos[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <div className="text-white text-xs truncate">
                            <p className="font-medium truncate">{item.brand || item.title}</p>
                            {item.model && (
                              <p className="text-white/70 truncate">{item.model}</p>
                            )}
                          </div>
                        </div>
                        {item.verified_status === "VERIFIED" && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground p-1 rounded-full">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  {items.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      +{items.length - 6} itens na coleção
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Perfil não encontrado</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Connections List Modal */}
      {showConnections && profile && (
        <CommunityConnectionsList
          clientCpf={clientCpf}
          memberId={profile.id}
          type={showConnections}
          memberName={profile.display_name}
          onClose={() => setShowConnections(null)}
          onProfileClick={(id) => {
            setShowConnections(null);
            // Re-fetch with new member
          }}
        />
      )}
    </>
  );
}
