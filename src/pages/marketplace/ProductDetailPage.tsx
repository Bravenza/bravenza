import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Star, Verified, Heart, Share2, ChevronRight, AlertTriangle, Package, Eye } from "lucide-react";
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
import { ProductWatchlistButton } from "@/components/marketplace/ProductWatchlistButton";
import { ProductComments } from "@/components/marketplace/ProductComments";

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
  const { product, offers, sizes, isLoading, fetchProduct, fetchOffersBySize, watchlistStatus, checkWatchlist, toggleWatchlist, comments, commentsLoading, fetchComments, submitComment } = useMarketplaceCatalog(cpf || "visitor");
  const { createOrder } = useMarketplace(cpf || null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutListing, setCheckoutListing] = useState<MarketplaceListing | null>(null);

  const offerToListing = (offer: ProductOffer): MarketplaceListing => ({
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
    shipping_mode: offer.shipping_mode,
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
  });

  const handleBuyOffer = (offer: ProductOffer) => {
    setCheckoutListing(offerToListing(offer));
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

  // When sizes load, auto-select first
  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  // Fetch offers when size changes
  useEffect(() => {
    if (product && selectedSize) {
      setLoadingOffers(true);
      fetchOffersBySize(product.id, selectedSize).finally(() => setLoadingOffers(false));
      checkWatchlist(product.id, selectedSize);
    }
  }, [product, selectedSize, fetchOffersBySize, checkWatchlist]);

  // Fetch comments when product loads
  useEffect(() => {
    if (product) fetchComments(product.id);
  }, [product, fetchComments]);

  // Sort offers by price
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => a.price - b.price);
  }, [offers]);

  // Count offers per size
  const sizeOfferCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sizes.forEach(s => { counts[s] = 0; });
    // We only have current size offers loaded, so we use product total_offers as an indicator
    return counts;
  }, [sizes]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Logo size="sm" />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/30">
              <img
                src={images[selectedImage]}
                alt={`${product.brand} ${product.model}`}
                className="w-full h-full object-contain"
              />
              {product.is_high_risk && (
                <Badge className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] gap-1">
                  <AlertTriangle className="h-3 w-3" /> Alto risco — PRO recomendado
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                      selectedImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info + Size + Offers */}
          <div className="space-y-6">
            {/* Brand & Model */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
                {product.brand}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {product.model}
              </h1>
              {product.colorway && (
                <p className="text-sm text-muted-foreground mt-1">{product.colorway}</p>
              )}
              {product.sku && (
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{product.sku}</p>
              )}
            </div>

            {/* Price + Watchlist */}
            <div className="flex items-center justify-between">
              {product.lowest_price && (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">A partir de</span>
                  <span className="text-2xl font-bold text-foreground">
                    R$ {product.lowest_price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              )}
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
            </div>

            {product.total_offers === 0 && (
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Nenhuma oferta disponível para este produto.</p>
                <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a vender!</p>
              </div>
            )}

            {/* Size Grid */}
            {sizes.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2.5 block">
                  Selecione o tamanho
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6 gap-2">
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

            {/* Offers List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Ofertas {selectedSize ? `— Tam. ${selectedSize}` : ""}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {sortedOffers.length} oferta{sortedOffers.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loadingOffers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : sortedOffers.length === 0 ? (
                <div className="p-6 bg-muted/20 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma oferta para o tamanho {selectedSize}.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedSize}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2.5"
                  >
                    {sortedOffers.map((offer, index) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        isBest={index === 0}
                        onBuy={() => handleBuyOffer(offer)}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-10 max-w-2xl">
            <h3 className="text-sm font-semibold mb-2">Sobre este modelo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Comments / Q&A */}
        <div className="mt-8 max-w-2xl">
          <ProductComments
            productId={product.id}
            comments={comments}
            isLoading={commentsLoading}
            onSubmit={async (content, parentId) => {
              return submitComment(product.id, content, parentId);
            }}
            onRefresh={() => fetchComments(product.id)}
            currentUserName={profile?.full_name}
          />
        </div>
      </main>

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

// ---- Offer Card sub-component ----

function OfferCard({ offer, isBest, onBuy }: { offer: ProductOffer; isBest: boolean; onBuy: () => void }) {
  const pro = proLabels[offer.pro_recommendation] || proLabels.direct_allowed;
  const ProIcon = pro.icon;
  const sellerName = offer.seller?.member?.client_name?.split(" ")[0] || "Vendedor";

  return (
    <div className={cn(
      "flex items-center gap-3 p-3.5 rounded-xl border transition-all",
      isBest ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border"
    )}>
      {/* Seller info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{sellerName}</span>
          {offer.seller?.total_sales_count && offer.seller.total_sales_count > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Verified className="h-2.5 w-2.5 text-primary" />
              {offer.seller.total_sales_count}
            </span>
          ) : null}
          {offer.seller?.average_rating && offer.seller.average_rating > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Star className="h-2.5 w-2.5 text-primary fill-primary" />
              {offer.seller.average_rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-0.5", conditionColors[offer.condition])}>
            {conditionLabels[offer.condition] || offer.condition}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-0.5", pro.color)}>
            <ProIcon className="h-2.5 w-2.5" />
            {pro.text}
          </Badge>
          {offer.has_receipt && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              NF
            </Badge>
          )}
          {isBest && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
              Melhor preço
            </Badge>
          )}
        </div>
      </div>

      {/* Price + CTA */}
      <div className="text-right flex-shrink-0 space-y-1.5">
        <p className="text-lg font-bold text-foreground">
          R$ {offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
        </p>
        <Button size="sm" className="btn-gold text-xs h-8 gap-1" onClick={(e) => { e.stopPropagation(); onBuy(); }}>
          Comprar <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
