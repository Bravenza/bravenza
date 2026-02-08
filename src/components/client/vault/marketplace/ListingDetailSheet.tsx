import { useState } from "react";
import { Heart, ShieldCheck, Eye, Star, Truck, Package, ShoppingCart, User, ChevronLeft, ChevronRight, Shield, Clock, Verified } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/hooks/useMarketplace";
import { OfferDialog } from "./OfferDialog";
import { motion, AnimatePresence } from "framer-motion";
import { ProductComments, type ProductComment } from "@/components/marketplace/ProductComments";

const conditionLabels: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Usado - Excelente",
  usado_bom: "Usado - Bom",
  usado_regular: "Usado - Regular",
};

const conditionDescriptions: Record<string, string> = {
  novo: "Item nunca utilizado, com etiquetas e embalagem original.",
  usado_excelente: "Utilizado poucas vezes, sem marcas visíveis de uso.",
  usado_bom: "Utilizado com marcas leves de uso, bom estado geral.",
  usado_regular: "Marcas visíveis de uso, ainda funcional.",
};

interface ListingDetailSheetProps {
  listing: MarketplaceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onBuy?: (listing: MarketplaceListing) => void;
  onMakeOffer?: (data: { listing_id: string; offer_price: number; message?: string }) => Promise<boolean>;
  onViewSellerProfile?: (sellerId: string) => void;
  isOwnListing?: boolean;
  // Q&A props
  comments?: ProductComment[];
  commentsLoading?: boolean;
  onSubmitComment?: (content: string, parentId?: string) => Promise<boolean>;
  onRefreshComments?: () => void;
  currentUserName?: string;
}

export function ListingDetailSheet({
  listing,
  open,
  onOpenChange,
  onToggleFavorite,
  onBuy,
  onMakeOffer,
  onViewSellerProfile,
  isOwnListing = false,
  comments,
  commentsLoading,
  onSubmitComment,
  onRefreshComments,
  currentUserName,
}: ListingDetailSheetProps) {
  const [activePhoto, setActivePhoto] = useState(0);

  if (!listing) return null;

  const photos = listing.photos?.length ? listing.photos : [];
  const totalPrice = listing.price + (listing.shipping_cost_estimate || 0);
  const hasDiscount = listing.original_purchase_price && listing.original_purchase_price > listing.price;
  const discountPercent = hasDiscount
    ? Math.round(((listing.original_purchase_price! - listing.price) / listing.original_purchase_price!) * 100)
    : 0;

  const nextPhoto = () => setActivePhoto((p) => (p + 1) % photos.length);
  const prevPhoto = () => setActivePhoto((p) => (p - 1 + photos.length) % photos.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 border-l border-border/30">
        {/* Photo Gallery - Enhanced */}
        <div className="relative aspect-square bg-[hsl(0,0%,16%)]">
          <AnimatePresence mode="wait">
            {photos.length > 0 ? (
              <motion.img
                key={activePhoto}
                src={photos[activePhoto]}
                alt={listing.title}
                className="w-full h-full object-cover"
                loading="eager"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Package className="h-16 w-16 opacity-20" />
              </div>
            )}
          </AnimatePresence>

          {/* Photo navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </>
          )}

          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    i === activePhoto ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Certification badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            {listing.is_vault_certified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Vault Certified
              </span>
            )}
          </div>

          {/* Favorite */}
          {!isOwnListing && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-14 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 border-0 z-20"
              onClick={() => onToggleFavorite(listing.id)}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  listing.is_favorited ? "fill-red-500 text-red-500" : "text-white"
                )}
              />
            </Button>
          )}

          {/* Photo counter */}
          {photos.length > 1 && (
            <span className="absolute top-4 right-16 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium">
              {activePhoto + 1}/{photos.length}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Brand breadcrumb */}
          {listing.brand && (
            <p className="text-xs text-primary uppercase tracking-widest font-semibold">
              {listing.brand}
              {listing.model ? ` — ${listing.model}` : ""}
            </p>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold leading-tight text-foreground">
            {listing.title}
          </h2>
          {listing.colorway && (
            <p className="text-sm text-muted-foreground -mt-3">{listing.colorway}</p>
          )}

          {/* Price block */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">
                  R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                {hasDiscount && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-muted-foreground line-through mt-0.5">
                  R$ {listing.original_purchase_price!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
              {listing.shipping_cost_estimate > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  + R$ {listing.shipping_cost_estimate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} frete
                </p>
              )}
            </div>
            {listing.size && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Tamanho</p>
                <p className="text-lg font-bold text-foreground">{listing.size}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.views_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {listing.favorites_count}
            </span>
          </div>

          <Separator className="bg-border/30" />

          {/* Condition & Shipping - Enhanced info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[hsl(0,0%,16%)] rounded-xl border border-border/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Condição</p>
              <p className="text-sm font-semibold mt-1 text-foreground">
                {conditionLabels[listing.condition] || listing.condition}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {conditionDescriptions[listing.condition] || ""}
              </p>
            </div>
            <div className="p-3 bg-[hsl(0,0%,16%)] rounded-xl border border-border/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Envio</p>
              <p className="text-sm font-semibold mt-1 flex items-center gap-1 text-foreground">
                {listing.shipping_mode === "bravenza" ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Via Bravenza
                  </>
                ) : (
                  <>
                    <Truck className="h-3.5 w-3.5" />
                    Direto
                  </>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {listing.shipping_mode === "bravenza"
                  ? "Autenticação garantida"
                  : "Envio entre membros"}
              </p>
            </div>
          </div>

          {listing.description && (
            <>
              <Separator className="bg-border/30" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descrição</p>
                <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              </div>
            </>
          )}

          {/* Seller - Enhanced profile card */}
          {listing.seller && (
            <>
              <Separator className="bg-border/30" />
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all border border-border/20",
                  !isOwnListing && "cursor-pointer hover:bg-[hsl(0,0%,18%)] hover:border-primary/20"
                )}
                onClick={() => !isOwnListing && listing.seller && onViewSellerProfile?.(listing.seller.id)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {listing.seller.member.client_name}
                    <Verified className="h-3.5 w-3.5 text-primary" />
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{listing.seller.total_sales_count} venda{listing.seller.total_sales_count !== 1 ? "s" : ""}</span>
                    {listing.seller.average_rating && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        {listing.seller.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize border-primary/20 text-primary">
                  {listing.seller.member.tier === "elite"
                    ? "Black"
                    : listing.seller.member.tier === "collector"
                    ? "Privilege"
                    : "Access"}
                </Badge>
              </div>
            </>
          )}

          {/* Trust signals - Droper-inspired */}
          {!isOwnListing && (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1.5 p-3 bg-[hsl(0,0%,16%)] rounded-xl border border-border/20">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">Compra<br/>Protegida</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-[hsl(0,0%,16%)] rounded-xl border border-border/20">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">100%<br/>Original</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-[hsl(0,0%,16%)] rounded-xl border border-border/20">
                <Clock className="h-5 w-5 text-sky-400" />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">7 dias<br/>garantia</span>
              </div>
            </div>
          )}

          {/* Q&A Section */}
          {onSubmitComment && (
            <>
              <Separator className="bg-border/30" />
              <ProductComments
                productId={listing.id}
                comments={comments || []}
                isLoading={commentsLoading || false}
                onSubmit={onSubmitComment}
                onRefresh={onRefreshComments || (() => {})}
                currentUserName={currentUserName}
              />
            </>
          )}

          {/* Action buttons */}
          {!isOwnListing && (
            <div className="flex gap-2 pt-2 sticky bottom-0 bg-card pb-safe">
              <Button
                className="flex-1 btn-gold gap-2 h-12 text-sm font-bold"
                onClick={() => onBuy?.(listing)}
              >
                <ShoppingCart className="h-4 w-4" />
                Comprar — R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </Button>
              {onMakeOffer && (
                <OfferDialog
                  listingId={listing.id}
                  listingPrice={listing.price}
                  onSubmit={onMakeOffer}
                />
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
