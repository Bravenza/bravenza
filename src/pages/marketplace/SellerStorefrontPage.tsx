import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Star, Users, MapPin, Calendar, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { useClientSession } from "@/hooks/useClientSession";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { FollowSellerButton } from "@/components/marketplace/FollowSellerButton";
import { SellerTierBadge } from "@/components/marketplace/SellerTierBadge";
import { SellerReputationBadges } from "@/components/marketplace/SellerReputationBadges";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SellerStorefrontPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf || "visitor";
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const fetch = async () => {
      try {
        const res = await marketplaceRequest(cpf || "visitor", "seller-public-profile", "GET", undefined, {
          seller_id: sellerId,
        });
        setSeller(res);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [sellerId, cpf]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Vendedor não encontrado</h2>
        <Button variant="outline" onClick={() => navigate("/marketplace")}>Voltar ao marketplace</Button>
      </div>
    );
  }

  const memberSince = seller.member?.created_at
    ? format(parseISO(seller.member.created_at), "MMM yyyy", { locale: ptBR })
    : null;

  return (
    <div className="pb-20">
      <Helmet>
        <title>{seller.member?.client_name || "Vendedor"} | Marketplace BRAVENZA</title>
      </Helmet>

      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/10 via-card to-background overflow-hidden">
        {seller.storefront_banner && (
          <img src={seller.storefront_banner} alt="Banner" className="w-full h-full object-cover absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 backdrop-blur-sm bg-background/50">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-lg flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
            {seller.avatar_url ? (
              <img src={seller.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (seller.member?.client_name || "V").charAt(0)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight">{seller.member?.client_name || "Vendedor"}</h1>
              {seller.verified_badge && <ShieldCheck className="h-5 w-5 text-cyan-400" />}
              <SellerTierBadge tier={seller.member?.tier || "member"} />
            </div>
            {seller.storefront_tagline && (
              <p className="text-sm text-muted-foreground mt-1">{seller.storefront_tagline}</p>
            )}
            {seller.bio && (
              <p className="text-sm text-muted-foreground mt-1">{seller.bio}</p>
            )}
          </div>
          <div className="flex gap-2">
            {cpf !== "visitor" && (
              <FollowSellerButton sellerId={sellerId!} />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Vendas", value: seller.total_sales_count || 0, icon: ShoppingBag },
            { label: "Avaliação", value: seller.average_rating ? `${seller.average_rating.toFixed(1)} ⭐` : "—", icon: Star },
            { label: "Seguidores", value: seller.followers_count || 0, icon: Users },
            { label: "Membro desde", value: memberSince || "—", icon: Calendar },
          ].map(stat => (
            <Card key={stat.label} className="card-premium">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reputation Badges */}
        <SellerReputationBadges
          totalSales={seller.total_sales_count || 0}
          averageRating={seller.average_rating}
          verifiedBadge={seller.verified_badge}
          className="mt-4"
        />

        <Separator className="my-6" />

        {/* Collections */}
        {seller.collections?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Coleções</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seller.collections.map((col: any) => (
                <Card key={col.id} className="card-premium overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  {col.cover_image && (
                    <div className="h-32 bg-muted">
                      <img src={col.cover_image} alt={col.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-bold">{col.name}</h3>
                    {col.description && <p className="text-xs text-muted-foreground mt-1">{col.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-2">{col.listing_ids?.length || 0} itens</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Listings */}
        <h2 className="text-lg font-bold mb-4">Anúncios ativos ({seller.listings?.length || 0})</h2>
        {seller.listings?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {seller.listings.map((listing: any) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/marketplace/${listing.slug || listing.id}`)}
                className="bg-card rounded-xl border border-border/20 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="aspect-square bg-muted/10">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold truncate">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">Tam. {listing.size}</p>
                  <p className="text-sm font-bold text-primary mt-1">{fmt(listing.price)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum anúncio ativo</p>
        )}

        {/* Recent Reviews */}
        {seller.recent_reviews?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4">Avaliações recentes</h2>
            <div className="space-y-3">
              {seller.recent_reviews.map((review: any, i: number) => (
                <Card key={i} className="card-premium">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{review.buyer_name || "Comprador"}</span>
                      <span className="text-xs text-primary">{"⭐".repeat(review.buyer_rating || 0)}</span>
                    </div>
                    {review.buyer_review && <p className="text-xs text-muted-foreground">{review.buyer_review}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
