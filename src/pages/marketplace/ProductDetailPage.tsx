import React, { useEffect, useState, useMemo, useRef, lazy, Suspense, useCallback } from "react";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { saveRecentlyViewed } from "@/components/marketplace/home/RecentlyViewedSection";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceCatalog, type ProductOffer } from "@/hooks/useMarketplaceCatalog";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { CartProvider, useMarketplaceCart } from "@/hooks/useMarketplaceCart";
import type { CartGroup } from "@/hooks/useMarketplaceCart";
import { useClientSession } from "@/hooks/useClientSession";
import { ListingDetailSheet } from "@/components/client/vault/marketplace/ListingDetailSheet";
import { useConfig } from "@/hooks/useConfig";
import { TrustBadges } from "@/components/marketplace/TrustBadges";
import { StickyBuyBar } from "@/components/marketplace/StickyBuyBar";
import { PriceComparator } from "@/components/marketplace/PriceComparator";
import { formatProductName } from "@/lib/text-utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { ProductSEO } from "./product/ProductSEO";
import { ProductHeroSection, OffersSection } from "./product/ProductHeroSection";
import { ProductSpecsSection } from "./product/ProductSpecsSection";


const ProductAnalyticsChart = lazy(() => import("@/components/marketplace/ProductAnalyticsChart").then(m => ({ default: m.ProductAnalyticsChart })));
const ProductReviews = lazy(() => import("@/components/marketplace/ProductReviews").then(m => ({ default: m.ProductReviews })));
const PriceHistoryChart = lazy(() => import("@/components/marketplace/PriceHistoryChart").then(m => ({ default: m.PriceHistoryChart })));
const SmartRecommendations = lazy(() => import("@/components/marketplace/SmartRecommendations").then(m => ({ default: m.SmartRecommendations })));
const ProtectedPurchaseSection = lazy(() => import("@/components/marketplace/ProtectedPurchaseSection").then(m => ({ default: m.ProtectedPurchaseSection })));
const RelatedProductsSection = lazy(() => import("@/components/marketplace/RelatedProductsSection").then(m => ({ default: m.RelatedProductsSection })));
const RecentlyViewedSection = lazy(() => import("@/components/marketplace/home/RecentlyViewedSection").then(m => ({ default: m.RecentlyViewedSection })));

function ProductDetailPageInner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf;
  const catalog = useMarketplaceCatalog(cpf || "visitor");
  const { product, offers, allOffers, sizes, isLoading, fetchProduct, fetchOffersBySize, watchlistStatus, checkWatchlist, toggleWatchlist, reviews, reviewsLoading, reviewsAverage, reviewsTotal, fetchReviews, submitReview, comments, commentsLoading, fetchComments, submitComment, analytics, analyticsLoading, fetchAnalytics } = catalog;
  const { createOrder } = useMarketplace(cpf || null);
  const isMobile = useIsMobile();
  const { isEnabled } = useConfig();
  const alertsV2 = isEnabled("enable_alerts_v2");
  const heroRef = useRef<HTMLDivElement | null>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<"all" | "novo" | "usado">("all");
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

  const debouncedFetchOffers = useDebouncedCallback(
    (productId: string, size: string) => {
      setLoadingOffers(true);
      fetchOffersBySize(productId, size).finally(() => setLoadingOffers(false));
    },
    300
  );

  useEffect(() => {
    if (product && selectedSize) {
      debouncedFetchOffers(product.id, selectedSize);
      if (cpf && cpf !== "visitor") {
        checkWatchlist(product.id, selectedSize);
      }
    }
  }, [product, selectedSize, debouncedFetchOffers, checkWatchlist, cpf]);

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
  const [sellerReplies, setSellerReplies] = useState<Record<string, any>>({});
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

  // Fetch seller replies for reviews
  useEffect(() => {
    if (!product) return;
    const fetchReplies = async () => {
      try {
        const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
        const headers = await getMarketplaceHeaders();
        const params = new URLSearchParams({ action: "product-comments", product_id: product.id });
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-engage?${params}`, { headers });
        const data = await res.json();
        if (data.comments) {
          const repliesMap: Record<string, any> = {};
          for (const c of data.comments) {
            if (c.is_seller_reply && c.review_id) {
              repliesMap[c.review_id] = {
                id: c.id,
                review_id: c.review_id,
                content: c.content,
                user_name: c.user_name,
                created_at: c.created_at,
              };
            }
          }
          setSellerReplies(repliesMap);
        }
      } catch {
        // silent
      }
    };
    fetchReplies();
  }, [product, reviews]);

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

  return (
    <div className="min-h-screen bg-secondary theme-light">
      <ProductSEO
        product={product}
        formattedName={formattedName}
        images={images}
        allOffers={allOffers}
        reviewsAverage={reviewsAverage}
        reviewsTotal={reviewsTotal}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* 100% Original Seal */}
        <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-success/5 border border-success/20">
          <BadgeCheck className="h-5 w-5 text-success shrink-0" />
          <span className="text-sm font-bold text-success tracking-tight">100% Original</span>
          <span className="text-xs text-success/80">Todos os produtos passam por autenticação profissional</span>
        </div>

        <Breadcrumbs
          items={[
            { label: "Marketplace", href: "/app" },
            { label: product.brand, href: `/app?q=${encodeURIComponent(product.brand)}` },
            { label: product.model },
          ]}
          className="mb-6 text-xs"
        />

        <ProductHeroSection
          product={product}
          images={images}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          sizes={sizes}
          filteredSizes={filteredSizes}
          allOffers={allOffers}
          sortedOffers={sortedOffers}
          loadingOffers={loadingOffers}
          conditionFilter={conditionFilter}
          onConditionFilterChange={setConditionFilter}
          hasNewOffers={hasNewOffers}
          hasUsedOffers={hasUsedOffers}
          watchlistStatus={watchlistStatus}
          onToggleWatchlist={toggleWatchlist}
          cpf={cpf}
          alertsV2={alertsV2}
          onBuyOffer={handleBuyOffer}
          onViewOffer={handleViewOffer}
          onHeroRef={(ref) => { heroRef.current = ref; }}
        />

        <div className="mt-12">
          <TrustBadges />
        </div>

        <ProductSpecsSection product={product} />

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

        <OffersSection
          selectedSize={selectedSize}
          sortedOffers={sortedOffers}
          loadingOffers={loadingOffers}
          images={images}
          product={product}
          cpf={cpf}
          watchlistStatus={watchlistStatus}
          onToggleWatchlist={toggleWatchlist}
          onBuyOffer={handleBuyOffer}
          onViewOffer={handleViewOffer}
        />

        <Suspense fallback={<Skeleton className="h-64 w-full mt-14 rounded-2xl" />}>
          <div className="mt-14">
            <PriceHistoryChart productId={product.id} cpf={cpf || "visitor"} />
          </div>

          <div className="mt-14">
            <SmartRecommendations productId={product.id} cpf={cpf || "visitor"} />
          </div>

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

          <div className="mt-14">
            <RecentlyViewedSection />
          </div>

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

          <div className="mt-14 bg-white rounded-2xl border border-border/20 p-6">
            <ProtectedPurchaseSection />
          </div>
        </Suspense>
      </main>

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

      <StickyBuyBar
        price={sortedOffers.length > 0 ? sortedOffers[0].price : product.lowest_price}
        size={selectedSize}
        visible={showStickyBar && sortedOffers.length > 0}
        onBuy={() => {
          if (sortedOffers.length > 0) handleBuyOffer(sortedOffers[0]);
        }}
      />

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
