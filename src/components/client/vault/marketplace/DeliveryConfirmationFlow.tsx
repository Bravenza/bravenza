import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  CheckCircle2,
  Camera,
  MessageCircle,
  HelpCircle,
  Package,
  Ruler,
  Eye,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  X,
  Upload,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DeliveryConfirmationFlowProps {
  orderId: string;
  orderCode: string;
  productName: string;
  productImage?: string;
  sellerName: string;
  onConfirmDelivery: () => Promise<boolean>;
  onSubmitReview: (data: {
    productRating: number;
    productComment: string;
    productPhoto: File | null;
    sellerRating: number;
    sellerComment: string;
  }) => Promise<boolean>;
  onClose: () => void;
  onContactSupport: () => void;
}

type FlowStep = "confirm" | "product-review" | "seller-review" | "success";

const STEP_PROGRESS: Record<FlowStep, number> = {
  confirm: 0,
  "product-review": 1,
  "seller-review": 2,
  success: 3,
};

export function DeliveryConfirmationFlow({
  orderId,
  orderCode,
  productName,
  productImage,
  sellerName,
  onConfirmDelivery,
  onSubmitReview,
  onClose,
  onContactSupport,
}: DeliveryConfirmationFlowProps) {
  const [step, setStep] = useState<FlowStep>("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation checklist
  const [checks, setChecks] = useState({
    arrived: false,
    asDescribed: false,
    sizeCorrect: false,
  });

  // Product review
  const [productRating, setProductRating] = useState(0);
  const [productHover, setProductHover] = useState(0);
  const [productComment, setProductComment] = useState("");
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seller review
  const [sellerRating, setSellerRating] = useState(0);
  const [sellerHover, setSellerHover] = useState(0);
  const [sellerComment, setSellerComment] = useState("");

  const allChecked = checks.arrived && checks.asDescribed && checks.sizeCorrect;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsSubmitting(true);
    const success = await onConfirmDelivery();
    setIsSubmitting(false);
    if (success) setStep("product-review");
  };

  const handleSubmitAll = async () => {
    if (productRating === 0) return;
    setIsSubmitting(true);
    const success = await onSubmitReview({
      productRating,
      productComment: productComment.trim(),
      productPhoto,
      sellerRating: sellerRating || productRating,
      sellerComment: sellerComment.trim(),
    });
    setIsSubmitting(false);
    if (success) setStep("success");
  };

  const ratingLabel = (r: number) => {
    if (r === 5) return "Excelente!";
    if (r === 4) return "Muito bom!";
    if (r === 3) return "Bom";
    if (r === 2) return "Regular";
    if (r === 1) return "Ruim";
    return "";
  };

  const RatingStars = ({
    value,
    hover,
    onChange,
    onHover,
    size = "lg",
  }: {
    value: number;
    hover: number;
    onChange: (v: number) => void;
    onHover: (v: number) => void;
    size?: "lg" | "md";
  }) => (
    <div className="flex justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "transition-all duration-200",
              size === "lg" ? "h-9 w-9" : "h-7 w-7",
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                : "text-muted-foreground/20"
            )}
          />
        </button>
      ))}
    </div>
  );

  const CheckItem = ({
    checked,
    onChange,
    icon: Icon,
    title,
    description,
  }: {
    checked: boolean;
    onChange: () => void;
    icon: any;
    title: string;
    description: string;
  }) => (
    <button
      onClick={onChange}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left",
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-card hover:border-border"
      )}
    >
      <div
        className={cn(
          "mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
          checked
            ? "border-primary bg-primary"
            : "border-muted-foreground/30"
        )}
      >
        {checked && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4 shrink-0", checked ? "text-primary" : "text-muted-foreground")} />
          <p className={cn("font-medium text-sm", checked ? "text-foreground" : "text-muted-foreground")}>{title}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </button>
  );

  // Progress bar
  const progressWidth = `${(STEP_PROGRESS[step] / 3) * 100}%`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && step !== "success" && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          {step !== "success" && (
            <div className="h-1 bg-muted/50">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: progressWidth }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Close Button */}
          {step !== "success" && (
            <div className="flex justify-end p-3 pb-0">
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {/* ====== STEP: CONFIRM DELIVERY ====== */}
              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 pt-2"
                >
                  {/* Product preview */}
                  <div className="text-center">
                    {productImage && (
                      <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-border/30 mb-3">
                        <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h2 className="text-lg font-bold tracking-tight">Tudo certo com seu pedido?</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Antes de confirmar, verifique os itens abaixo
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    <CheckItem
                      checked={checks.arrived}
                      onChange={() => setChecks((p) => ({ ...p, arrived: !p.arrived }))}
                      icon={Package}
                      title="O produto chegou"
                      description="A embalagem está intacta e o produto está dentro"
                    />
                    <CheckItem
                      checked={checks.asDescribed}
                      onChange={() => setChecks((p) => ({ ...p, asDescribed: !p.asDescribed }))}
                      icon={Eye}
                      title="Está como descrito"
                      description="Corresponde às fotos, cor, modelo e condição do anúncio"
                    />
                    <CheckItem
                      checked={checks.sizeCorrect}
                      onChange={() => setChecks((p) => ({ ...p, sizeCorrect: !p.sizeCorrect }))}
                      icon={Ruler}
                      title="O tamanho está correto"
                      description="Experimente com cuidado, sem danificar o produto"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <Button
                      onClick={handleConfirmDelivery}
                      disabled={!allChecked || isSubmitting}
                      className="w-full h-12 rounded-2xl text-sm font-semibold btn-gold"
                    >
                      {isSubmitting ? "Confirmando..." : (
                        <>
                          Tudo certo, confirmar recebimento
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-10 rounded-xl text-xs"
                        onClick={onContactSupport}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        Falar com suporte
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 h-10 rounded-xl text-xs text-muted-foreground"
                        onClick={() => {
                          // Open FAQ/help
                          window.open("https://wa.me/5511999999999?text=Preciso%20de%20ajuda%20com%20meu%20pedido%20" + orderCode, "_blank");
                        }}
                      >
                        <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                        Preciso de ajuda
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ====== STEP: PRODUCT REVIEW ====== */}
              {step === "product-review" && (
                <motion.div
                  key="product-review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 pt-2"
                >
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs mb-3">Passo 1 de 2</Badge>
                    <h2 className="text-lg font-bold tracking-tight">Avaliação do produto</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quantas estrelas esse produto merece?
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="text-center py-2">
                    <RatingStars
                      value={productRating}
                      hover={productHover}
                      onChange={setProductRating}
                      onHover={setProductHover}
                    />
                    {productRating > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-primary font-medium mt-2"
                      >
                        {ratingLabel(productRating)}
                      </motion.p>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Foto do produto <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Escolha uma imagem bem iluminada e com alta definição para ajudar outros compradores
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {photoPreview ? (
                      <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-border/30">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setProductPhoto(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-28 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/30 flex flex-col items-center justify-center gap-2 transition-colors"
                      >
                        <div className="p-2.5 rounded-xl bg-muted/50">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">Toque para adicionar foto</span>
                      </button>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-sm font-medium mb-1.5">
                      O que você achou? <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Escreva sobre materiais, design, conforto, etc.
                    </p>
                    <Textarea
                      value={productComment}
                      onChange={(e) => setProductComment(e.target.value.slice(0, 200))}
                      placeholder="Excelente qualidade, material premium..."
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">{productComment.length}/200</p>
                  </div>

                  {/* Next */}
                  <Button
                    onClick={() => setStep("seller-review")}
                    disabled={productRating === 0}
                    className="w-full h-12 rounded-2xl text-sm font-semibold btn-gold"
                  >
                    Próximo: avaliar vendedor
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* ====== STEP: SELLER REVIEW ====== */}
              {step === "seller-review" && (
                <motion.div
                  key="seller-review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 pt-2"
                >
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs mb-3">Passo 2 de 2</Badge>
                    <h2 className="text-lg font-bold tracking-tight">Avalie o vendedor</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{sellerName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quanto mais estrelas, maior sua satisfação com o atendimento
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="text-center py-2">
                    <RatingStars
                      value={sellerRating}
                      hover={sellerHover}
                      onChange={setSellerRating}
                      onHover={setSellerHover}
                    />
                    {sellerRating > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-primary font-medium mt-2"
                      >
                        {ratingLabel(sellerRating)}
                      </motion.p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-sm font-medium mb-1.5">
                      O que achou do vendedor? <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Atendimento, velocidade de entrega, comunicação, etc.
                    </p>
                    <Textarea
                      value={sellerComment}
                      onChange={(e) => setSellerComment(e.target.value.slice(0, 200))}
                      placeholder="Vendedor atencioso, envio rápido..."
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">{sellerComment.length}/200</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      onClick={handleSubmitAll}
                      disabled={isSubmitting || sellerRating === 0}
                      className="w-full h-12 rounded-2xl text-sm font-semibold btn-gold"
                    >
                      {isSubmitting ? "Enviando avaliação..." : "Enviar avaliação"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => setStep("product-review")}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      Voltar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ====== STEP: SUCCESS ====== */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="text-center py-8 space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, damping: 12 }}
                    className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </motion.div>

                  <div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl font-bold tracking-tight"
                    >
                      Avaliação enviada com sucesso!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-muted-foreground mt-2"
                    >
                      Obrigado por compartilhar sua experiência. Sua opinião ajuda toda a comunidade BRAVENZA.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-5 w-5",
                          s <= productRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/20"
                        )}
                      />
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={onClose}
                      className="w-full h-12 rounded-2xl text-sm font-semibold btn-gold"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Continuar comprando
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
