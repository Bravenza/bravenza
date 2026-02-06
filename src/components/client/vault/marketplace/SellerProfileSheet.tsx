import { useState, useEffect } from "react";
import { Star, ShieldCheck, Package, TrendingUp, Award } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { MarketplaceListingCard } from "./MarketplaceListingCard";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

interface SellerPublicProfile {
  id: string;
  bio: string | null;
  total_sales_count: number;
  total_sales_value: number;
  average_rating: number | null;
  ratings_count: number;
  current_fee_percent: number;
  member: {
    client_name: string;
    tier: string;
    created_at: string;
  };
  listings: MarketplaceListing[];
  recent_reviews: Array<{
    buyer_name: string;
    buyer_rating: number;
    buyer_review: string | null;
    created_at: string;
  }>;
}

interface SellerProfileSheetProps {
  sellerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectListing: (listing: MarketplaceListing) => void;
  onToggleFavorite: (id: string) => void;
  clientCpf: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-marketplace`;

const tierLabels: Record<string, string> = {
  access: "Vault Access",
  collector: "Vault Privilege",
  elite: "Vault Black",
};

export function SellerProfileSheet({
  sellerId,
  open,
  onOpenChange,
  onSelectListing,
  onToggleFavorite,
  clientCpf,
}: SellerProfileSheetProps) {
  const [profile, setProfile] = useState<SellerPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && sellerId) {
      fetchProfile();
    }
  }, [open, sellerId]);

  const fetchProfile = async () => {
    if (!sellerId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ action: "seller-public-profile", seller_id: sellerId });
      const res = await fetch(`${FUNCTION_URL}?${params}`, {
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": clientCpf,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching seller profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : profile ? (
          <div className="p-6 space-y-6">
            <SheetHeader className="text-left p-0 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                  {profile.member.client_name.charAt(0)}
                </div>
                <div>
                  <SheetTitle className="text-xl">{profile.member.client_name}</SheetTitle>
                  <Badge variant="outline" className="text-xs capitalize mt-1">
                    {tierLabels[profile.member.tier] || profile.member.tier}
                  </Badge>
                </div>
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
              )}
            </SheetHeader>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="card-premium">
                <CardContent className="p-3 text-center">
                  <Package className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{profile.total_sales_count}</p>
                  <p className="text-[10px] text-muted-foreground">Vendas</p>
                </CardContent>
              </Card>
              <Card className="card-premium">
                <CardContent className="p-3 text-center">
                  <Star className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{profile.average_rating?.toFixed(1) || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{profile.ratings_count} avaliações</p>
                </CardContent>
              </Card>
              <Card className="card-premium">
                <CardContent className="p-3 text-center">
                  <Award className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">
                    {profile.total_sales_count >= 11 ? "🏆" : profile.total_sales_count >= 6 ? "🥇" : profile.total_sales_count >= 3 ? "🥈" : "🥉"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {profile.total_sales_count >= 11 ? "Expert" : profile.total_sales_count >= 6 ? "Avançado" : profile.total_sales_count >= 3 ? "Regular" : "Iniciante"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Reviews */}
            {profile.recent_reviews.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-sm mb-3">Avaliações recentes</h3>
                  <div className="space-y-3">
                    {profile.recent_reviews.map((rev, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <Star key={v} className={`h-3 w-3 ${v <= rev.buyer_rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{rev.buyer_name.split(" ")[0]}</span>
                        </div>
                        {rev.buyer_review && (
                          <p className="text-xs text-muted-foreground">{rev.buyer_review}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Active listings */}
            {profile.listings.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-sm mb-3">Anúncios ativos ({profile.listings.length})</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {profile.listings.map((listing) => (
                      <MarketplaceListingCard
                        key={listing.id}
                        listing={listing}
                        onSelect={onSelectListing}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Vendedor não encontrado
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
