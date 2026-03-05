import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  orderId: string;
  productName: string;
  sessionToken: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewForm({ orderId, productName, sessionToken, onClose, onSubmitted }: ReviewFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [productQuality, setProductQuality] = useState(0);
  const [deliverySpeed, setDeliverySpeed] = useState(0);
  const [customerService, setCustomerService] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-review", {
        body: {
          session_token: sessionToken,
          order_id: orderId,
          rating,
          comment: comment.trim() || undefined,
          product_quality: productQuality || undefined,
          delivery_speed: deliverySpeed || undefined,
          customer_service: customerService || undefined,
          would_recommend: wouldRecommend ?? undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback. Sua opinião é muito importante para nós.",
      });

      onSubmitted();
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao enviar",
        description: err instanceof Error ? err.message : "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= value
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/50 bg-card shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Avaliar Pedido</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {productName}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Rating */}
              <div className="text-center">
                <p className="text-sm font-medium mb-3">Como foi sua experiência geral?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-primary mt-2">
                    {rating === 5 && "Excelente!"}
                    {rating === 4 && "Muito bom!"}
                    {rating === 3 && "Bom"}
                    {rating === 2 && "Regular"}
                    {rating === 1 && "Ruim"}
                  </p>
                )}
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <p className="text-sm font-medium">Avaliação detalhada (opcional)</p>
                <RatingStars
                  value={productQuality}
                  onChange={setProductQuality}
                  label="Qualidade do produto"
                />
                <RatingStars
                  value={deliverySpeed}
                  onChange={setDeliverySpeed}
                  label="Prazo de entrega"
                />
                <RatingStars
                  value={customerService}
                  onChange={setCustomerService}
                  label="Atendimento"
                />
              </div>

              {/* Would Recommend */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm font-medium mb-3">Você recomendaria a Bravenza?</p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setWouldRecommend(true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === false ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => setWouldRecommend(false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Não
                  </Button>
                </div>
              </div>

              {/* Comment */}
              <div className="pt-2 border-t border-border/50">
                <label className="text-sm font-medium mb-2 block">
                  Deixe um comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte sobre sua experiência..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {comment.length}/500
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full btn-gold"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Avaliação
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
