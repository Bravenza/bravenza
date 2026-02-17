import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMarketplaceCatalog, type CatalogProduct } from "@/hooks/useMarketplaceCatalog";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { MarketplaceFilters, type MarketplaceFilterValues } from "@/components/client/vault/marketplace/MarketplaceFilters";
import { BrandLogo, popularBrands } from "@/components/marketplace/home/BrandLogos";
import { SecuritySection } from "@/components/marketplace/home/SecuritySection";
import { RecentlyViewedSection } from "@/components/marketplace/home/RecentlyViewedSection";
import { BestSellersSection } from "@/components/marketplace/home/BestSellersSection";
import { BrandSpotlightSection } from "@/components/marketplace/home/BrandSpotlightSection";
import { RecentlyAddedSection } from "@/components/marketplace/home/RecentlyAddedSection";

const categories = [
  { id: "sneakers", label: "Sneakers", icon: "👟", color: "from-amber-500/20 to-orange-500/20" },
  { id: "running", label: "Running", icon: "🏃", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "basketball", label: "Basketball", icon: "🏀", color: "from-red-500/20 to-orange-500/20" },
  { id: "lifestyle", label: "Lifestyle", icon: "🌆", color: "from-purple-500/20 to-pink-500/20" },
  { id: "skateboard", label: "Skate", icon: "🛹", color: "from-emerald-500/20 to-teal-500/20" },
  { id: "collab", label: "Collabs", icon: "🤝", color: "from-yellow-500/20 to-amber-500/20" },
];

export default function MarketplaceHomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const cpf = context?.cpf || "visitor";

  const { products, totalProducts, isLoading, fetchProducts } = useMarketplaceCatalog(cpf);
  const brandsScrollRef = useRef<HTMLDivElement>(null);

  const initialSearch = searchParams.get("q") || "";
  const [filters, setFilters] = useState<MarketplaceFilterValues>({ sort: "recent", search: initialSearch || undefined });
  const [showFullCatalog, setShowFullCatalog] = useState(!!initialSearch);

  useEffect(() => {
    fetchProducts({ search: initialSearch || undefined });
  }, [initialSearch]);

  const handleSearch = () => {
    setShowFullCatalog(true);
    fetchProducts({
      search: filters.search,
      brand: filters.brand,
      category: filters.condition,
    });
  };

  const handleBrandClick = (brand: string) => {
    setFilters(f => ({ ...f, brand, search: undefined }));
    setShowFullCatalog(true);
    fetchProducts({ brand });
  };

  const handleCategoryClick = (cat: string) => {
    setShowFullCatalog(true);
    fetchProducts({ category: cat });
  };

  const scrollBrands = (dir: "left" | "right") => {
    brandsScrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  // Full catalog / search results view
  if (showFullCatalog || initialSearch) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 pb-28 md:pb-12">
        {!initialSearch && (
          <button
            onClick={() => setShowFullCatalog(false)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
        )}

        <MarketplaceFilters filters={filters} onFiltersChange={setFilters} onSearch={handleSearch} />

        {!isLoading && (
          <p className="text-xs text-muted-foreground mt-4 mb-2">
            {totalProducts} modelo{totalProducts !== 1 ? "s" : ""} encontrado{totalProducts !== 1 ? "s" : ""}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum modelo encontrado</h3>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-2">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
              >
                <CatalogProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-12">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-card to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-5 text-xs px-3 py-1 border-primary/30 text-primary">
                <ShieldCheck className="h-3 w-3 mr-1" />
                100% verificado
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-display">
                Compre sneakers com{" "}
                <span className="text-gradient-gold">confiança total</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
                Marketplace exclusivo entre colecionadores. Cada peça inspecionada, cada transação protegida.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onSubmit={(e) => {
                e.preventDefault();
                const val = (e.currentTarget.elements.namedItem("heroSearch") as HTMLInputElement).value.trim();
                if (val) navigate(`/marketplace?q=${encodeURIComponent(val)}`);
              }}
              className="flex gap-2 max-w-md mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="heroSearch"
                  placeholder="Nike Dunk, Jordan 1, Yeezy..."
                  className="pl-11 h-12 rounded-full bg-card border-border/40 text-base shadow-sm focus:shadow-md focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
              <Button type="submit" size="lg" className="btn-gold rounded-full h-12 px-6">
                Buscar
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-2 min-w-[80px] group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br border border-border/30 group-hover:border-primary/30 group-hover:shadow-md transition-all duration-300",
                  cat.color
                )}>
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BRANDS BAR (text logos) ===== */}
      <section className="py-6 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-foreground">Marcas populares</h3>
            <div className="flex-1" />
            <button onClick={() => scrollBrands("left")} className="p-1 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scrollBrands("right")} className="p-1 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div ref={brandsScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {popularBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => handleBrandClick(brand)}
                className="flex flex-col items-center justify-center gap-0 min-w-[90px] group"
              >
                <div className="w-[90px] h-14 rounded-xl bg-card border border-border/30 flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-sm transition-all">
                  <BrandLogo name={brand} size="md" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRENDING / EM ALTA ===== */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Em alta</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setShowFullCatalog(true)}
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <CatalogProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          {products.length > 10 && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full gap-2"
                onClick={() => setShowFullCatalog(true)}
              >
                Ver catálogo completo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ===== RECENTLY VIEWED ===== */}
      <RecentlyViewedSection />

      {/* ===== BEST SELLERS ===== */}
      <BestSellersSection products={products} />

      {/* ===== BRAND SPOTLIGHTS ===== */}
      <BrandSpotlightSection products={products} />

      {/* ===== RECENTLY ADDED ===== */}
      <RecentlyAddedSection products={products} />

      {/* ===== SECURITY & AUTHENTICITY ===== */}
      <SecuritySection />
    </div>
  );
}
