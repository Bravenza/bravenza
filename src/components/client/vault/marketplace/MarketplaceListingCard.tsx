import { Heart, Eye, ShieldCheck, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

const conditionLabels: Record<string, string> = {
  novo: "Novo",
  usado_excelente: "Usado - Excelente",
  usado_bom: "Usado - Bom",
  usado_regular: "Usado - Regular",
};

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onSelect: (listing: MarketplaceListing) => void;
  onToggleFavorite: (id: string) => void;
}

export function MarketplaceListingCard({
  listing,
  onSelect,
  onToggleFavorite,
}: MarketplaceListingCardProps) {
  const mainPhoto = listing.photos?.[0];

  return (
    <Card
      className="group card-premium overflow-hidden cursor-pointer hover:border-primary/40 transition-all"
      onClick={() => onSelect(listing)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="h-10 w-10 opacity-30" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.is_vault_certified && (
            <Badge className="bg-primary text-primary-foreground text-xs gap-1">
              <ShieldCheck className="h-3 w-3" />
              Vault ID
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {conditionLabels[listing.condition] || listing.condition}
          </Badge>
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-background/60 backdrop-blur-sm hover:bg-background/80"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(listing.id);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              listing.is_favorited
                ? "fill-red-500 text-red-500"
                : "text-foreground"
            )}
          />
        </Button>
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
        {listing.brand && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {listing.brand} {listing.model ? `· ${listing.model}` : ""}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-lg font-bold">
            R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          {listing.size && (
            <Badge variant="outline" className="text-xs">
              Tam. {listing.size}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {listing.views_count}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {listing.favorites_count}
          </span>
          {listing.seller?.member && (
            <span className="ml-auto truncate max-w-[100px]">
              {listing.seller.member.client_name.split(" ")[0]}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
