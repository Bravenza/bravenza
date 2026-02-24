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
  productSize?: string;
  productCondition?: string;
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
  productSize,
  productCondition,
  onConfirmDelivery,
  onSubmitReview,
  onClose,
  onContactSupport,
}: DeliveryConfirmationFlowProps) {
  const [step, setStep] = useState<FlowStep>("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [checks, setChecks] = useState({
    arrived: false,
    asDescribed: false,
    sizeCorrect: false,
  });

  const [productRating, setProductRating] = useState(0);
  const [productHover, setProductHover] = useState(0);
  const [productComment, setProductComment] = useState("");
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className="p-1 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "transition-all duration-200",
              size === "lg" ? "h-10 w-10" : "h-8 w-8",
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                : "text-muted-foreground/25"
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
        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left",
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border/40 bg-card hover:border-border"
      )}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
          checked
            ? "border-primary bg-primary"
            : "border-muted-foreground/25"
        )}
      >
        {checked && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className={cn("h-4 w-4 shrink-0", checked ? "text-primary" : "text-muted-foreground/60")} />
          <p className={cn("font-semibold text-sm leading-tight", checked ? "text-foreground" : "text-foreground/80")}>{title}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pl-6">{description}</p>
      </div>
    </button>
  );

  /* Product Info Card — shown at top of confirm + review steps */
  const ProductInfoCard = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/30 p-3",
      compact && "p-2.5"
    )}>
      {productImage && (
        <div className={cn(
          "rounded-xl overflow-hidden border border-border/30 shrink-0 bg-white",
          compact ? "w-14 h-14" : "w-16 h-16"
        )}>
          <img src={productImage} alt={productName} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-foreground leading-tight truncate",
          compact ? "text-xs" : "text-sm"
        )}>
          {productName}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {productSize && (
            <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-medium">
              Tam. {productSize}
            </span>
          )}
          {productCondition && (
            <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-medium">
              {productCondition}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Pedido #{orderCode}
        </p>
      </div>
    </div>
  );

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
          className="w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Progress Bar */}
          {step !== "success" && (
            <div className="h-1 bg-muted/30">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60"
                initial={{ width: 0 }}
                animate={{ width: progressWidth }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Header with close */}
          {step !== "success" && (
            <div className="flex justify-end px-5 pt-4">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className={cn("px-6 pb-7", step === "success" ? "pt-2" : "pt-1")}>
            <AnimatePresence mode="wait">
              {/* ====== STEP: CONFIRM DELIVERY ====== */}
              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Title */}
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold tracking-tight">Tudo certo com seu pedido?</h2>
                    <p className="text-sm text-muted-foreground">
                      Antes de confirmar, verifique os itens abaixo
                    </p>
                  </div>

                  {/* Product Card */}
                  <ProductInfoCard />

                  {/* Checklist */}
                  <div className="space-y-2.5">
                    <CheckItem
                      checked={checks.arrived}
                      onChange={() => setChecks((p) => ({ ...p, arrived: !p.arrived }))}
                      icon={Package}
                      title="O produto chegou"
                      description="Recebi o sneaker, a embalagem está intacta e todos os itens estão dentro (caixa, acessórios, etc.)"
                    />
                    <CheckItem
                      checked={checks.asDescribed}
                      onChange={() => setChecks((p) => ({ ...p, asDescribed: !p.asDescribed }))}
                      icon={Eye}
                      title="Está como descrito"
                      description="O sneaker corresponde às fotos do anúncio, incluindo cor, modelo, condição e materiais informados"
                    />
                    <CheckItem
                      checked={checks.sizeCorrect}
                      onChange={() => setChecks((p) => ({ ...p, sizeCorrect: !p.sizeCorrect }))}
                      icon={Ruler}
                      title="O tamanho está correto"
                      description="Experimente em superfície limpa, sem dobrar o calcanhar e sem remover etiquetas. Evite uso externo antes de confirmar"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
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
                        className="flex-1 h-11 rounded-xl text-xs"
                        onClick={onContactSupport}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        Falar com suporte
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 h-11 rounded-xl text-xs text-muted-foreground"
                        onClick={() => {
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
                  className="space-y-5"
                >
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <Badge variant="outline" className="text-[11px] font-medium px-3 py-1">Passo 1 de 2</Badge>
                    <h2 className="text-lg font-bold tracking-tight">Avaliação do sneaker</h2>
                    <p className="text-sm text-muted-foreground">
                      Quantas estrelas esse sneaker merece?
                    </p>
                  </div>

                  {/* Product Card */}
                  <ProductInfoCard compact />

                  {/* Stars */}
                  <div className="text-center py-1">
                    <RatingStars
                      value={productRating}
                      hover={productHover}
                      onChange={setProductRating}
                      onHover={setProductHover}
                    />
                    <div className="h-6 mt-1.5">
                      {productRating > 0 && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-primary font-semibold"
                        >
                          {ratingLabel(productRating)}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Foto do produto <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Escolha uma imagem bem iluminada para ajudar outros compradores
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {photoPreview ? (
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-border/30">
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
                        className="w-full h-24 rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/30 flex flex-col items-center justify-center gap-2 transition-colors"
                      >
                        <div className="p-2.5 rounded-xl bg-muted/40">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">Toque para adicionar foto</span>
                      </button>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">
                        O que você achou? <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Escreva sobre materiais, design, conforto, etc.
                      </p>
                    </div>
                    <Textarea
                      value={productComment}
                      onChange={(e) => setProductComment(e.target.value.slice(0, 200))}
                      placeholder="Excelente qualidade, material premium..."
                      rows={3}
                      className="rounded-xl resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">{productComment.length}/200</p>
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
                  className="space-y-5"
                >
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <Badge variant="outline" className="text-[11px] font-medium px-3 py-1">Passo 2 de 2</Badge>
                    <h2 className="text-lg font-bold tracking-tight">Avalie o vendedor</h2>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{sellerName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quanto mais estrelas, maior sua satisfação com o atendimento
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="text-center py-1">
                    <RatingStars
                      value={sellerRating}
                      hover={sellerHover}
                      onChange={setSellerRating}
                      onHover={setSellerHover}
                    />
                    <div className="h-6 mt-1.5">
                      {sellerRating > 0 && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-primary font-semibold"
                        >
                          {ratingLabel(sellerRating)}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">
                        O que achou do vendedor? <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Atendimento, velocidade de entrega, comunicação, etc.
                      </p>
                    </div>
                    <Textarea
                      value={sellerComment}
                      onChange={(e) => setSellerComment(e.target.value.slice(0, 200))}
                      placeholder="Vendedor atencioso, envio rápido..."
                      rows={3}
                      className="rounded-xl resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">{sellerComment.length}/200</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5 pt-1">
                    <Button
                      onClick={handleSubmitAll}
                      disabled={isSubmitting || sellerRating === 0}
                      className="w-full h-12 rounded-2xl text-sm font-semibold btn-gold"
                    >
                      {isSubmitting ? "Enviando avaliação..." : "Enviar avaliação"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full h-10 text-xs text-muted-foreground"
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
                  className="text-center py-10 space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, damping: 12 }}
                    className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </motion.div>

                  <div className="space-y-2">
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
                      className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto"
                    >
                      Obrigado por compartilhar sua experiência. Sua opinião ajuda toda a comunidade BRAVENZA.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-1.5"
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-6 w-6",
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
                    className="pt-2"
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
