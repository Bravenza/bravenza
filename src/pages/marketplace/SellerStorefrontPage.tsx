import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ShieldCheck, Star, Users, MapPin, Calendar, ShoppingBag, Package, Sparkles, Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { useClientSession } from "@/hooks/useClientSession";
import { FollowSellerButton } from "@/components/marketplace/FollowSellerButton";
import { SellerTierBadge } from "@/components/marketplace/SellerTierBadge";
import { SellerReputationBadges } from "@/components/marketplace/SellerReputationBadges";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef } from "react";

export default function SellerStorefrontPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const cpf = profile?.cpf || "visitor";
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 400], [0, 120]);
  const bannerScale = useTransform(scrollY, [0, 400], [1, 1.15]);
  const overlayOpacity = useTransform(scrollY, [0, 300], [0.3, 0.8]);

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

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="flex gap-4 items-end -mt-14 relative z-10 px-4">
          <Skeleton className="h-28 w-28 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Vendedor não encontrado</h2>
        <Button variant="outline" onClick={() => navigate("/app")}>Voltar ao marketplace</Button>
      </div>
    );
  }

  const memberSince = seller.member?.created_at
    ? format(parseISO(seller.member.created_at), "MMM yyyy", { locale: ptBR })
    : null;

  const initials = (seller.member?.client_name || "V").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="pb-20 md:pb-0">
      <Helmet>
        <title>{seller.member?.client_name || "Vendedor"} | Marketplace BRAVENZA</title>
      </Helmet>

      {/* Immersive Banner with Parallax */}
      <div ref={heroRef} className="relative h-56 md:h-72 overflow-hidden">
        <motion.div
          style={{ y: bannerY, scale: bannerScale }}
          className="absolute inset-0"
        >
          {seller.storefront_banner ? (
            <img src={seller.storefront_banner} alt="Banner da loja" className="w-full h-full object-cover" fetchPriority="high" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card to-background">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.15),_transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.1),_transparent_60%)]" />
            </div>
          )}
        </motion.div>
        <motion.div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
        />
        
        {/* Floating back button */}
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/app")}
            className="gap-1.5 backdrop-blur-xl bg-background/30 border border-white/10 text-foreground hover:bg-background/50 rounded-xl shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Decorative sparkles */}
        <div className="absolute top-6 right-6 z-10 hidden md:block">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-6 w-6 text-primary/30" />
          </motion.div>
        </div>
      </div>

      {/* Profile Section - Glassmorphism */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-5 items-start md:items-end">
          {/* Avatar with glow ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 blur-sm" />
            <div className="relative w-28 h-28 rounded-2xl bg-card border-4 border-background shadow-2xl flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
              {seller.avatar_url ? (
                <img src={seller.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">{initials}</span>
              )}
            </div>
            {seller.verified_badge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1.5 shadow-lg shadow-cyan-500/30"
              >
                <ShieldCheck className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-1"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{seller.member?.client_name || "Vendedor"}</h1>
              <SellerTierBadge tier={seller.member?.tier || "member"} />
            </div>
            {seller.storefront_tagline && (
              <p className="text-sm text-primary/80 font-medium mt-1 italic">"{seller.storefront_tagline}"</p>
            )}
            {seller.bio && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">{seller.bio}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-2"
          >
            {cpf !== "visitor" && (
              <FollowSellerButton sellerId={sellerId!} />
            )}
          </motion.div>
        </div>

        {/* Stats — Glassmorphism cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Vendas", value: seller.total_sales_count || 0, icon: ShoppingBag, color: "text-emerald-500", glow: "from-emerald-500/10 to-transparent" },
            { label: "Avaliação", value: seller.average_rating ? `${seller.average_rating.toFixed(1)}` : "—", icon: Star, color: "text-yellow-500", glow: "from-yellow-500/10 to-transparent", suffix: seller.average_rating ? " ⭐" : "" },
            { label: "Seguidores", value: seller.followers_count || 0, icon: Users, color: "text-blue-500", glow: "from-blue-500/10 to-transparent" },
            { label: "Membro desde", value: memberSince || "—", icon: Calendar, color: "text-primary", glow: "from-primary/10 to-transparent" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <Card className="relative overflow-hidden border-border/20 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="p-4 text-center relative">
                  <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                  <p className="text-xl font-black tracking-tight">{stat.value}{stat.suffix || ""}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Reputation Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <SellerReputationBadges
            totalSales={seller.total_sales_count || 0}
            averageRating={seller.average_rating}
            verifiedBadge={seller.verified_badge}
            className="mt-5"
          />
        </motion.div>

        <Separator className="my-8 opacity-30" />

        {/* Collections — Premium cards */}
        {seller.collections?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Coleções
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seller.collections.map((col: any, i: number) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <Card className="overflow-hidden border-border/20 bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer group">
                    {col.cover_image && (
                      <div className="h-36 bg-muted relative overflow-hidden">
                        <img src={col.cover_image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                      </div>
                    )}
                    <CardContent className="p-4 relative">
                      <h3 className="font-bold text-base">{col.name}</h3>
                      {col.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{col.description}</p>}
                      <Badge variant="outline" className="mt-2 text-[10px]">{col.listing_ids?.length || 0} itens</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Listings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Anúncios ativos
            <Badge variant="outline" className="text-[10px] ml-1">{seller.listings?.length || 0}</Badge>
          </h2>

          {seller.listings?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {seller.listings.map((listing: any, i: number) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 + i * 0.04 }}
                  onClick={() => navigate(`/marketplace/${listing.slug || listing.id}`)}
                  className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/20 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group"
                >
                  <div className="aspect-[4/3] bg-white relative overflow-hidden">
                    {listing.photos?.[0] ? (
                      <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {listing.condition === "novo" && (
                      <Badge className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] border-0 backdrop-blur-sm">Novo</Badge>
                    )}
                  </div>
                  <div className="p-3.5">
                    <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{listing.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Tam. {listing.size}</p>
                    <p className="text-sm font-black text-primary mt-1.5">{fmt(listing.price)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-border/20 bg-card/50">
              <CardContent className="py-12 text-center">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum anúncio ativo no momento</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Recent Reviews */}
        {seller.recent_reviews?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-10"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Avaliações recentes
            </h2>
            <div className="space-y-3">
              {seller.recent_reviews.map((review: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + i * 0.08 }}
                >
                  <Card className="border-border/20 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(review.buyer_name || "C").charAt(0)}
                        </div>
                        <span className="text-sm font-semibold">{review.buyer_name || "Comprador"}</span>
                        <div className="flex gap-0.5 ml-auto">
                          {Array.from({ length: review.buyer_rating || 0 }).map((_, s) => (
                            <Star key={s} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      {review.buyer_review && (
                        <p className="text-xs text-muted-foreground leading-relaxed pl-9">"{review.buyer_review}"</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
