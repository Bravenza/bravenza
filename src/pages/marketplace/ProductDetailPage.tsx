import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, Share2,
  ChevronRight, Package, Tag, Calendar,
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
import { SpecRow } from "@/components/marketplace/SpecRow";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductPriceBlock } from "@/components/marketplace/ProductPriceBlock";
import { conditionLabels, conditionColors, normalizeShippingMode } from "@/lib/marketplace-constants";
import { generateInstallmentOptions, formatPriceBR } from "@/lib/budget-calculator";
import { formatProductName } from "@/lib/text-utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Pro labels kept locally since they reference icon components
const proLabels: Record<string, { text: string; color: string; icon: typeof ShieldCheck }> = {
  pro_mandatory: { text: "PRO obrigatório", color: "bg-primary/20 text-primary border-primary/30", icon: ShieldCheck },
  pro_recommended: { text: "PRO recomendado", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: ShieldCheck },
  direct_allowed: { text: "Direto", color: "bg-muted text-muted-foreground border-border", icon: Package },
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf;
  const catalog = useMarketplaceCatalog(cpf || "visitor");
  const { product, offers, allOffers, sizes, isLoading, fetchProduct, fetchOffersBySize, watchlistStatus, checkWatchlist, toggleWatchlist, reviews, reviewsLoading, reviewsAverage, reviewsTotal, fetchReviews, submitReview, comments, commentsLoading, fetchComments, submitComment, analytics, analyticsLoading, fetchAnalytics } = catalog;
  const { createOrder } = useMarketplace(cpf || null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<"all" | "novo" | "usado">("all");
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

  // Initial size selection is handled by filteredSizes useEffect below

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

  // Determine which conditions exist across ALL offers (not just current size)
  const hasNewOffers = useMemo(() => allOffers.some((o) => o.condition === "novo"), [allOffers]);
  const hasUsedOffers = useMemo(() => allOffers.some((o) => o.condition !== "novo"), [allOffers]);

  // Auto-set conditionFilter if only one type exists
  useEffect(() => {
    if (hasNewOffers && !hasUsedOffers) setConditionFilter("novo");
    else if (hasUsedOffers && !hasNewOffers) setConditionFilter("usado");
    else if (hasNewOffers && hasUsedOffers) setConditionFilter("all");
  }, [hasNewOffers, hasUsedOffers]);

  // Filter sizes based on condition filter using ALL offers
  const filteredSizes = useMemo(() => {
    if (conditionFilter === "all") return sizes;
    return sizes.filter((size) =>
      allOffers.some((o) => {
        const matchSize = o.size === size;
        const matchCondition = conditionFilter === "novo" ? o.condition === "novo" : o.condition !== "novo";
        return matchSize && matchCondition;
      })
    );
  }, [sizes, allOffers, conditionFilter]);

  // Reset selectedSize if it's no longer in filteredSizes
  useEffect(() => {
    if (filteredSizes.length > 0 && selectedSize && !filteredSizes.includes(selectedSize)) {
      setSelectedSize(filteredSizes[0]);
    } else if (filteredSizes.length > 0 && !selectedSize) {
      setSelectedSize(filteredSizes[0]);
    }
  }, [filteredSizes, selectedSize]);

  const sortedOffers = useMemo(() => {
    const filtered = offers.filter((o) => {
      if (conditionFilter === "novo") return o.condition === "novo";
      if (conditionFilter === "usado") return o.condition !== "novo";
      return true;
    });
    return [...filtered].sort((a, b) => a.price - b.price);
  }, [offers, conditionFilter]);

  // Check if user has purchased this product (for review permission)
  const [canReview, setCanReview] = useState(false);
  useEffect(() => {
    if (!cpf || cpf === "visitor" || !product) {
      setCanReview(false);
      return;
    }
    // Check via backend if user bought this product
    const checkPurchase = async () => {
      try {
        const params = new URLSearchParams({ action: "check-purchase", product_id: product.id });
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub?${params}`, {
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "x-client-cpf": cpf,
          },
        });
        const data = await res.json();
        setCanReview(!!data.has_purchased);
      } catch {
        setCanReview(false);
      }
    };
    checkPurchase();
  }, [cpf, product]);

  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-background theme-light">
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
      <div className="min-h-screen bg-background flex items-center justify-center theme-light">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Produto não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.svg"];
  const formattedName = formatProductName(product.brand, product.model);

  return (
    <div className="min-h-screen bg-background theme-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Marketplace
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: formattedName, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <button onClick={() => navigate("/marketplace")} className="hover:text-foreground transition-colors">
            Marketplace
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
            {(() => {
              const lowestForSize = sortedOffers.length > 0 ? sortedOffers[0].price : null;
              const displayPrice = lowestForSize ?? product.lowest_price;
              const multipleOffers = sortedOffers.length > 1;
              const hasSize = !!selectedSize;
              const showPrefix = !hasSize || multipleOffers;
              return (
                <ProductPriceBlock
                  displayPrice={displayPrice}
                  showPrefix={showPrefix}
                />
              );
            })()}

            {/* Condition Filter - only show if both types exist */}
            {hasNewOffers && hasUsedOffers && (
              <div className="flex gap-2">
                {([
                  { value: "all" as const, label: "Todos" },
                  { value: "novo" as const, label: "Novos" },
                  { value: "usado" as const, label: "Usados" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setConditionFilter(opt.value)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
                      conditionFilter === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            {/* Show single label if only one type */}
            {hasNewOffers && !hasUsedOffers && (
              <Badge variant="secondary" className="text-xs w-fit">Somente Novos</Badge>
            )}
            {hasUsedOffers && !hasNewOffers && (
              <Badge variant="secondary" className="text-xs w-fit">Somente Usados</Badge>
            )}

            {/* Size Selector */}
            {filteredSizes.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                  Selecione o tamanho
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {filteredSizes.map((size) => (
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
            {filteredSizes.length === 0 && sizes.length > 0 && (
              <p className="text-xs text-muted-foreground">Nenhum tamanho disponível para este filtro.</p>
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
                <SpecRow
                  icon={<Tag className="h-3.5 w-3.5" />}
                  label="Marca"
                  value={product.brand}
                  onClick={() => navigate(`/marketplace?q=${encodeURIComponent(product.brand)}`)}
                />
                <SpecRow
                  icon={<ShoppingBag className="h-3.5 w-3.5" />}
                  label="Modelo"
                  value={product.model}
                  even
                  onClick={() => navigate(`/marketplace?q=${encodeURIComponent(product.model)}`)}
                />
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
          <ProductGallery
            images={images}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
            productName={formattedName}
            isHighRisk={product.is_high_risk}
          />
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

        {/* ===== PRICE INSIGHTS ===== */}
        <div className="mt-10 max-w-3xl">
          <ProductAnalyticsChart
            analytics={analytics}
            isLoading={analyticsLoading}
            productName={formattedName}
          />
        </div>

        {/* ===== REVIEWS ===== */}
        <div className="mt-10 max-w-3xl">
          <ProductReviews
            productId={product.id}
            reviews={reviews}
            average={reviewsAverage}
            total={reviewsTotal}
            isLoading={reviewsLoading}
            canReview={canReview}
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
