import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMarketplaceHeaders } from "@/hooks/marketplace/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-engage`;

interface SellerReview {
  id: string;
  product_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  is_verified_purchase: boolean;
}

interface SellerReply {
  id: string;
  review_id: string;
  content: string;
  created_at: string;
}

export function SellerReviewsSection({ cpf }: { cpf: string }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [replies, setReplies] = useState<Record<string, SellerReply>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getMarketplaceHeaders();
      // Fetch seller's sales to get product_ids
      const salesRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-orders?action=my-sales`,
        { headers }
      );
      const salesData = await salesRes.json();
      const orders = salesData.orders || [];

      // Get unique product_ids from listings
      const productIds = [...new Set(
        orders
          .map((o: any) => o.listing?.product_id)
          .filter(Boolean)
      )] as string[];

      if (productIds.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // Fetch reviews for each product
      const allReviews: SellerReview[] = [];
      const allReplies: Record<string, SellerReply> = {};

      await Promise.all(
        productIds.slice(0, 10).map(async (pid) => {
          try {
            const params = new URLSearchParams({ action: "product-reviews", product_id: pid });
            const res = await fetch(`${BASE}?${params}`, { headers });
            const data = await res.json();
            if (data.reviews) {
              allReviews.push(...data.reviews.map((r: any) => ({ ...r, product_id: pid })));
            }
            // Fetch comments to find seller replies
            const cParams = new URLSearchParams({ action: "product-comments", product_id: pid });
            const cRes = await fetch(`${BASE}?${cParams}`, { headers });
            const cData = await cRes.json();
            if (cData.comments) {
              for (const c of cData.comments) {
                if (c.is_seller_reply && c.review_id) {
                  allReplies[c.review_id] = {
                    id: c.id,
                    review_id: c.review_id,
                    content: c.content,
                    created_at: c.created_at,
                  };
                }
              }
            }
          } catch {
            // skip individual product errors
          }
        })
      );

      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviews(allReviews);
      setReplies(allReplies);
    } catch (err) {
      console.error("Fetch seller reviews error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmitReply = async (reviewId: string, productId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const headers = await getMarketplaceHeaders();
      const res = await fetch(`${BASE}?action=product-comment`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_id: productId,
          content: replyText.trim(),
          is_seller_reply: true,
          review_id: reviewId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Resposta enviada!" });
      setReplies(prev => ({
        ...prev,
        [reviewId]: { id: data.comment.id, review_id: reviewId, content: replyText.trim(), created_at: new Date().toISOString() },
      }));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Erro ao responder", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (reviews.length === 0) return null;

  const displayReviews = expanded ? reviews : reviews.slice(0, 3);
  const unrepliedCount = reviews.filter(r => !replies[r.id]).length;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}>
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-500/20 to-transparent" />
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
              <MessageSquare className="h-3.5 w-3.5" /> Avaliações recebidas
            </CardTitle>
            {unrepliedCount > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-warning/30 text-warning bg-warning/5">
                {unrepliedCount} sem resposta
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          {displayReviews.map((review) => {
            const reply = replies[review.id];
            const isReplying = replyingTo === review.id;

            return (
              <div key={review.id} className="rounded-xl border border-border/30 bg-muted/10 overflow-hidden">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">{review.reviewer_name || "Anônimo"}</span>
                    {review.is_verified_purchase && (
                      <span className="text-[8px] px-1 py-0.5 bg-primary/15 text-primary rounded-full font-medium">Verificada</span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-xs text-foreground/80 leading-relaxed">{review.comment}</p>
                  )}
                </div>

                {/* Seller reply */}
                {reply && (
                  <div className="px-3 pb-3">
                    <div className="ml-3 pl-3 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg p-2.5">
                      <p className="text-[10px] font-semibold text-primary mb-0.5">Resposta do vendedor</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                )}

                {/* Reply action */}
                {!reply && !isReplying && (
                  <div className="px-3 pb-2.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2 text-primary hover:text-primary gap-1"
                      onClick={() => { setReplyingTo(review.id); setReplyText(""); }}
                    >
                      <MessageSquare className="h-2.5 w-2.5" /> Responder
                    </Button>
                  </div>
                )}

                {/* Reply form */}
                {isReplying && (
                  <div className="px-3 pb-3 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      className="min-h-[60px] text-xs resize-none"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => setReplyingTo(null)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 btn-gold gap-1 flex-1"
                        disabled={!replyText.trim() || submitting}
                        onClick={() => handleSubmitReply(review.id, review.product_id)}
                      >
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {reviews.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Ver menos" : `Ver todas (${reviews.length})`}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
