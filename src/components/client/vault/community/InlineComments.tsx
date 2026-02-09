import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Reply, Send, X, Crown, Shield, Sparkles, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ReactionPicker, ReactionType, ReactionSummary } from "./ReactionPicker";
import { FormattedText } from "./FormattedText";

interface Comment {
  id: string;
  user_id: string;
  author_name: string;
  author_tier: "member" | "collector" | "elite";
  content: string;
  parent_id: string | null;
  likes_count: number;
  reactions_summary?: Record<string, number>;
  created_at: string;
  has_liked: boolean;
  user_reactions?: string[];
}

interface InlineCommentsProps {
  postId: string;
  clientCpf: string;
  autoFocus?: boolean;
}

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
  collector: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" },
  elite: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" },
};

export function InlineComments({ postId, clientCpf, autoFocus = true }: InlineCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_post_comments", {
        p_post_id: postId,
        p_cpf: clientCpf,
      });
      if (!error && data) setComments(data as Comment[]);
    } catch (e) {
      console.error("Error fetching comments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("add_post_comment", {
        p_post_id: postId,
        p_cpf: clientCpf,
        p_content: newComment.trim(),
        p_parent_id: replyingTo?.id || null,
      });
      if (!error) {
        setNewComment("");
        setReplyingTo(null);
        fetchComments();
      }
    } catch (e) {
      console.error("Error adding comment:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, has_liked: !c.has_liked, likes_count: c.has_liked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1 };
      }
      return c;
    }));
    try {
      const { data, error } = await supabase.rpc("toggle_comment_like", { p_comment_id: commentId, p_cpf: clientCpf });
      const response = data as { success?: boolean; liked?: boolean; likes_count?: number } | null;
      if (error || !response?.success) {
        setComments(prev => prev.map(c => {
          if (c.id === commentId) return { ...c, has_liked: !c.has_liked, likes_count: c.has_liked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1) };
          return c;
        }));
      } else if (response.likes_count !== undefined) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: response.likes_count! } : c));
      }
    } catch {}
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);
  const displayedComments = showAll ? topLevelComments : topLevelComments.slice(0, 3);
  const hasMoreComments = topLevelComments.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 ml-[52px]"
    >
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="mb-3">
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"
            >
              <Reply className="h-3 w-3" />
              <span>Respondendo a <span className="font-medium text-foreground">{replyingTo.author_name}</span></span>
              <button type="button" onClick={() => setReplyingTo(null)} className="ml-auto">
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "Responder..." : "Comentar..."}
            className="flex-1 h-9 bg-muted/30 border-0 rounded-full text-sm px-4 focus-visible:ring-1 focus-visible:ring-primary/30"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || isSubmitting}
            className="h-9 w-9 rounded-full shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments */}
      {!isLoading && displayedComments.length > 0 && (
        <div className="space-y-2">
          {displayedComments.map(comment => {
            const tierInfo = tierConfig[comment.author_tier] || tierConfig.member;
            const TierIcon = tierInfo.icon;
            const replies = getReplies(comment.id);

            return (
              <div key={comment.id}>
                <div className="flex gap-2 group">
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarFallback className={cn("text-[9px]", tierInfo.bg, tierInfo.color)}>
                      {getInitials(comment.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/30 rounded-2xl px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs">{comment.author_name}</span>
                        <TierIcon className={cn("h-2.5 w-2.5", tierInfo.color)} />
                      </div>
                      <FormattedText content={comment.content} className="text-xs text-foreground/80" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 px-2">
                      <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={cn("text-[10px] font-medium transition-colors", comment.has_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive")}
                      >
                        {comment.has_liked ? "❤️" : "Curtir"}{comment.likes_count > 0 && ` ${comment.likes_count}`}
                      </button>
                      <button
                        onClick={() => setReplyingTo(comment)}
                        className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Responder
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1.5 border-l-2 border-border/20 pl-3">
                    {replies.map(reply => {
                      const rTier = tierConfig[reply.author_tier] || tierConfig.member;
                      const RTierIcon = rTier.icon;
                      return (
                        <div key={reply.id} className="flex gap-2">
                          <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                            <AvatarFallback className={cn("text-[8px]", rTier.bg, rTier.color)}>
                              {getInitials(reply.author_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/20 rounded-xl px-2.5 py-1.5">
                              <span className="font-semibold text-[11px]">{reply.author_name}</span>
                              <FormattedText content={reply.content} className="text-[11px] text-foreground/80" />
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 px-2">
                              <span className="text-[10px] text-muted-foreground">{formatDate(reply.created_at)}</span>
                              <button
                                onClick={() => handleLikeComment(reply.id)}
                                className={cn("text-[10px] font-medium transition-colors", reply.has_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive")}
                              >
                                {reply.has_liked ? "❤️" : "Curtir"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Show more/less */}
          {hasMoreComments && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors ml-8"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Ver todos os {topLevelComments.length} comentários
                </>
              )}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
