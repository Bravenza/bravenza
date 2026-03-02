import { useEffect, useState } from "react";
import { Heart, Search } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { FavoritesGridSkeleton } from "@/components/skeletons/ContentAwareSkeletons";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { useMarketplaceListings } from "@/hooks/marketplace/useMarketplaceListings";
import { useConfig } from "@/hooks/useConfig";
import { FavoritesV2 } from "@/components/marketplace/FavoritesV2";
import type { MarketplaceListing } from "@/hooks/marketplace/types";

/**
 * MarketplaceFavoritesPage — Feature-flagged.
 * When enable_favorites_lists is ON → renders FavoritesV2 (enhanced UX + lists)
 * When OFF → renders the original v1 layout (unchanged)
 */
export default function MarketplaceFavoritesPage() {
  const { cpf } = useOutletContext<{ cpf: string | null }>();
  const { isEnabled } = useConfig();

  // Always render v2 — it handles the lists flag internally
  // The v2 component works with or without the lists feature
  if (cpf) {
    return <FavoritesV2 cpf={cpf} />;
  }

  // Fallback: no CPF (should not happen behind auth)
  return <MarketplaceFavoritesPageV1 />;
}

/** Original v1 favorites page — preserved as fallback */
function MarketplaceFavoritesPageV1() {
  const { cpf } = useOutletContext<{ cpf: string | null }>();
  const { listings, isLoading, fetchListings, toggleFavorite } = useMarketplaceListings(cpf);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (cpf) {
      fetchListings({ favoritesOnly: true });
    }
  }, [cpf]);

  const filtered = search
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.brand?.toLowerCase().includes(search.toLowerCase()) ||
          l.model?.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  const handleUnfavorite = async (listingId: string) => {
    await toggleFavorite(listingId);
    fetchListings({ favoritesOnly: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <h1 className="text-2xl font-bold">Meus Favoritos</h1>
        <span className="text-sm text-muted-foreground">({listings.length})</span>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar nos favoritos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-full"
        />
      </div>

      {isLoading ? (
        <FavoritesGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={search ? "Nenhum favorito encontrado" : "Você ainda não tem favoritos"}
          description={search
            ? "Tente outra busca"
            : "Explore o marketplace e favorite os sneakers que mais gostar"}
          action={!search ? { label: "Explorar marketplace", onClick: () => navigate("/app") } : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <CatalogProductCard
                product={{
                  id: listing.id,
                  brand: listing.brand || "",
                  model: listing.title,
                  colorway: listing.colorway || null,
                  sku: null,
                  release_date: null,
                  retail_price: null,
                  description: listing.description || null,
                  images: listing.photos,
                  lowest_price: listing.price,
                  total_offers: 1,
                  slug: listing.id,
                  category: "",
                  is_high_risk: false,
                  created_at: listing.created_at,
                }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
