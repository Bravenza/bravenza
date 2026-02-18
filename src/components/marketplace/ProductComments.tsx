import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Reply, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProductComment {
  id: string;
  product_id: string;
  user_cpf: string;
  user_name: string | null;
  content: string;
  is_seller_reply: boolean;
  parent_id: string | null;
  is_visible: boolean;
  created_at: string;
  replies?: ProductComment[];
}

interface ProductCommentsProps {
  productId: string;
  comments: ProductComment[];
  isLoading: boolean;
  onSubmit: (content: string, parentId?: string) => Promise<boolean>;
  onRefresh: () => void;
  currentUserName?: string;
}

export function ProductComments({
  productId,
  comments,
  isLoading,
  onSubmit,
  onRefresh,
  currentUserName,
}: ProductCommentsProps) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Group replies under parent
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesMap: Record<string, ProductComment[]> = {};
  comments.forEach((c) => {
    if (c.parent_id) {
      if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
      repliesMap[c.parent_id].push(c);
    }
  });

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    const ok = await onSubmit(content.trim(), replyTo?.id);
    if (ok) {
      setContent("");
      setReplyTo(null);
      onRefresh();
    }
    setSubmitting(false);
  };

  const visibleComments = expanded ? topLevel : topLevel.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
          <MessageSquare className="h-4 w-4 text-primary" />
          Perguntas ({comments.length})
        </h3>
      </div>

      {/* Input */}
      <div className="space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
            <CornerDownRight className="h-3 w-3" />
            Respondendo a <span className="font-medium text-foreground">{replyTo.name}</span>
            <button onClick={() => setReplyTo(null)} className="ml-auto text-xs hover:text-foreground">
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder={replyTo ? "Escreva sua resposta..." : "Faça uma pergunta sobre este produto..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <Button
            size="icon"
            className="btn-gold h-auto flex-shrink-0"
            disabled={!content.trim() || submitting}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Comments */}
      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Carregando perguntas...</div>
      ) : topLevel.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma pergunta ainda. Seja o primeiro!
        </div>
      ) : (
        <div className="space-y-3">
          {visibleComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap[comment.id] || []}
              onReply={(id, name) => setReplyTo({ id, name })}
            />
          ))}

          {topLevel.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary font-medium hover:underline"
            >
              {expanded ? "Mostrar menos" : `Ver todas as ${topLevel.length} perguntas`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
}: {
  comment: ProductComment;
  replies: ProductComment[];
  onReply: (id: string, name: string) => void;
}) {
  const name = comment.user_name || "Anônimo";
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="space-y-2">
      <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-foreground">{name}</span>
          {comment.is_seller_reply && (
            <Badge className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30">
              Vendedor
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
        <button
          onClick={() => onReply(comment.id, name)}
          className="mt-1.5 text-[10px] text-primary flex items-center gap-1 hover:underline"
        >
          <Reply className="h-3 w-3" /> Responder
        </button>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {replies.map((reply) => {
            const rName = reply.user_name || "Anônimo";
            const rTime = formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR });
            return (
              <div key={reply.id} className="p-2.5 bg-muted/10 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 mb-1">
                  <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{rName}</span>
                  {reply.is_seller_reply && (
                    <Badge className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30">
                      Vendedor
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">{rTime}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{reply.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
