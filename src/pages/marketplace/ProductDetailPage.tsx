import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Star, Verified, Heart, Share2,
  ChevronRight, AlertTriangle, Package, Eye, Tag, Calendar,
  Palette, Hash, DollarSign, Info, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMarketplaceCatalog, type ProductOffer } from "@/hooks/useMarketplaceCatalog";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { useClientSession } from "@/hooks/useClientSession";
import { Logo } from "@/components/Logo";
import { MarketplaceCheckoutDialog } from "@/components/client/vault/marketplace/MarketplaceCheckoutDialog";
import { ListingDetailSheet } from "@/components/client/vault/marketplace/ListingDetailSheet";
import { ProductWatchlistButton } from "@/components/marketplace/ProductWatchlistButton";
import { ProductReviews } from "@/components/marketplace/ProductReviews";
import { ProductAnalyticsChart } from "@/components/marketplace/ProductAnalyticsChart";
import { TrustBadges } from "@/components/marketplace/TrustBadges";
import { formatProductName } from "@/lib/text-utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const conditionLabels: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Excelente",
  usado_bom: "Bom",
  usado_regular: "Regular",
};

const conditionColors: Record<string, string> = {
  novo: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  usado_excelente: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  usado_bom: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  usado_regular: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const proLabels: Record<string, { text: string; color: string; icon: typeof ShieldCheck }> = {
  pro_mandatory: { text: "PRO obrigatório", color: "bg-primary/20 text-primary border-primary/30", icon: ShieldCheck },
  pro_recommended: { text: "PRO recomendado", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle },
  direct_allowed: { text: "Direto", color: "bg-muted text-muted-foreground border-border", icon: Package },
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf;
  const catalog = useMarketplaceCatalog(cpf || "visitor");
  const { product, offers, sizes, isLoading, fetchProduct, fetchOffersBySize, watchlistStatus, checkWatchlist, toggleWatchlist, reviews, reviewsLoading, reviewsAverage, reviewsTotal, fetchReviews, submitReview, comments, commentsLoading, fetchComments, submitComment, analytics, analyticsLoading, fetchAnalytics } = catalog;
  const { createOrder } = useMarketplace(cpf || null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutListing, setCheckoutListing] = useState<MarketplaceListing | null>(null);
  const [detailOffer, setDetailOffer] = useState<ProductOffer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const offerToListing = (offer: ProductOffer): MarketplaceListing => {
    // Normalize shipping_mode to expected values
    const normalizedShippingMode = offer.shipping_mode === "seller_ships" ? "direct" 
      : offer.shipping_mode === "hub" ? "bravenza" 
      : offer.shipping_mode || "direct";
    
    return {
      id: offer.listing_id || offer.id,
      seller_id: offer.seller_id,
      vault_item_id: null,
      title: product ? `${product.brand} ${product.model}` : "",
      description: offer.description,
      brand: product?.brand || null,
      model: product?.model || null,
      colorway: product?.colorway || null,
      size: offer.size,
      condition: offer.condition,
      photos: offer.photos?.length ? offer.photos : (product?.images || []),
      price: offer.price,
      original_purchase_price: offer.original_purchase_price,
      shipping_mode: normalizedShippingMode,
      shipping_cost_estimate: 0,
      is_vault_certified: false,
      status: offer.status,
      views_count: offer.views_count,
      favorites_count: 0,
      published_at: offer.created_at,
      created_at: offer.created_at,
      seller: offer.seller ? {
        id: offer.seller.id,
        average_rating: offer.seller.average_rating,
        total_sales_count: offer.seller.total_sales_count,
        current_fee_percent: offer.seller.current_fee_percent,
        bio: null,
        member: offer.seller.member,
      } : undefined,
    };
  };

  const handleBuyOffer = (offer: ProductOffer) => {
    setCheckoutListing(offerToListing(offer));
    setCheckoutOpen(true);
  };

  const handleViewOffer = (offer: ProductOffer) => {
    setDetailOffer(offer);
    setDetailOpen(true);
    // Fetch Q&A for this product when opening offer detail
    if (product) fetchComments(product.id);
  };

  const handleBuyFromDetail = (listing: MarketplaceListing) => {
    setDetailOpen(false);
    setCheckoutListing(listing);
    setCheckoutOpen(true);
  };

  const handleCheckoutConfirm = async (data: any) => {
    const result = await createOrder(data);
    if (result) {
      setCheckoutOpen(false);
      return result;
    }
    return null;
  };

  useEffect(() => {
    if (slug) fetchProduct(slug);
  }, [slug, fetchProduct]);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  useEffect(() => {
    if (product && selectedSize) {
      setLoadingOffers(true);
      fetchOffersBySize(product.id, selectedSize).finally(() => setLoadingOffers(false));
      checkWatchlist(product.id, selectedSize);
    }
  }, [product, selectedSize, fetchOffersBySize, checkWatchlist]);

  useEffect(() => {
    if (product) {
      fetchReviews(product.id);
      fetchAnalytics(product.id);
    }
  }, [product, fetchReviews, fetchAnalytics]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => a.price - b.price);
  }, [offers]);

  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Produto não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/minha-conta")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.svg"];
  const formattedName = formatProductName(product.brand, product.model);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/minha-conta?tab=marketplace")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Logo size="sm" />
          <div className="flex items-center gap-1">
            {selectedSize && cpf && cpf !== "visitor" && (
              <ProductWatchlistButton
                isWatching={watchlistStatus.active}
                maxPrice={watchlistStatus.max_price}
                lowestPrice={product.lowest_price}
                onToggle={async (mp) => {
                  await toggleWatchlist(product.id, selectedSize, mp);
                }}
              />
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <button onClick={() => navigate("/minha-conta?tab=marketplace")} className="hover:text-foreground transition-colors">
            Market+
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate">{formattedName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Info + Details */}
          <div className="space-y-6">
            {/* Brand badge + Title */}
            <div>
              <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-widest font-semibold">
                {product.brand}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {formattedName}
              </h1>
              {product.colorway && (
                <p className="text-sm text-muted-foreground mt-1">{product.colorway}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                {product.lowest_price
                  ? `R$ ${product.lowest_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "Sem ofertas"}
              </span>
              {product.lowest_price && (
                <span className="text-xs text-muted-foreground">
                  ou 6x de R$ {(product.lowest_price / 6).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                  Selecione o tamanho
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-2 py-2.5 rounded-lg border text-sm font-medium transition-all text-center",
                        selectedSize === size
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "border-border/50 text-foreground hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* ===== PRODUCT SPECS TABLE ===== */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                Ficha Técnica
              </h3>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <SpecRow icon={<Hash className="h-3.5 w-3.5" />} label="SKU" value={product.sku || "—"} />
                <SpecRow icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" value={
                  product.release_date
                    ? format(parseISO(product.release_date), "dd/MM/yyyy", { locale: ptBR })
                    : "—"
                } even />
                <SpecRow icon={<Tag className="h-3.5 w-3.5" />} label="Marca" value={product.brand} />
                <SpecRow icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Modelo" value={product.model} even />
                <SpecRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Preço de lançamento" value={
                  product.retail_price
                    ? `R$ ${product.retail_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "—"
                } />
                <SpecRow icon={<Palette className="h-3.5 w-3.5" />} label="Cor" value={product.colorway || "—"} even />
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" />
                  Descrição
                </h3>
                <div className="p-4 bg-muted/20 rounded-xl border border-border/30">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>
            )}

            {product.is_high_risk && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs">
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Autenticação recomendada.</span> Este modelo possui alto índice de réplicas no mercado.
                  {product.lowest_price && product.lowest_price >= 2000
                    ? " Para sua segurança, a verificação PRO via Bravenza é obrigatória nesta faixa de preço."
                    : " Recomendamos o envio Via Bravenza para certificação de autenticidade antes da entrega."}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Gallery */}
          <div className="space-y-3 order-first lg:order-last">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/30">
              <img
                src={images[selectedImage]}
                alt={formattedName}
                className="w-full h-full object-contain p-4"
              />
              {product.is_high_risk && (
                <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] gap-1">
                  <ShieldCheck className="h-3 w-3" /> Autenticação recomendada
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted/10",
                      selectedImage === i ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== SELLER OFFERS SECTION ===== */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Ofertas de Vendedores {selectedSize ? `— Tam. ${selectedSize}` : ""}
            </h2>
            <span className="text-xs text-muted-foreground">
              {sortedOffers.length} oferta{sortedOffers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadingOffers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="p-8 bg-muted/20 rounded-xl text-center border border-border/30">
              <p className="text-sm text-muted-foreground">
                {product.total_offers === 0
                  ? "Nenhuma oferta disponível para este produto. Seja o primeiro a vender!"
                  : `Nenhuma oferta para o tamanho ${selectedSize}.`}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSize}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {sortedOffers.map((offer, index) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isBest={index === 0}
                    productImages={images}
                    onBuy={() => handleBuyOffer(offer)}
                    onClick={() => handleViewOffer(offer)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ===== ANALYTICS / PRICE HISTORY ===== */}
        <div className="mt-10 max-w-3xl">
          <ProductAnalyticsChart
            analytics={analytics}
            isLoading={analyticsLoading}
            productName={formattedName}
          />
        </div>

        {/* ===== TRUST BADGES ===== */}
        <div className="mt-10 max-w-3xl">
          <TrustBadges />
        </div>

        {/* ===== REVIEWS ===== */}
        <div className="mt-10 max-w-3xl">
          <ProductReviews
            productId={product.id}
            reviews={reviews}
            average={reviewsAverage}
            total={reviewsTotal}
            isLoading={reviewsLoading}
            onSubmit={async (rating, comment, details) => {
              return submitReview(product.id, rating, comment, details);
            }}
            onRefresh={() => fetchReviews(product.id)}
            currentUserName={profile?.full_name}
          />
        </div>
      </main>

      {/* Offer Detail Sheet */}
      <ListingDetailSheet
        listing={detailOffer ? offerToListing(detailOffer) : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFavorite={() => {}}
        onBuy={handleBuyFromDetail}
        comments={comments}
        commentsLoading={commentsLoading}
        onSubmitComment={async (content, parentId) => {
          if (!product) return false;
          const ok = await submitComment(product.id, content, parentId);
          if (ok) fetchComments(product.id);
          return ok;
        }}
        onRefreshComments={() => product && fetchComments(product.id)}
        currentUserName={profile?.full_name}
      />

      <MarketplaceCheckoutDialog
        listing={checkoutListing}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onConfirm={handleCheckoutConfirm}
        buyerDefaults={{ name: profile?.full_name }}
      />
    </div>
  );
}

// ---- Spec Row ----
function SpecRow({ icon, label, value, even }: { icon: React.ReactNode; label: string; value: string; even?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2.5 text-sm",
      even ? "bg-muted/10" : "bg-transparent"
    )}>
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

// ---- Offer Card ----
function OfferCard({ offer, isBest, productImages, onBuy, onClick }: { offer: ProductOffer; isBest: boolean; productImages: string[]; onBuy: () => void; onClick: () => void }) {
  // Derive pro recommendation from shipping_mode if not explicitly set
  const normalizedMode = offer.shipping_mode === "seller_ships" ? "direct" 
    : offer.shipping_mode === "hub" ? "bravenza" 
    : offer.shipping_mode || "direct";
  const proKey = offer.pro_recommendation 
    || (normalizedMode === "bravenza" ? (offer.price >= 2000 ? "pro_mandatory" : "pro_recommended") : "direct_allowed");
  const pro = proLabels[proKey] || proLabels.direct_allowed;
  const ProIcon = pro.icon;
  const sellerName = offer.seller?.member?.client_name?.split(" ")[0] || "Vendedor";
  const offerImage = offer.photos?.length ? offer.photos[0] : productImages[0];

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border overflow-hidden transition-all hover:shadow-md cursor-pointer",
        isBest ? "border-primary/40 ring-1 ring-primary/20" : "border-border/40"
      )}
    >
      {/* Offer photo */}
      <div className="relative aspect-[4/3] bg-muted/10">
        <img src={offerImage} alt="" className="w-full h-full object-contain p-2" />
        {isBest && (
          <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
            Melhor preço
          </Badge>
        )}
        <Badge variant="outline" className={cn("absolute top-2 right-2 text-[10px] px-1.5 py-0 gap-0.5", conditionColors[offer.condition])}>
          {conditionLabels[offer.condition] || offer.condition}
        </Badge>
      </div>

      <div className="p-3 space-y-2">
        {/* Seller */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{sellerName}</span>
          {offer.seller?.total_sales_count && offer.seller.total_sales_count > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Verified className="h-2.5 w-2.5 text-primary" />
              {offer.seller.total_sales_count} vendas
            </span>
          ) : null}
          {offer.seller?.average_rating && offer.seller.average_rating > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Star className="h-2.5 w-2.5 text-primary fill-primary" />
              {offer.seller.average_rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-0.5", pro.color)}>
            <ProIcon className="h-2.5 w-2.5" />
            {pro.text}
          </Badge>
          {offer.has_receipt && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              NF
            </Badge>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-lg font-bold text-foreground">
              R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              6x R$ {(offer.price / 6).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Button size="sm" className="btn-gold text-xs h-8 gap-1" onClick={(e) => { e.stopPropagation(); onBuy(); }}>
            Comprar <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
