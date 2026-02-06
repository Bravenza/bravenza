import { useState } from "react";
import { Heart, ShieldCheck, Eye, Star, Truck, Package, ShoppingCart, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/hooks/useMarketplace";
import { OfferDialog } from "./OfferDialog";

const conditionLabels: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Usado - Excelente",
  usado_bom: "Usado - Bom",
  usado_regular: "Usado - Regular",
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
}: ListingDetailSheetProps) {
  const [activePhoto, setActivePhoto] = useState(0);

  if (!listing) return null;

  const photos = listing.photos?.length ? listing.photos : [];
  const totalPrice = listing.price + (listing.shipping_cost_estimate || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Photo Gallery */}
        <div className="relative aspect-square bg-muted/30">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[activePhoto]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition",
                        i === activePhoto ? "bg-primary" : "bg-foreground/40"
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="h-16 w-16 opacity-20" />
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {listing.is_vault_certified && (
              <Badge className="bg-primary text-primary-foreground gap-1">
                <ShieldCheck className="h-3 w-3" />
                Vault ID
              </Badge>
            )}
          </div>

          {!isOwnListing && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 bg-background/60 backdrop-blur-sm"
              onClick={() => onToggleFavorite(listing.id)}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  listing.is_favorited ? "fill-red-500 text-red-500" : "text-foreground"
                )}
              />
            </Button>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          <SheetHeader className="text-left p-0 space-y-1">
            <SheetTitle className="text-xl">{listing.title}</SheetTitle>
            {listing.brand && (
              <p className="text-sm text-muted-foreground">
                {listing.brand}
                {listing.model ? ` · ${listing.model}` : ""}
                {listing.colorway ? ` · ${listing.colorway}` : ""}
              </p>
            )}
          </SheetHeader>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">
                R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              {listing.original_purchase_price && listing.original_purchase_price > listing.price && (
                <p className="text-sm text-muted-foreground line-through">
                  R$ {listing.original_purchase_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
              {listing.shipping_cost_estimate > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  + R$ {listing.shipping_cost_estimate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de frete
                </p>
              )}
            </div>
            {listing.size && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                Tam. {listing.size}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.views_count} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {listing.favorites_count} favs
            </span>
          </div>

          <Separator />

          {/* Condition & Shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Condição</p>
              <p className="text-sm font-medium mt-1">
                {conditionLabels[listing.condition] || listing.condition}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Envio</p>
              <p className="text-sm font-medium mt-1 flex items-center gap-1">
                {listing.shipping_mode === "bravenza" ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    Via Bravenza
                  </>
                ) : (
                  <>
                    <Truck className="h-3 w-3" />
                    Direto
                  </>
                )}
              </p>
            </div>
          </div>

          {listing.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Descrição</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            </>
          )}

          {/* Seller Info */}
          {listing.seller && (
            <>
              <Separator />
              <div
                className={cn("flex items-center justify-between", !isOwnListing && "cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-lg transition-colors")}
                onClick={() => !isOwnListing && listing.seller && onViewSellerProfile?.(listing.seller.id)}
              >
                <div>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {listing.seller.member.client_name}
                    {!isOwnListing && <User className="h-3 w-3 text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listing.seller.total_sales_count} venda{listing.seller.total_sales_count !== 1 ? "s" : ""} no marketplace
                    {listing.seller.average_rating && (
                      <span className="inline-flex items-center gap-0.5 ml-2">
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        {listing.seller.average_rating.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {listing.seller.member.tier === "elite"
                    ? "Vault Black"
                    : listing.seller.member.tier === "collector"
                    ? "Vault Privilege"
                    : "Vault Access"}
                </Badge>
              </div>
            </>
          )}

          {/* Protection info */}
          {!isOwnListing && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
              <p>🔒 <strong>Compra protegida:</strong> 7 dias úteis após entrega para reportar problemas.</p>
              <p>📦 O vendedor só recebe após o período de proteção.</p>
            </div>
          )}

          {/* Action */}
          {!isOwnListing && (
            <div className="flex gap-2">
              <Button
                className="flex-1 btn-gold gap-2"
                size="lg"
                onClick={() => onBuy?.(listing)}
              >
                <ShoppingCart className="h-4 w-4" />
                Comprar R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
