import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Reply, Send, X, Crown, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  author_name: string;
  author_tier: "member" | "collector" | "elite";
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  has_liked: boolean;
}

interface CommunityCommentsProps {
  postId: string;
  clientCpf: string;
  onClose: () => void;
}

const tierConfig = {
  member: { icon: Shield, color: "text-muted-foreground" },
  collector: { icon: Crown, color: "text-amber-500" },
  elite: { icon: Sparkles, color: "text-primary" },
};

export function CommunityComments({ postId, clientCpf, onClose }: CommunityCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_post_comments", {
        p_post_id: postId,
        p_cpf: clientCpf,
      });
      if (!error && data) {
        setComments(data as Comment[]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
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
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await supabase.rpc("toggle_comment_like", {
        p_comment_id: commentId,
        p_cpf: clientCpf,
      });
      
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            has_liked: !c.has_liked,
            likes_count: c.has_liked ? c.likes_count - 1 : c.likes_count + 1,
          };
        }
        return c;
      }));
    } catch (error) {
      console.error("Error liking comment:", error);
    }
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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const tierInfo = tierConfig[comment.author_tier];
    const TierIcon = tierInfo.icon;
    const replies = getReplies(comment.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(isReply && "ml-10")}
      >
        <div className="flex gap-3 py-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(comment.author_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author_name}</span>
              <TierIcon className={cn("h-3 w-3", tierInfo.color)} />
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  comment.has_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", comment.has_liked && "fill-current")} />
                {comment.likes_count > 0 && comment.likes_count}
              </button>
              
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Responder
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="border-l-2 border-border/50">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 md:relative md:inset-auto"
    >
      {/* Mobile overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      
      <div className="absolute bottom-0 left-0 right-0 md:relative bg-card border-t md:border border-border rounded-t-2xl md:rounded-xl max-h-[80vh] md:max-h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Comentários</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments list */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Nenhum comentário ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {topLevelComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Reply indicator */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                Respondendo a <span className="font-medium">{replyingTo.author_name}</span>
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Escreva uma resposta..." : "Adicione um comentário..."}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
