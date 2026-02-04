import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Bookmark,
  Crown, Shield, Sparkles, Box, Send, Flag, EyeOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MediaGallery } from "./MediaGallery";
import { ReactionPicker, ReactionType, ReactionSummary } from "./ReactionPicker";
import { ReportPostDialog } from "./ReportPostDialog";
import { useToast } from "@/hooks/use-toast";

export interface CommunityPost {
  id: string;
  user_id: string;
  author_id?: string;
  author_name: string;
  author_tier: "member" | "collector" | "elite" | "privilege" | "black";
  author_avatar?: string | null;
  author_items_count: number;
  type: "SHOWCASE" | "DISCUSSION" | "POLL";
  title: string;
  content: string;
  attachments: string[];
  media_types?: string[];
  likes_count: number;
  comments_count: number;
  reactions_summary?: Record<string, number>;
  is_pinned: boolean;
  created_at: string;
  has_liked: boolean;
  is_liked?: boolean;
  user_reactions?: string[];
}

interface CommunityPostCardProps {
  post: CommunityPost;
  clientCpf: string;
  onLike: (postId: string) => void;
  onReaction: (postId: string, reactionType: ReactionType) => void;
  onComment: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  isLiking?: boolean;
}

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted", label: "Member", border: "border-muted" },
  collector: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", label: "Privilege", border: "border-amber-500/50" },
  privilege: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", label: "Privilege", border: "border-amber-500/50" },
  elite: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "Black", border: "border-primary/50" },
  black: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "Black", border: "border-primary/50" },
};

const postTypeConfig = {
  SHOWCASE: { label: "Showcase", color: "bg-emerald-500/20 text-emerald-400", icon: "✨" },
  DISCUSSION: { label: "Discussão", color: "bg-blue-500/20 text-blue-400", icon: "💬" },
  POLL: { label: "Enquete", color: "bg-purple-500/20 text-purple-400", icon: "📊" },
};

export function CommunityPostCard({ 
  post, 
  clientCpf,
  onLike, 
  onReaction,
  onComment,
  onShare,
  onAuthorClick,
  isLiking 
}: CommunityPostCardProps) {
  const { toast } = useToast();
  const [localLiked, setLocalLiked] = useState(post.has_liked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [localReactions, setLocalReactions] = useState<ReactionType[]>(
    (post.user_reactions || []) as ReactionType[]
  );
  const [localReactionsSummary, setLocalReactionsSummary] = useState<Record<string, number>>(
    post.reactions_summary || { like: 0, fire: 0, clap: 0, wow: 0, love: 0 }
  );
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const tierInfo = tierConfig[post.author_tier];
  const TierIcon = tierInfo.icon;
  const postTypeInfo = postTypeConfig[post.type];

  // Build media items from attachments
  const mediaItems = (post.attachments || []).map((url, i) => ({
    url,
    type: (post.media_types?.[i] === "video" ? "video" : "image") as "image" | "video"
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const handleLike = () => {
    const newLiked = !localLiked;
    setLocalLiked(newLiked);
    setLocalLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    if (newLiked) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    
    onLike(post.id);
  };

  const handleReaction = (type: ReactionType) => {
    const isAdding = !localReactions.includes(type);
    
    setLocalReactions(prev => 
      isAdding ? [...prev, type] : prev.filter(r => r !== type)
    );
    
    setLocalReactionsSummary(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (isAdding ? 1 : -1))
    }));

    if (isAdding) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 600);
    }

    onReaction(post.id, type);
  };

  const handleDoubleClick = () => {
    if (!localLiked) {
      handleLike();
    } else {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vault/community/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content?.slice(0, 100),
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "Compartilhe com seus amigos",
      });
    }
    
    onShare?.(post.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removido dos salvos" : "Salvo! 🔖",
      description: isSaved ? "" : "Acesse em seus itens salvos",
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const totalReactions = Object.values(localReactionsSummary).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="card-premium overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Pinned indicator */}
        {post.is_pinned && (
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-4 py-1.5 text-xs font-medium text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Publicação fixada
          </div>
        )}

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                className="relative"
                onClick={() => onAuthorClick?.(post.author_id || post.user_id)}
              >
                <Avatar className={cn("h-12 w-12 border-2 hover:opacity-80 transition-opacity", tierInfo.border)}>
                  {post.author_avatar && (
                    <AvatarImage src={post.author_avatar} alt={post.author_name} />
                  )}
                  <AvatarFallback className={cn(tierInfo.bg, tierInfo.color, "font-semibold")}>
                    {getInitials(post.author_name)}
                  </AvatarFallback>
                </Avatar>
                {/* Tier badge */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 rounded-full p-0.5",
                  tierInfo.bg, "border-2 border-card"
                )}>
                  <TierIcon className={cn("h-3 w-3", tierInfo.color)} />
                </div>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <button 
                    className="font-semibold hover:underline cursor-pointer text-left"
                    onClick={() => onAuthorClick?.(post.author_id || post.user_id)}
                  >
                    {post.author_name}
                  </button>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tierInfo.color)}>
                    {tierInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    {post.author_items_count} itens
                  </span>
                  <span>•</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Badge className={cn("text-xs gap-1", postTypeInfo.color)}>
                <span>{postTypeInfo.icon}</span>
                {postTypeInfo.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSave}>
                    <Bookmark className={cn("h-4 w-4 mr-2", isSaved && "fill-current")} />
                    {isSaved ? "Remover dos salvos" : "Salvar publicação"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para amigo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Não tenho interesse
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Denunciar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div 
            className="mb-4 relative cursor-pointer"
            onDoubleClick={handleDoubleClick}
          >
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            {post.content && (
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            )}

            {/* Heart animation on double click */}
            <AnimatePresence>
              {showHeartAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="h-24 w-24 text-red-500 fill-red-500 drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Media Gallery */}
          {mediaItems.length > 0 && (
            <div className="mb-4">
              <MediaGallery 
                items={mediaItems} 
                onDoubleClick={handleDoubleClick}
              />
            </div>
          )}

          {/* Reactions & Stats Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground py-2 border-y border-border/50">
            <div className="flex items-center gap-4">
              {totalReactions > 0 && (
                <ReactionSummary 
                  summary={localReactionsSummary}
                  userReactions={localReactions}
                />
              )}
              {localLikesCount > 0 && totalReactions === 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  {localLikesCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {post.comments_count > 0 && (
                <button 
                  onClick={() => onComment(post.id)}
                  className="hover:underline"
                >
                  {post.comments_count} comentário{post.comments_count !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              {/* Reaction picker */}
              <ReactionPicker
                onSelect={handleReaction}
                userReactions={localReactions}
                summary={localReactionsSummary}
                showLabels
              />
            </div>

            <div className="flex items-center gap-1">
              {/* Like button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-2 hover:text-red-500 transition-colors",
                  localLiked && "text-red-500"
                )}
              >
                <motion.div
                  animate={localLiked ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn("h-5 w-5", localLiked && "fill-current")} />
                </motion.div>
                <span className="text-sm font-medium">Curtir</span>
              </Button>

              {/* Comment button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment(post.id)}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Comentar</span>
              </Button>

              {/* Share button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:inline">Compartilhar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <ReportPostDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        postId={post.id}
        postTitle={post.title}
        clientCpf={clientCpf}
      />
    </motion.div>
  );
}
