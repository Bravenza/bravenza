import { useState, useEffect } from "react";
import { Star, Send, ThumbsUp, ShieldCheck, Truck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_cpf: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  product_quality: number | null;
  authenticity_score: number | null;
  shipping_speed: number | null;
  is_verified_purchase: boolean;
  created_at: string;
}

interface SellerReplyData {
  id: string;
  review_id: string;
  content: string;
  user_name: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: ProductReview[];
  average: number;
  total: number;
  isLoading: boolean;
  canReview?: boolean;
  sellerReplies?: Record<string, SellerReplyData>;
  onSubmit: (rating: number, comment?: string, details?: {
    product_quality?: number;
    authenticity_score?: number;
    shipping_speed?: number;
  }) => Promise<boolean>;
  onRefresh: () => void;
  currentUserName?: string;
}

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          className={cn("transition-colors", onChange && "cursor-pointer hover:scale-110")}
        >
          <Star className={cn(sz, s <= value ? "fill-primary text-primary" : "text-muted-foreground/30")} />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-28 flex-shrink-0">
        {icon}
        {label}
      </div>
      <StarRating value={value} onChange={onChange} size="sm" />
    </div>
  );
}

export function ProductReviews({
  productId,
  reviews,
  average,
  total,
  isLoading,
  canReview = false,
  sellerReplies = {},
  onSubmit,
  onRefresh,
  currentUserName,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [productQuality, setProductQuality] = useState(0);
  const [authenticityScore, setAuthenticityScore] = useState(0);
  const [shippingSpeed, setShippingSpeed] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const ok = await onSubmit(rating, comment.trim() || undefined, {
      product_quality: productQuality || undefined,
      authenticity_score: authenticityScore || undefined,
      shipping_speed: shippingSpeed || undefined,
    });
    if (ok) {
      setRating(0);
      setComment("");
      setProductQuality(0);
      setAuthenticityScore(0);
      setShippingSpeed(0);
      setShowForm(false);
      onRefresh();
    }
    setSubmitting(false);
  };

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, percent: total > 0 ? (count / total) * 100 : 0 };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Star className="h-4 w-4 text-primary fill-primary" />
          Avaliações ({total})
        </h3>
        {canReview && (
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Avaliar"}
          </Button>
        )}
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="flex gap-6 items-start">
          <div className="text-center">
            <p className="text-4xl font-bold text-foreground">{average.toFixed(1)}</p>
            <StarRating value={Math.round(average)} size="sm" />
            <p className="text-[10px] text-muted-foreground mt-1">{total} avaliação{total !== 1 ? "ões" : ""}</p>
          </div>
          <div className="flex-1 space-y-1">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{d.star}</span>
                <Star className="h-2.5 w-2.5 text-primary fill-primary" />
                <Progress value={d.percent} className="flex-1 h-1.5" />
                <span className="w-6 text-right text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <div className="p-4 bg-muted/20 rounded-xl border border-border/30 space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground mb-1.5">Sua nota geral *</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <RatingBar label="Qualidade" icon={<ThumbsUp className="h-3 w-3" />} value={productQuality} onChange={setProductQuality} />
            <RatingBar label="Autenticidade" icon={<ShieldCheck className="h-3 w-3" />} value={authenticityScore} onChange={setAuthenticityScore} />
            <RatingBar label="Entrega" icon={<Truck className="h-3 w-3" />} value={shippingSpeed} onChange={setShippingSpeed} />
          </div>
          <Textarea
            placeholder="Conte sua experiência com este produto (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <Button
            className="w-full btn-gold gap-2"
            disabled={rating === 0 || submitting}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4" />
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </div>
      )}

      <Separator />

      {/* Reviews list */}
      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Carregando avaliações...</div>
      ) : reviews.length === 0 && !showForm ? (
        <div className="py-6 text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">
            Ainda não temos avaliações para este item, mas fique tranquilo: a Bravenza já intermediou milhares de negócios com sucesso e possui inúmeras avaliações positivas em outros produtos.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Seja o primeiro a avaliar!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewItem({ review }: { review: ProductReview }) {
  const name = review.reviewer_name || "Anônimo";
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-foreground">{name}</span>
        {review.is_verified_purchase && (
          <span className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
            Compra verificada
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
      </div>
      <StarRating value={review.rating} size="sm" />
      {review.comment && (
        <p className="text-sm text-foreground/80 leading-relaxed mt-2">{review.comment}</p>
      )}
      {(review.product_quality || review.authenticity_score || review.shipping_speed) && (
        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
          {review.product_quality && (
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-2.5 w-2.5" /> Qualidade: {review.product_quality}/5
            </span>
          )}
          {review.authenticity_score && (
            <span className="flex items-center gap-0.5">
              <ShieldCheck className="h-2.5 w-2.5" /> Autenticidade: {review.authenticity_score}/5
            </span>
          )}
          {review.shipping_speed && (
            <span className="flex items-center gap-0.5">
              <Truck className="h-2.5 w-2.5" /> Entrega: {review.shipping_speed}/5
            </span>
          )}
        </div>
      )}
    </div>
  );
}
