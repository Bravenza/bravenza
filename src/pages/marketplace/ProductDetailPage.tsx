import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Helmet } from "react-helmet-async";
import { saveRecentlyViewed } from "@/components/marketplace/home/RecentlyViewedSection";
import { useParams, useNavigate } from "react-router-dom";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import {
  ArrowLeft, ShieldCheck, Share2,
  ChevronRight, Package, Tag, Calendar,
  Palette, Hash, DollarSign, Info, ShoppingBag, Megaphone, BadgeCheck
} from "lucide-react";
import { SocialProofViewers } from "@/components/marketplace/SocialProofViewers";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMarketplaceCatalog, type ProductOffer } from "@/hooks/useMarketplaceCatalog";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { CartProvider, useMarketplaceCart } from "@/hooks/useMarketplaceCart";
import { CartDrawer } from "@/components/client/vault/marketplace/CartDrawer";
import type { CartGroup } from "@/hooks/useMarketplaceCart";
import { useClientSession } from "@/hooks/useClientSession";
// Checkout is now a full page
import { ListingDetailSheet } from "@/components/client/vault/marketplace/ListingDetailSheet";
import { ProductWatchlistButton } from "@/components/marketplace/ProductWatchlistButton";
import { TrustBadges } from "@/components/marketplace/TrustBadges";
import { SpecRow } from "@/components/marketplace/SpecRow";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductPriceBlock } from "@/components/marketplace/ProductPriceBlock";
import { AuthenticityBadge } from "@/components/marketplace/AuthenticityBadge";
import { StickyBuyBar } from "@/components/marketplace/StickyBuyBar";
import { conditionLabels, conditionColors, normalizeShippingMode } from "@/lib/marketplace-constants";
import { generateInstallmentOptions, formatPriceBR } from "@/lib/budget-calculator";
import { formatProductName } from "@/lib/text-utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));
const ProductAnalyticsChart = lazy(() => import("@/components/marketplace/ProductAnalyticsChart").then(m => ({ default: m.ProductAnalyticsChart })));
const ProductReviews = lazy(() => import("@/components/marketplace/ProductReviews").then(m => ({ default: m.ProductReviews })));
const PriceHistoryChart = lazy(() => import("@/components/marketplace/PriceHistoryChart").then(m => ({ default: m.PriceHistoryChart })));
import { SizePriceGrid } from "@/components/marketplace/SizePriceGrid";
import { PriceComparator } from "@/components/marketplace/PriceComparator";
import { RetailComparison } from "@/components/marketplace/RetailComparison";
import { FloatingCouponBadge } from "@/components/marketplace/FloatingCouponBadge";
import { NotifyMeSection } from "@/components/marketplace/NotifyMeSection";
import { SizeGuideDialog } from "@/components/marketplace/SizeGuideDialog";
const SmartRecommendations = lazy(() => import("@/components/marketplace/SmartRecommendations").then(m => ({ default: m.SmartRecommendations })));
const ProtectedPurchaseSection = lazy(() => import("@/components/marketplace/ProtectedPurchaseSection").then(m => ({ default: m.ProtectedPurchaseSection })));
const RelatedProductsSection = lazy(() => import("@/components/marketplace/RelatedProductsSection").then(m => ({ default: m.RelatedProductsSection })));
const RecentlyViewedSection = lazy(() => import("@/components/marketplace/home/RecentlyViewedSection").then(m => ({ default: m.RecentlyViewedSection })));

const proLabels: Record<string, { text: string; color: string; icon: typeof ShieldCheck }> = {
  pro_mandatory: { text: "PRO obrigatório", color: "bg-primary/20 text-primary border-primary/30", icon: ShieldCheck },
  pro_recommended: { text: "PRO recomendado", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: ShieldCheck },
  direct_allowed: { text: "Direto", color: "bg-muted text-muted-foreground border-border", icon: Package },
};
// Wrapper for OfferCard with cart integration
function OfferCardWithCart(props: React.ComponentProps<typeof OfferCard>) {
  try {
    const { addToCart, isInCart } = useMarketplaceCart();
    const inCart = isInCart(props.offer.id);
    return (
      <OfferCard
        {...props}
        isInCart={inCart}
        onAddToCart={() => addToCart(props.offer.id, props.offer.product_id)}
      />
    );
  } catch {
    // If no CartProvider, render without cart
    return <OfferCard {...props} />;
  }
}

function ProductDetailPageInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf;
  const catalog = useMarketplaceCatalog(cpf || "visitor");
  const { product, offers, allOffers, sizes, isLoading, fetchProduct, fetchOffersBySize, watchlistStatus, checkWatchlist, toggleWatchlist, reviews, reviewsLoading, reviewsAverage, reviewsTotal, fetchReviews, submitReview, comments, commentsLoading, fetchComments, submitComment, analytics, analyticsLoading, fetchAnalytics } = catalog;
  const { createOrder } = useMarketplace(cpf || null);
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLDivElement>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<"all" | "novo" | "usado">("all");
  // checkout is now page-based
  const [detailOffer, setDetailOffer] = useState<ProductOffer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Intersection observer for sticky buy bar
  useEffect(() => {
    if (!isMobile || !heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  const offerToListing = (offer: ProductOffer): MarketplaceListing => {
    const normalizedShippingMode = offer.shipping_mode === "seller_ships" ? "direct" 
      : offer.shipping_mode === "hub" ? "bravenza" 
      : offer.shipping_mode || "direct";
    return {
      id: offer.listing_id || offer.id,
      seller_id: offer.seller_id,
      vault_item_id: null,
      product_id: offer.product_id || null,
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
    const listing = offerToListing(offer);
    const group: CartGroup = {
      sellerId: listing.seller_id,
      sellerName: listing.seller?.member?.client_name || "Vendedor",
      items: [{
        id: listing.id,
        offer_id: listing.id,
        product_id: product?.id || "",
        added_at: new Date().toISOString(),
        offer: {
          id: listing.id,
          price: listing.price,
          size: listing.size || "",
          condition: listing.condition,
          photos: listing.photos,
          shipping_mode: listing.shipping_mode,
          seller_id: listing.seller_id,
          status: listing.status,
          product: product ? { brand: product.brand, model: product.model, slug: product.slug, images: product.images } : undefined,
          seller: listing.seller ? { id: listing.seller.id, member: listing.seller.member ? { client_name: listing.seller.member.client_name } : undefined } : undefined,
        },
      }],
      subtotal: listing.price,
    };
    navigate("/marketplace/checkout", { state: { group } });
  };

  const handleViewOffer = (offer: ProductOffer) => {
    setDetailOffer(offer);
    setDetailOpen(true);
    if (product) fetchComments(product.id);
  };

  const handleBuyFromDetail = (listing: MarketplaceListing) => {
    const group: CartGroup = {
      sellerId: listing.seller_id,
      sellerName: listing.seller?.member?.client_name || "Vendedor",
      items: [{
        id: listing.id,
        offer_id: listing.id,
        product_id: "",
        added_at: new Date().toISOString(),
        offer: {
          id: listing.id,
          price: listing.price,
          size: listing.size || "",
          condition: listing.condition,
          photos: listing.photos,
          shipping_mode: listing.shipping_mode,
          seller_id: listing.seller_id,
          status: listing.status,
          product: listing.brand ? { brand: listing.brand, model: listing.model || "", slug: null, images: listing.photos } : undefined,
          seller: listing.seller ? { id: listing.seller.id, member: listing.seller.member ? { client_name: listing.seller.member.client_name } : undefined } : undefined,
        },
      }],
      subtotal: listing.price,
    };
    navigate("/marketplace/checkout", { state: { group } });
  };

  useEffect(() => {
    if (slug) fetchProduct(slug).then((data) => {
      if (data?.product) saveRecentlyViewed(data.product);
    });
  }, [slug, fetchProduct]);

  useEffect(() => {
    if (product && selectedSize) {
      setLoadingOffers(true);
      fetchOffersBySize(product.id, selectedSize).finally(() => setLoadingOffers(false));
      if (cpf && cpf !== "visitor") {
        checkWatchlist(product.id, selectedSize);
      }
    }
  }, [product, selectedSize, fetchOffersBySize, checkWatchlist, cpf]);

  useEffect(() => {
    if (product) {
      fetchReviews(product.id);
      fetchAnalytics(product.id);
    }
  }, [product, fetchReviews, fetchAnalytics]);

  const hasNewOffers = useMemo(() => allOffers.some((o) => o.condition === "novo"), [allOffers]);
  const hasUsedOffers = useMemo(() => allOffers.some((o) => o.condition !== "novo"), [allOffers]);

  useEffect(() => {
    if (hasNewOffers && !hasUsedOffers) setConditionFilter("novo");
    else if (hasUsedOffers && !hasNewOffers) setConditionFilter("usado");
    else if (hasNewOffers && hasUsedOffers) setConditionFilter("all");
  }, [hasNewOffers, hasUsedOffers]);

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

  const [canReview, setCanReview] = useState(false);
  useEffect(() => {
    if (!cpf || cpf === "visitor" || !product) {
      setCanReview(false);
      return;
    }
    const checkPurchase = async () => {
      try {
        const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
        const headers = await getMarketplaceHeaders();
        const params = new URLSearchParams({ action: "check-purchase", product_id: product.id });
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-engage?${params}`, { headers });
        const data = await res.json();
        setCanReview(!!data.has_purchased);
      } catch {
        setCanReview(false);
      }
    };
    checkPurchase();
  }, [cpf, product]);

  // Loading skeleton
  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-background theme-light">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-40 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <Skeleton className="aspect-[4/3] rounded-2xl" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background theme-light flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Produto não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/app")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.svg"];
  const formattedName = formatProductName(product.brand, product.model);

  const canonicalUrl = `https://bravenza.com.br/marketplace/${product.slug}`;

  return (
    <div className="min-h-screen bg-secondary theme-light">
      {/* SEO */}
      <Helmet>
        <title>{`${formattedName} | BRAVENZA Marketplace`}</title>
        <meta name="description" content={`Compre ${formattedName}${product.colorway ? ` (${product.colorway})` : ""} autenticado no Marketplace BRAVENZA. ${product.lowest_price ? `A partir de R$ ${product.lowest_price.toLocaleString("pt-BR")}.` : ""} Inspeção e certificado inclusos.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${formattedName} — BRAVENZA`} />
        <meta property="og:description" content={`Sneaker autenticado no marketplace BRAVENZA.${product.lowest_price ? ` A partir de R$ ${product.lowest_price.toLocaleString("pt-BR")}.` : ""}`} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        {images[0] && images[0] !== "/placeholder.svg" && <meta property="og:image" content={images[0]} />}
        <meta property="product:price:amount" content={String(product.lowest_price || "")} />
        <meta property="product:price:currency" content="BRL" />
      </Helmet>

      <ProductSchema
        name={formattedName}
        brand={product.brand}
        description={product.description || `${formattedName} — sneaker autenticado no marketplace BRAVENZA.`}
        image={images[0] !== "/placeholder.svg" ? images[0] : undefined}
        sku={product.sku || undefined}
        price={product.lowest_price || undefined}
        condition={allOffers.length > 0 ? allOffers[0].condition : undefined}
        url={canonicalUrl}
        ratingValue={reviewsAverage || undefined}
        reviewCount={reviewsTotal || undefined}
        offersCount={product.total_offers || undefined}
      />

      <BreadcrumbSchema items={[
        { name: "Marketplace", url: "https://bravenza.com.br/marketplace" },
        { name: product.brand, url: `https://bravenza.com.br/app?q=${encodeURIComponent(product.brand)}` },
        { name: product.model, url: canonicalUrl },
      ]} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* 100% Original Seal */}
        <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold text-emerald-700 tracking-tight">100% Original</span>
          <span className="text-xs text-emerald-600/80">Todos os produtos passam por autenticação profissional</span>
        </div>

        <Breadcrumbs
          items={[
            { label: "Marketplace", href: "/app" },
            { label: product.brand, href: `/app?q=${encodeURIComponent(product.brand)}` },
            { label: product.model },
          ]}
          className="mb-6 text-xs"
        />

        {/* ===== HERO: Gallery + Purchase Panel ===== */}
        <div ref={heroRef} className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Gallery — 3/5 width */}
          <div className="lg:col-span-3">
            <ProductGallery
              images={images}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
              productName={formattedName}
              isHighRisk={product.is_high_risk}
            />
          </div>

          {/* Purchase panel — 2/5 width, sticky */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Brand + Title */}
              <div>
                <button
                  onClick={() => navigate(`/app?q=${encodeURIComponent(product.brand)}`)}
                  className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-semibold hover:text-primary transition-colors"
                >
                  {product.brand}
                </button>
                <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight mt-1 tracking-tight">
                  {formattedName}
                </h1>
                {product.colorway && (
                  <p className="text-sm text-muted-foreground mt-1">{product.colorway}</p>
                )}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <AuthenticityBadge />
                  <SocialProofViewers productId={product.id} baseViewers={product.total_offers} />
                </div>
              </div>

              {/* Price */}
              {(() => {
                const lowestForSize = sortedOffers.length > 0 ? sortedOffers[0].price : null;
                const displayPrice = lowestForSize ?? product.lowest_price;
                const multipleOffers = sortedOffers.length > 1;
                const hasSize = !!selectedSize;
                const showPrefix = !hasSize || multipleOffers;
                return (
                  <>
                    <ProductPriceBlock
                      displayPrice={displayPrice}
                      showPrefix={showPrefix}
                    />
                    <RetailComparison
                      currentPrice={displayPrice}
                      retailPrice={product.retail_price}
                    />
                    <FloatingCouponBadge productId={product.id} />
                  </>
                );
              })()}

              <Separator className="bg-border/20" />

              {/* Condition Filter */}
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
                        "px-6 py-3 rounded-xl text-sm font-bold transition-all border",
                        conditionFilter === opt.value
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-muted/30 bg-muted/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {hasNewOffers && !hasUsedOffers && (
                <Badge variant="secondary" className="text-xs w-fit">Somente Novos</Badge>
              )}
              {hasUsedOffers && !hasNewOffers && (
                <Badge variant="secondary" className="text-xs w-fit">Somente Usados</Badge>
              )}

              {/* Size Guide */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Selecione o tamanho</span>
                <SizeGuideDialog brand={product.brand} />
              </div>

              {/* Size + Price Grid */}
              <SizePriceGrid
                allOffers={allOffers}
                sizes={sizes}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                conditionFilter={conditionFilter}
              />
              {filteredSizes.length === 0 && sizes.length > 0 && (
                <p className="text-xs text-muted-foreground">Nenhum tamanho disponível para este filtro.</p>
              )}

              {/* Notify Me for unavailable sizes */}
              <NotifyMeSection
                sizes={sizes}
                availableSizes={filteredSizes}
                isLoggedIn={!!cpf && cpf !== "visitor"}
                onNotify={async (size) => {
                  await toggleWatchlist(product.id, size);
                }}
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
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
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-border/30"
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

              {/* High risk warning */}
              {product.is_high_risk && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-primary text-xs">
                  <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold text-sm">Autenticação recomendada</span>
                    <p className="text-primary/80 leading-relaxed">
                      Este modelo possui alto índice de réplicas.
                      {product.lowest_price && product.lowest_price >= 2000
                        ? " Verificação PRO obrigatória nesta faixa de preço."
                        : " Recomendamos envio Via Bravenza para certificação."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== TRUST BADGES ===== */}
        <div className="mt-12">
          <TrustBadges />
        </div>

        {/* ===== PRODUCT SPECS ===== */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-border/20 p-6">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
                <Info className="h-4 w-4 text-primary" />
                Ficha Técnica
            </h3>
            <div className="rounded-xl border border-border/20 overflow-hidden">
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
                onClick={() => navigate(`/app?q=${encodeURIComponent(product.brand)}`)}
              />
              <SpecRow
                icon={<ShoppingBag className="h-3.5 w-3.5" />}
                label="Silhueta"
                value={product.model}
                even
                onClick={() => navigate(`/app?q=${encodeURIComponent(product.model)}`)}
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
            <div className="bg-white rounded-2xl border border-border/20 p-6">
              <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
                <Info className="h-4 w-4 text-primary" />
                Descrição
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* ===== PRICE COMPARATOR ===== */}
        {sizes.length >= 2 && (
          <div className="mt-14">
            <PriceComparator
              allOffers={allOffers}
              sizes={sizes}
              retailPrice={product.retail_price}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
            />
          </div>
        )}

        {/* ===== SELLER OFFERS SECTION ===== */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Ofertas {selectedSize ? `— Tam. ${selectedSize}` : ""}
            </h2>
            <span className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full font-medium">
              {sortedOffers.length} oferta{sortedOffers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadingOffers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="p-12 bg-muted/5 rounded-2xl text-center border border-border/20">
              <p className="text-sm text-muted-foreground">
                {product.total_offers === 0
                  ? "Nenhuma oferta disponível. Seja o primeiro a vender!"
                  : `Nenhuma oferta para o tamanho ${selectedSize}.`}
              </p>
              {selectedSize && cpf && cpf !== "visitor" && (
                <div className="mt-4 flex justify-center">
                  <ProductWatchlistButton
                    isWatching={watchlistStatus.active}
                    maxPrice={watchlistStatus.max_price}
                    lowestPrice={product.lowest_price}
                    onToggle={async (mp) => {
                      await toggleWatchlist(product.id, selectedSize, mp);
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSize}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {sortedOffers.map((offer, index) => (
                  <OfferCardWithCart
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

        {/* ===== BELOW-FOLD LAZY SECTIONS ===== */}
        <Suspense fallback={<Skeleton className="h-64 w-full mt-14 rounded-2xl" />}>
          {/* ===== PRICE HISTORY ===== */}
          <div className="mt-14">
            <PriceHistoryChart productId={product.id} cpf={cpf || "visitor"} />
          </div>

          {/* ===== SMART RECOMMENDATIONS ===== */}
          <div className="mt-14">
            <SmartRecommendations productId={product.id} cpf={cpf || "visitor"} />
          </div>
        {/* ===== SELL CTA ===== */}
        <div className="mt-14">
          <div className="bg-white rounded-2xl border border-border/20 p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Megaphone className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Tem esse modelo? Anuncie aqui!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Venda seu sneaker de forma segura com autenticação e pagamento protegido.
              </p>
            </div>
            <Button
              onClick={() => navigate("/app/loja")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 py-3 font-bold text-sm shrink-0"
            >
              Quero anunciar
            </Button>
          </div>
        </div>




          {/* ===== RECENTLY VIEWED ===== */}
          <div className="mt-14">
            <RecentlyViewedSection />
          </div>




          {/* ===== REVIEWS ===== */}
          <div className="mt-14 bg-white rounded-2xl border border-border/20 p-6">
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

          {/* ===== PROTECTED PURCHASE ===== */}
          <div className="mt-14 bg-white rounded-2xl border border-border/20 p-6">
            <ProtectedPurchaseSection />
          </div>
        </Suspense>
      </main>

      {/* Offer Detail Sheet */}
      <ListingDetailSheet
        listing={detailOffer ? offerToListing(detailOffer) : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFavorite={() => { }}
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
        buyerCpf={cpf}
      />

      {/* Checkout is now a full page */}

      {/* Sticky Buy Bar — Mobile only */}
      <StickyBuyBar
        price={sortedOffers.length > 0 ? sortedOffers[0].price : product.lowest_price}
        size={selectedSize}
        visible={showStickyBar && sortedOffers.length > 0}
        onBuy={() => {
          if (sortedOffers.length > 0) handleBuyOffer(sortedOffers[0]);
        }}
      />
      {/* Footer */}
      <div className="pb-20 md:pb-0">
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { profile } = useClientSession();
  return (
    <CartProvider cpf={profile?.cpf || null}>
      <ProductDetailPageInner />
    </CartProvider>
  );
}
