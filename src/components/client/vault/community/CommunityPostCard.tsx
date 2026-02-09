import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, MoreHorizontal, Bookmark,
  Crown, Shield, Sparkles, Send, Flag, EyeOff
} from "lucide-react";
import { InlineComments } from "./InlineComments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MediaGallery } from "./MediaGallery";
import { ReactionPicker, ReactionType, ReactionSummary } from "./ReactionPicker";
import { ReportPostDialog } from "./ReportPostDialog";
import { FormattedText } from "./FormattedText";
import { useToast } from "@/hooks/use-toast";

export interface LikeResponse {
  success: boolean;
  liked?: boolean;
  likes_count?: number;
}

export interface ReactionResponse {
  success: boolean;
  added?: boolean;
  summary?: Record<string, number>;
}

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

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted", label: "Member", ring: "ring-muted" },
  collector: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", label: "Privilege", ring: "ring-amber-500/60" },
  privilege: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", label: "Privilege", ring: "ring-amber-500/60" },
  elite: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "Black", ring: "ring-primary/60" },
  black: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "Black", ring: "ring-primary/60" },
};

interface CommunityPostCardProps {
  post: CommunityPost;
  clientCpf: string;
  onLike: (postId: string) => Promise<LikeResponse>;
  onReaction: (postId: string, reactionType: ReactionType) => Promise<ReactionResponse>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  isLiking?: boolean;
}

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
  const [localLiked, setLocalLiked] = useState(post.has_liked ?? post.is_liked ?? false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count ?? 0);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isProcessingReaction, setIsProcessingReaction] = useState(false);
  const [localReactions, setLocalReactions] = useState<ReactionType[]>(
    (post.user_reactions || []) as ReactionType[]
  );
  const [localReactionsSummary, setLocalReactionsSummary] = useState<Record<string, number>>(
    post.reactions_summary || { like: 0, fire: 0, clap: 0, wow: 0, love: 0 }
  );
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const tierInfo = tierConfig[post.author_tier];
  const TierIcon = tierInfo?.icon || Shield;

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

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessingLike || isLiking) return;
    setIsProcessingLike(true);
    const newLiked = !localLiked;
    setLocalLiked(newLiked);
    setLocalLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (newLiked) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    try {
      const result = await onLike(post.id);
      if (!result.success) {
        setLocalLiked(!newLiked);
        setLocalLikesCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
      } else if (result.likes_count !== undefined) {
        setLocalLikesCount(result.likes_count);
      }
    } catch {
      setLocalLiked(!newLiked);
      setLocalLikesCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
    } finally {
      setIsProcessingLike(false);
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (isProcessingReaction) return;
    setIsProcessingReaction(true);
    const isAdding = !localReactions.includes(type);
    setLocalReactions(prev => isAdding ? [...prev, type] : prev.filter(r => r !== type));
    setLocalReactionsSummary(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (isAdding ? 1 : -1))
    }));
    if (isAdding) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 600);
    }
    try {
      const result = await onReaction(post.id, type);
      if (!result.success) {
        setLocalReactions(prev => isAdding ? prev.filter(r => r !== type) : [...prev, type]);
        setLocalReactionsSummary(prev => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) + (isAdding ? -1 : 1))
        }));
      } else if (result.summary) {
        setLocalReactionsSummary(result.summary);
      }
    } catch {
      setLocalReactions(prev => isAdding ? prev.filter(r => r !== type) : [...prev, type]);
      setLocalReactionsSummary(prev => ({
        ...prev,
        [type]: Math.max(0, (prev[type] || 0) + (isAdding ? -1 : 1))
      }));
    } finally {
      setIsProcessingReaction(false);
    }
  };

  const handleDoubleClick = () => {
    if (!localLiked) {
      handleLikeClick({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent);
    } else {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/minha-conta?tab=comunidade`;
    const shareData = { title: post.title || "Post da Comunidade Vault", url: shareUrl };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copiado! 🔗" });
      }
    } catch (err: any) {
      // User cancelled share dialog — not an error
      if (err?.name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copiado! 🔗" });
      }
    }
    onShare?.(post.id);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const totalReactions = Object.values(localReactionsSummary).reduce((a, b) => a + b, 0);

  const handleCommentClick = () => {
    setShowComments(prev => !prev);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="relative rounded-2xl bg-card/40 backdrop-blur-sm border border-border/10 p-4 hover:bg-card/60 transition-colors duration-200"
    >
      {/* Pinned */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary mb-2 ml-14">
          <Sparkles className="h-3 w-3" />
          Publicação fixada
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar column */}
        <button 
          className="shrink-0 mt-0.5"
          onClick={() => onAuthorClick?.(post.author_id || post.user_id)}
        >
          <div className={cn("p-[2px] rounded-full bg-gradient-to-br", 
            post.author_tier === "elite" || post.author_tier === "black" 
              ? "from-primary via-amber-400 to-primary" 
              : post.author_tier === "collector" || post.author_tier === "privilege"
                ? "from-violet-400 via-purple-500 to-violet-400"
                : "from-muted-foreground/30 to-muted-foreground/10"
          )}>
            <Avatar className="h-10 w-10 border-2 border-background">
              {post.author_avatar && <AvatarImage src={post.author_avatar} alt={post.author_name} />}
              <AvatarFallback className="text-xs font-semibold bg-secondary">
                {getInitials(post.author_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </button>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <button 
                className="font-semibold text-sm hover:underline truncate"
                onClick={() => onAuthorClick?.(post.author_id || post.user_id)}
              >
                {post.author_name}
              </button>
              {(post.author_tier === "elite" || post.author_tier === "black") && (
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              {(post.author_tier === "collector" || post.author_tier === "privilege") && (
                <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              <span className="text-xs text-muted-foreground shrink-0">{formatDate(post.created_at)}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 -mr-1.5 rounded-full hover:bg-muted/50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <EyeOff className="h-4 w-4 mr-2" /> Não tenho interesse
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => setShowReportDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" /> Denunciar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post content */}
          <div className="relative" onDoubleClick={handleDoubleClick}>
            {post.title && (
              <h3 className="font-semibold text-[15px] leading-snug mb-1">{post.title}</h3>
            )}
            {post.content && (
              <FormattedText 
                content={post.content} 
                className="text-sm text-foreground/80 leading-relaxed"
              />
            )}

            {/* Heart animation */}
            <AnimatePresence>
              {showHeartAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                  <Heart className="h-20 w-20 text-destructive fill-destructive drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Media */}
          {mediaItems.length > 0 && (
            <div className="mt-3 rounded-2xl overflow-hidden">
              <MediaGallery items={mediaItems} onDoubleClick={handleDoubleClick} />
            </div>
          )}

          {/* Reactions summary */}
          {(totalReactions > 0 || localLikesCount > 0) && (
            <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground">
              {totalReactions > 0 && (
                <ReactionSummary 
                  summary={localReactionsSummary}
                  userReactions={localReactions}
                />
              )}
              {localLikesCount > 0 && totalReactions === 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-destructive fill-destructive" />
                  {localLikesCount} curtida{localLikesCount !== 1 ? "s" : ""}
                </span>
              )}
              {post.comments_count > 0 && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <button onClick={() => onComment(post.id)} className="hover:underline">
                    {post.comments_count} comentário{post.comments_count !== 1 ? "s" : ""}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-1 mt-2 -ml-2">
            <button
              onClick={handleLikeClick}
              disabled={isLiking || isProcessingLike}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]",
                localLiked 
                  ? "text-destructive" 
                  : "text-muted-foreground hover:text-destructive"
              )}
            >
              <motion.div animate={localLiked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={cn("h-[18px] w-[18px]", localLiked && "fill-current")} />
              </motion.div>
            </button>

            <button
              onClick={handleCommentClick}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]",
                showComments ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle className={cn("h-[18px] w-[18px]", showComments && "fill-primary/20")} />
              {post.comments_count > 0 && <span className="text-xs">{post.comments_count}</span>}
            </button>

            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
            >
              <Send className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={() => { setIsSaved(!isSaved); toast({ title: isSaved ? "Removido dos salvos" : "Salvo! 🔖" }); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px]",
                isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark className={cn("h-[18px] w-[18px]", isSaved && "fill-current")} />
            </button>

            <div className="ml-auto">
              <ReactionPicker
                onSelect={handleReaction}
                userReactions={localReactions}
                summary={localReactionsSummary}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inline Comments */}
      <AnimatePresence>
        {showComments && (
          <InlineComments
            postId={post.id}
            clientCpf={clientCpf}
            autoFocus
          />
        )}
      </AnimatePresence>

      {/* Report Dialog */}
      <ReportPostDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        postId={post.id}
        postTitle={post.title}
        clientCpf={clientCpf}
      />
    </motion.article>
  );
}
