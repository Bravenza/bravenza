import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Share2, Package, BadgeCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductOffer } from "@/hooks/useMarketplaceCatalog";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductPriceBlock } from "@/components/marketplace/ProductPriceBlock";
import { AuthenticityBadge } from "@/components/marketplace/AuthenticityBadge";
import { SocialProofViewers } from "@/components/marketplace/SocialProofViewers";
import { RetailComparison } from "@/components/marketplace/RetailComparison";
import { FloatingCouponBadge } from "@/components/marketplace/FloatingCouponBadge";
import { SizePriceGrid } from "@/components/marketplace/SizePriceGrid";
import { SizeGuideDialog } from "@/components/marketplace/SizeGuideDialog";
import { NotifyMeSection } from "@/components/marketplace/NotifyMeSection";
import { ProductWatchlistButton } from "@/components/marketplace/ProductWatchlistButton";
import { AlertConfigModal } from "@/components/marketplace/AlertConfigModal";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { useMarketplaceCart } from "@/hooks/useMarketplaceCart";
import { getProductShareUrl } from "@/lib/share-url";
import { formatProductName } from "@/lib/text-utils";

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
    return <OfferCard {...props} />;
  }
}

interface ProductHeroSectionProps {
  product: {
    id: string;
    brand: string;
    model: string;
    colorway: string | null;
    lowest_price: number | null;
    retail_price: number | null;
    is_high_risk: boolean;
    total_offers: number;
    slug: string | null;
    images: string[];
  };
  images: string[];
  selectedImage: number;
  onSelectImage: (i: number) => void;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  sizes: string[];
  filteredSizes: string[];
  allOffers: ProductOffer[];
  sortedOffers: ProductOffer[];
  loadingOffers: boolean;
  conditionFilter: "all" | "novo" | "usado";
  onConditionFilterChange: (v: "all" | "novo" | "usado") => void;
  hasNewOffers: boolean;
  hasUsedOffers: boolean;
  watchlistStatus: { active: boolean; max_price: number | null };
  onToggleWatchlist: (productId: string, size: string, maxPrice?: number) => Promise<void>;
  cpf: string | undefined;
  alertsV2: boolean;
  onBuyOffer: (offer: ProductOffer) => void;
  onViewOffer: (offer: ProductOffer) => void;
  onHeroRef: (ref: HTMLDivElement | null) => void;
}

export function ProductHeroSection({
  product, images, selectedImage, onSelectImage,
  selectedSize, onSelectSize, sizes, filteredSizes,
  allOffers, sortedOffers, loadingOffers,
  conditionFilter, onConditionFilterChange,
  hasNewOffers, hasUsedOffers,
  watchlistStatus, onToggleWatchlist,
  cpf, alertsV2,
  onBuyOffer, onViewOffer, onHeroRef,
}: ProductHeroSectionProps) {
  const navigate = useNavigate();
  const formattedName = formatProductName(product.brand, product.model);

  return (
    <div ref={onHeroRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <div>
        <ProductGallery
          images={images}
          selectedImage={selectedImage}
          onSelectImage={onSelectImage}
          productName={formattedName}
          isHighRisk={product.is_high_risk}
        />
      </div>

      {/* Purchase panel */}
      <div>
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
                <ProductPriceBlock displayPrice={displayPrice} showPrefix={showPrefix} />
                <RetailComparison currentPrice={displayPrice} retailPrice={product.retail_price} />
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
                  onClick={() => onConditionFilterChange(opt.value)}
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

          <SizePriceGrid
            allOffers={allOffers}
            sizes={sizes}
            selectedSize={selectedSize}
            onSelectSize={onSelectSize}
            conditionFilter={conditionFilter}
          />
          {filteredSizes.length === 0 && sizes.length > 0 && (
            <p className="text-xs text-muted-foreground">Nenhum tamanho disponível para este filtro.</p>
          )}

          <NotifyMeSection
            sizes={sizes}
            availableSizes={filteredSizes}
            isLoggedIn={!!cpf && cpf !== "visitor"}
            onNotify={async (size) => { await onToggleWatchlist(product.id, size); }}
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedSize && cpf && cpf !== "visitor" && (
              <ProductWatchlistButton
                isWatching={watchlistStatus.active}
                maxPrice={watchlistStatus.max_price}
                lowestPrice={product.lowest_price}
                onToggle={async (mp) => { await onToggleWatchlist(product.id, selectedSize, mp); }}
              />
            )}
            {alertsV2 && cpf && cpf !== "visitor" && product && (
              <AlertConfigModal
                productId={product.id}
                productName={`${product.brand} ${product.model}`}
                cpf={cpf}
                sizes={sizes}
                currentLowest={product.lowest_price}
              />
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border/30"
              onClick={() => {
                const shareUrl = product.slug ? getProductShareUrl(product.slug) : window.location.href;
                if (navigator.share) {
                  navigator.share({ title: formattedName, url: shareUrl });
                } else {
                  navigator.clipboard.writeText(shareUrl);
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

      {/* ===== OFFERS SECTION (below on mobile, after grid on desktop it's still in flow) ===== */}
    </div>
  );
}

interface OffersSectionProps {
  selectedSize: string | null;
  sortedOffers: ProductOffer[];
  loadingOffers: boolean;
  images: string[];
  product: { id: string; total_offers: number; lowest_price: number | null };
  cpf: string | undefined;
  watchlistStatus: { active: boolean; max_price: number | null };
  onToggleWatchlist: (productId: string, size: string, maxPrice?: number) => Promise<void>;
  onBuyOffer: (offer: ProductOffer) => void;
  onViewOffer: (offer: ProductOffer) => void;
}

export function OffersSection({
  selectedSize, sortedOffers, loadingOffers, images, product,
  cpf, watchlistStatus, onToggleWatchlist, onBuyOffer, onViewOffer,
}: OffersSectionProps) {
  return (
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
                onToggle={async (mp) => { await onToggleWatchlist(product.id, selectedSize, mp); }}
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
                onBuy={() => onBuyOffer(offer)}
                onClick={() => onViewOffer(offer)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
