import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, MapPin, Calendar, ShoppingBag, Users, UserPlus, UserMinus,
  Instagram, Facebook, Linkedin, Twitter, Shield, Crown, Sparkles,
  Settings, ExternalLink, Check, Star, Award, Verified
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
  tier: string;
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

const tierConfig: Record<string, { icon: typeof Shield; label: string; color: string; gradient: string; glow: string }> = {
  member: { 
    icon: Shield, 
    label: "Member", 
    color: "text-muted-foreground", 
    gradient: "from-muted/20 to-muted/5",
    glow: "shadow-muted/20"
  },
  collector: { 
    icon: Crown, 
    label: "Privilege", 
    color: "text-primary", 
    gradient: "from-primary/30 to-primary/5",
    glow: "shadow-primary/30"
  },
  privilege: { 
    icon: Crown, 
    label: "Privilege", 
    color: "text-primary", 
    gradient: "from-primary/30 to-primary/5",
    glow: "shadow-primary/30"
  },
  elite: { 
    icon: Sparkles, 
    label: "Black", 
    color: "text-[hsl(var(--gold))]", 
    gradient: "from-[hsl(var(--gold))]/30 to-[hsl(var(--gold))]/5",
    glow: "shadow-[hsl(var(--gold))]/40"
  },
  black: { 
    icon: Sparkles, 
    label: "Black", 
    color: "text-[hsl(var(--gold))]", 
    gradient: "from-[hsl(var(--gold))]/30 to-[hsl(var(--gold))]/5",
    glow: "shadow-[hsl(var(--gold))]/40"
  },
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
          title: result.is_following ? "Seguindo! ✨" : "Deixou de seguir",
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
  const tierData = tierConfig[tier] || tierConfig.member;
  const TierIcon = tierData.icon;

  return (
    <>
      <Dialog open={!!memberId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-lg p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/50 overflow-hidden max-h-[90vh] shadow-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
              />
            </div>
          ) : profile ? (
            <ScrollArea className="max-h-[90vh]">
              {/* Premium Header with Gradient */}
              <div className="relative">
                {/* Gradient Background */}
                <div className={`h-32 relative overflow-hidden bg-gradient-to-br ${tierData.gradient}`}>
                  {/* Grid Pattern */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                      backgroundSize: '20px 20px'
                    }}
                  />
                  
                  {/* Animated Glow for Elite/Black tier */}
                  {(tier === "black" || tier === "elite") && (
                    <>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/20 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-[hsl(var(--gold))]/20"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />
                    </>
                  )}
                  
                  {/* Radial Glow */}
                  <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[200%] h-40 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
                
                {/* Avatar with Ring */}
                <div className="absolute -bottom-14 left-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className={`relative p-1 rounded-full bg-gradient-to-br ${tierData.gradient} ${tierData.glow} shadow-xl`}
                  >
                    <Avatar className="w-24 h-24 border-4 border-card">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className={`text-xl font-bold bg-gradient-to-br ${tierData.gradient} ${tierData.color}`}>
                        {getInitials(profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Tier Badge on Avatar */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-card border-2 border-card shadow-lg ${tierData.color}`}
                    >
                      <TierIcon className="h-4 w-4" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {profile.is_own_profile ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50"
                        onClick={() => {
                          onClose();
                          navigate("/vault/perfil");
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        Editar
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        className={`gap-1.5 ${isFollowing ? 'bg-card/80 backdrop-blur-sm' : 'btn-gold'}`}
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
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="pt-16 px-6 pb-4"
              >
                {/* Name and Tier */}
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold font-display">{profile.display_name}</h2>
                  <Badge 
                    variant="outline" 
                    className={`${tierData.color} border-current/30 gap-1 px-2 py-0.5 text-xs font-medium backdrop-blur-sm`}
                  >
                    <TierIcon className="h-3 w-3" />
                    Vault {tierData.label}
                  </Badge>
                </div>

                {/* Location */}
                {(profile.city || profile.state) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </p>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{profile.bio}</p>
                )}

                {/* Social Links - Premium Style */}
                {(profile.instagram_url || profile.facebook_url || profile.linkedin_url || profile.twitter_url) && (
                  <div className="flex gap-2 mb-5">
                    {profile.instagram_url && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        href={profile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 hover:from-primary/20 hover:to-primary/5 border border-border/50 transition-all duration-300 group"
                      >
                        <Instagram className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.a>
                    )}
                    {profile.facebook_url && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        href={profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 hover:from-primary/20 hover:to-primary/5 border border-border/50 transition-all duration-300 group"
                      >
                        <Facebook className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.a>
                    )}
                    {profile.linkedin_url && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 hover:from-primary/20 hover:to-primary/5 border border-border/50 transition-all duration-300 group"
                      >
                        <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.a>
                    )}
                    {profile.twitter_url && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 hover:from-primary/20 hover:to-primary/5 border border-border/50 transition-all duration-300 group"
                      >
                        <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.a>
                    )}
                  </div>
                )}

                {/* Stats - Premium Cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConnections("followers")}
                    className="p-3 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 border border-border/50 hover:border-primary/30 transition-all duration-300 group text-center"
                  >
                    <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {profile.followers_count}
                    </p>
                    <p className="text-xs text-muted-foreground">seguidores</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConnections("following")}
                    className="p-3 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 border border-border/50 hover:border-primary/30 transition-all duration-300 group text-center"
                  >
                    <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {profile.following_count}
                    </p>
                    <p className="text-xs text-muted-foreground">seguindo</p>
                  </motion.button>
                  
                  <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 border border-border/50 text-center">
                    <p className="text-lg font-bold text-foreground">{profile.posts_count}</p>
                    <p className="text-xs text-muted-foreground">posts</p>
                  </div>
                </div>

                {/* Meta info - Subtle */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pb-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50">
                    <Calendar className="h-3.5 w-3.5" />
                    Membro desde {formatDate(profile.joined_at)}
                  </span>
                  {profile.total_purchases > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50">
                      <Award className="h-3.5 w-3.5 text-primary" />
                      {profile.total_purchases} compras verificadas
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Collection - Premium Grid */}
              {items.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="px-6 pb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </div>
                      Coleção
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {items.slice(0, 6).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-secondary to-secondary/50 relative group cursor-pointer border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        {item.inspection_photos?.[0] ? (
                          <img
                            src={item.inspection_photos[0]}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2.5">
                          <p className="text-white text-xs font-medium truncate">{item.brand || item.title}</p>
                          {item.model && (
                            <p className="text-white/70 text-xs truncate">{item.model}</p>
                          )}
                        </div>
                        
                        {/* Verified Badge */}
                        {item.verified_status === "VERIFIED" && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1.5 right-1.5 p-1 bg-primary text-primary-foreground rounded-full shadow-lg"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  
                  {items.length > 6 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1"
                    >
                      <Star className="h-3 w-3 text-primary" />
                      +{items.length - 6} itens na coleção
                    </motion.p>
                  )}
                </motion.div>
              )}
            </ScrollArea>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center px-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Perfil não encontrado</p>
            </motion.div>
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
          }}
        />
      )}
    </>
  );
}
