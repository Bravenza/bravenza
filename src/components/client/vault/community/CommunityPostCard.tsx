import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal,
  Crown, Shield, Sparkles, Box
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  author_tier: "member" | "collector" | "elite";
  author_items_count: number;
  type: "SHOWCASE" | "DISCUSSION" | "POLL";
  title: string;
  content: string;
  attachments: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  has_liked: boolean;
}

interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare?: (postId: string) => void;
  isLiking?: boolean;
}

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted", label: "Member" },
  collector: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", label: "Privilege" },
  elite: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "Black" },
};

const postTypeConfig = {
  SHOWCASE: { label: "Showcase", color: "bg-emerald-500/20 text-emerald-400" },
  DISCUSSION: { label: "Discussão", color: "bg-blue-500/20 text-blue-400" },
  POLL: { label: "Enquete", color: "bg-purple-500/20 text-purple-400" },
};

export function CommunityPostCard({ 
  post, 
  onLike, 
  onComment,
  onShare,
  isLiking 
}: CommunityPostCardProps) {
  const [localLiked, setLocalLiked] = useState(post.has_liked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const tierInfo = tierConfig[post.author_tier];
  const TierIcon = tierInfo.icon;
  const postTypeInfo = postTypeConfig[post.type];

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

  const handleDoubleClick = () => {
    if (!localLiked) {
      handleLike();
    } else {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="card-premium overflow-hidden">
        {/* Pinned indicator */}
        {post.is_pinned && (
          <div className="bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Publicação fixada
          </div>
        )}

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className={cn("h-11 w-11 border-2", tierInfo.color.replace("text-", "border-"))}>
                <AvatarFallback className={cn(tierInfo.bg, tierInfo.color, "font-semibold")}>
                  {getInitials(post.author_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{post.author_name}</span>
                  <TierIcon className={cn("h-4 w-4", tierInfo.color)} />
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

            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", postTypeInfo.color)}>
                {postTypeInfo.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Reportar</DropdownMenuItem>
                  <DropdownMenuItem>Não tenho interesse</DropdownMenuItem>
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
            <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>

            {/* Heart animation on double click */}
            <AnimatePresence>
              {showHeartAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="h-20 w-20 text-red-500 fill-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div 
              className={cn(
                "mb-4 grid gap-2 rounded-xl overflow-hidden",
                post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
              onDoubleClick={handleDoubleClick}
            >
              {post.attachments.slice(0, 4).map((url, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "relative bg-muted",
                    post.attachments.length === 1 ? "aspect-video" : "aspect-square",
                    post.attachments.length === 3 && i === 0 && "row-span-2"
                  )}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {i === 3 && post.attachments.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        +{post.attachments.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
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
              <span className="text-sm font-medium">{localLikesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-2 hover:text-primary transition-colors ml-auto"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
