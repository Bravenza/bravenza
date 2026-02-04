import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, MapPin, Calendar, ShoppingBag, Users, UserPlus,
  Instagram, Facebook, Linkedin, Twitter, Shield, Crown, Sparkles,
  Settings, Check, Award, Gem
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

const tierConfig: Record<string, { 
  icon: typeof Shield; 
  label: string; 
  gradient: string;
  avatarRing: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
}> = {
  member: { 
    icon: Shield, 
    label: "Access", 
    gradient: "from-zinc-600/40 via-zinc-700/20 to-zinc-800/40",
    avatarRing: "ring-zinc-500/50",
    badgeBg: "bg-zinc-800/80",
    badgeText: "text-zinc-300",
    glowColor: "rgba(113, 113, 122, 0.3)"
  },
  collector: { 
    icon: Crown, 
    label: "Privilege", 
    gradient: "from-primary/50 via-primary/20 to-primary/40",
    avatarRing: "ring-primary/70",
    badgeBg: "bg-primary/20",
    badgeText: "text-primary",
    glowColor: "hsl(var(--primary) / 0.4)"
  },
  privilege: { 
    icon: Crown, 
    label: "Privilege", 
    gradient: "from-primary/50 via-primary/20 to-primary/40",
    avatarRing: "ring-primary/70",
    badgeBg: "bg-primary/20",
    badgeText: "text-primary",
    glowColor: "hsl(var(--primary) / 0.4)"
  },
  elite: { 
    icon: Sparkles, 
    label: "Black", 
    gradient: "from-amber-500/40 via-yellow-500/20 to-amber-600/30",
    avatarRing: "ring-[hsl(var(--gold))]/80",
    badgeBg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20",
    badgeText: "text-[hsl(var(--gold))]",
    glowColor: "hsl(var(--gold) / 0.5)"
  },
  black: { 
    icon: Sparkles, 
    label: "Black", 
    gradient: "from-amber-500/40 via-yellow-500/20 to-amber-600/30",
    avatarRing: "ring-[hsl(var(--gold))]/80",
    badgeBg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20",
    badgeText: "text-[hsl(var(--gold))]",
    glowColor: "hsl(var(--gold) / 0.5)"
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
      month: "short",
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
  const isEliteTier = tier === "black" || tier === "elite";

  return (
    <>
      <Dialog open={!!memberId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md p-0 gap-0 bg-transparent border-0 overflow-visible max-h-[92vh] shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">Perfil do membro</DialogTitle>
          
          {isLoading ? (
            <div className="bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/50 flex items-center justify-center py-24">
              <motion.div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary"
                />
                <Gem className="absolute inset-0 m-auto h-5 w-5 text-primary" />
              </motion.div>
            </div>
          ) : profile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative"
            >
              {/* Glow Effect Behind Card */}
              <div 
                className="absolute -inset-4 rounded-3xl blur-2xl opacity-60"
                style={{ background: `radial-gradient(ellipse at center, ${tierData.glowColor}, transparent 70%)` }}
              />
              
              {/* Main Card */}
              <div className="relative bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/50 overflow-hidden shadow-2xl">
                
                {/* Close Button - Fixed Position */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all"
                >
                  <X className="h-4 w-4" />
                </motion.button>

                {/* Hero Header */}
                <div className="relative h-36 overflow-hidden">
                  {/* Animated Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tierData.gradient}`} />
                  
                  {/* Mesh Pattern */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                  
                  {/* Floating Particles for Elite */}
                  {isEliteTier && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-[hsl(var(--gold))]"
                          style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
                          animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--gold))]/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                    </>
                  )}
                  
                  {/* Radial Fade */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
                </div>

                {/* Avatar - Overlapping Header */}
                <div className="relative -mt-16 px-6">
                  <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                    className="relative inline-block"
                  >
                    {/* Avatar Glow */}
                    <div 
                      className="absolute -inset-2 rounded-full blur-xl opacity-60"
                      style={{ background: tierData.glowColor }}
                    />
                    
                    {/* Avatar Ring */}
                    <div className={`relative p-1 rounded-full bg-card ring-4 ${tierData.avatarRing} shadow-xl`}>
                      <Avatar className="w-24 h-24 border-2 border-card">
                        {profile.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className={`text-2xl font-bold bg-gradient-to-br ${tierData.gradient}`}>
                          {getInitials(profile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* Tier Icon Badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                      className={`absolute -bottom-1 -right-1 p-2 rounded-full ${tierData.badgeBg} backdrop-blur-sm border border-white/10 shadow-lg`}
                    >
                      <TierIcon className={`h-4 w-4 ${tierData.badgeText}`} />
                    </motion.div>
                  </motion.div>

                  {/* Action Button - Positioned to right of avatar area */}
                  <div className="absolute right-6 top-4">
                    {profile.is_own_profile ? (
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 bg-card/80 backdrop-blur-sm border-border/80 hover:bg-card hover:border-primary/50"
                          onClick={() => {
                            onClose();
                            navigate("/vault/perfil");
                          }}
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Editar perfil
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          size="sm"
                          className={`gap-2 ${isFollowing 
                            ? 'bg-card/80 border border-border/80 text-foreground hover:bg-card hover:border-primary/50' 
                            : 'btn-gold shadow-lg shadow-primary/25'
                          }`}
                          variant={isFollowing ? "outline" : "default"}
                          onClick={handleToggleFollow}
                          disabled={isToggling}
                        >
                          {isFollowing ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Seguindo
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5" />
                              Seguir
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <ScrollArea className="max-h-[calc(92vh-144px)]">
                  {/* Profile Content */}
                  <div className="px-6 pt-4 pb-6 space-y-5">
                    {/* Name & Tier */}
                    <div>
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2.5 mb-1"
                      >
                        <h2 className="text-xl font-bold font-display tracking-tight">{profile.display_name}</h2>
                        <Badge className={`${tierData.badgeBg} ${tierData.badgeText} border-0 gap-1 px-2.5 py-0.5 text-xs font-semibold`}>
                          <TierIcon className="h-3 w-3" />
                          {tierData.label}
                        </Badge>
                      </motion.div>

                      {(profile.city || profile.state) && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 }}
                          className="text-sm text-muted-foreground flex items-center gap-1.5"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {[profile.city, profile.state].filter(Boolean).join(", ")}
                        </motion.p>
                      )}
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-foreground/80 leading-relaxed"
                      >
                        {profile.bio}
                      </motion.p>
                    )}

                    {/* Stats Row */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="flex items-center gap-1"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowConnections("followers")}
                        className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-b from-secondary/80 to-secondary/40 border border-border/40 hover:border-primary/40 transition-all group"
                      >
                        <p className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {profile.followers_count}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Seguidores
                        </p>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowConnections("following")}
                        className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-b from-secondary/80 to-secondary/40 border border-border/40 hover:border-primary/40 transition-all group"
                      >
                        <p className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {profile.following_count}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Seguindo
                        </p>
                      </motion.button>
                      
                      <div className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-b from-secondary/80 to-secondary/40 border border-border/40">
                        <p className="text-xl font-bold text-foreground">{profile.posts_count}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Posts
                        </p>
                      </div>
                    </motion.div>

                    {/* Social Links */}
                    {(profile.instagram_url || profile.facebook_url || profile.linkedin_url || profile.twitter_url) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-2"
                      >
                        {[
                          { url: profile.instagram_url, icon: Instagram },
                          { url: profile.facebook_url, icon: Facebook },
                          { url: profile.linkedin_url, icon: Linkedin },
                          { url: profile.twitter_url, icon: Twitter },
                        ].filter(s => s.url).map((social, i) => {
                          const Icon = social.icon;
                          return (
                            <motion.a
                              key={i}
                              whileHover={{ scale: 1.15, y: -3 }}
                              whileTap={{ scale: 0.95 }}
                              href={social.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-secondary/60 hover:bg-primary/20 border border-border/40 hover:border-primary/40 transition-all group"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </motion.a>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Member Info Tags */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="flex flex-wrap gap-2"
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Desde {formatDate(profile.joined_at)}
                      </span>
                      {profile.total_purchases > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs text-primary font-medium">
                          <Award className="h-3 w-3" />
                          {profile.total_purchases} verificados
                        </span>
                      )}
                    </motion.div>

                    {/* Collection Section - Clean Modern Design */}
                    {items.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="pt-3 border-t border-border/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Coleção
                          </h3>
                          <span className="text-xs text-muted-foreground/70">
                            {items.length} {items.length === 1 ? 'peça' : 'peças'}
                          </span>
                        </div>
                        
                        {/* Clean Horizontal Scroll */}
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                          {items.slice(0, 8).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.55 + index * 0.03 }}
                              className="flex-shrink-0 group"
                            >
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary/30">
                                {item.inspection_photos?.[0] ? (
                                  <img
                                    src={item.inspection_photos[0]}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                                    <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                                  </div>
                                )}
                                
                                {/* Subtle Verified Indicator */}
                                {item.verified_status === "VERIFIED" && (
                                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary/90 flex items-center justify-center">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Clean Label Below */}
                              <div className="mt-1.5 w-20">
                                <p className="text-[10px] font-medium text-foreground/80 truncate">
                                  {item.brand || item.title}
                                </p>
                                {item.size && (
                                  <p className="text-[9px] text-muted-foreground/60">
                                    Tam. {item.size}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* "More" Indicator */}
                          {items.length > 8 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.8 }}
                              className="flex-shrink-0 w-20 h-20 rounded-lg bg-secondary/20 border border-dashed border-border/40 flex flex-col items-center justify-center"
                            >
                              <span className="text-lg font-semibold text-muted-foreground/50">+{items.length - 8}</span>
                              <span className="text-[9px] text-muted-foreground/40">peças</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/50 py-16 px-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Perfil não encontrado</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Fechar
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Connections List Modal */}
      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
}
