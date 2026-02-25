import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useSearchParams, useNavigate, useOutletContext } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Search, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CatalogGridSkeleton } from "@/components/skeletons/MarketplaceSkeleton";

import { useMarketplaceCatalog, type CatalogProduct } from "@/hooks/useMarketplaceCatalog";
import { useMarketplaceSeller } from "@/hooks/marketplace";
import { CatalogProductCard } from "@/components/client/vault/marketplace/CatalogProductCard";
import { MarketplaceFilters, type MarketplaceFilterValues } from "@/components/client/vault/marketplace/MarketplaceFilters";
import { BrandLogo, popularBrands } from "@/components/marketplace/home/BrandLogos";
import { LazySection } from "@/components/home/LazySection";
import { SavedSearchesWidget } from "@/components/marketplace/SavedSearchesWidget";

// Lazy load below-fold sections
const SecuritySection = lazy(() => import("@/components/marketplace/home/SecuritySection").then(m => ({ default: m.SecuritySection })));
const RecentlyViewedSection = lazy(() => import("@/components/marketplace/home/RecentlyViewedSection").then(m => ({ default: m.RecentlyViewedSection })));
const BestSellersSection = lazy(() => import("@/components/marketplace/home/BestSellersSection").then(m => ({ default: m.BestSellersSection })));
const BrandSpotlightSection = lazy(() => import("@/components/marketplace/home/BrandSpotlightSection").then(m => ({ default: m.BrandSpotlightSection })));
const RecentlyAddedSection = lazy(() => import("@/components/marketplace/home/RecentlyAddedSection").then(m => ({ default: m.RecentlyAddedSection })));
const SellCTASection = lazy(() => import("@/components/marketplace/home/SellCTASection").then(m => ({ default: m.SellCTASection })));

const DropsCountdownSection = lazy(() => import("@/components/marketplace/home/DropsCountdownSection").then(m => ({ default: m.DropsCountdownSection })));
const UpcomingReleasesSection = lazy(() => import("@/components/marketplace/home/UpcomingReleasesSection").then(m => ({ default: m.UpcomingReleasesSection })));
const SellerLeaderboard = lazy(() => import("@/components/marketplace/SellerLeaderboard").then(m => ({ default: m.SellerLeaderboard })));

export default function MarketplaceHomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const cpf = context?.cpf || "visitor";

  const { products, totalProducts, isLoading, fetchProducts } = useMarketplaceCatalog(cpf);
  const { checkOnboardingStatus } = useMarketplaceSeller(cpf !== "visitor" ? cpf : null);
  const [isSeller, setIsSeller] = useState(false);
  const brandsScrollRef = useRef<HTMLDivElement>(null);

  const initialSearch = searchParams.get("q") || "";
  const [filters, setFilters] = useState<MarketplaceFilterValues>({ sort: "recent", search: initialSearch || undefined });
  const [showFullCatalog, setShowFullCatalog] = useState(!!initialSearch);

  useEffect(() => {
    fetchProducts({ search: initialSearch || undefined });
  }, [initialSearch]);

  useEffect(() => {
    if (cpf && cpf !== "visitor") {
      checkOnboardingStatus().then((res) => {
        if (res?.onboarded) setIsSeller(true);
      });
    }
  }, [cpf, checkOnboardingStatus]);

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

        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <MarketplaceFilters filters={filters} onFiltersChange={setFilters} onSearch={handleSearch} />
          <SavedSearchesWidget
            cpf={cpf}
            currentFilters={filters}
            onApplySearch={(savedFilters) => {
              setFilters(savedFilters as any);
              fetchProducts(savedFilters);
            }}
          />
        </div>

        {!isLoading && (
          <p className="text-xs text-muted-foreground mt-4 mb-2">
            {totalProducts} modelo{totalProducts !== 1 ? "s" : ""} encontrado{totalProducts !== 1 ? "s" : ""}
          </p>
        )}

        {isLoading ? (
          <CatalogGridSkeleton count={10} />
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum modelo encontrado</h3>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-2">
            {products.map((product) => (
              <CatalogProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-12">
      <Helmet>
        <title>Marketplace | BRAVENZA — Sneakers Autenticados</title>
        <meta name="description" content="Compre e venda sneakers autenticados no Marketplace BRAVENZA. Cada par é inspecionado e certificado. De colecionador para colecionador." />
        <link rel="canonical" href="https://bravenza.com.br/marketplace" />
      </Helmet>
      <section className="relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Curadoria blindada</span>
              </motion.div>

              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 leading-[0.88]">
                Aqui, <span className="text-gradient-gold">falsificação</span>
                <br className="hidden md:block" />
                {" "}não sobrevive.
              </h1>

              <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                O marketplace onde <strong className="text-foreground">cada par é inspecionado, certificado e garantido</strong> pela Bravenza antes de chegar até você. <strong className="text-foreground">De colecionador para colecionador.</strong>
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onSubmit={(e) => {
                e.preventDefault();
                const val = (e.currentTarget.elements.namedItem("heroSearch") as HTMLInputElement).value.trim();
                if (val) navigate(`/app?q=${encodeURIComponent(val)}`);
              }}
              className="flex gap-2 max-w-lg mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  name="heroSearch"
                  placeholder="Nike Dunk, Jordan 1, Yeezy..."
                  className="pl-12 h-14 rounded-full bg-card/90 backdrop-blur-sm border-border/40 text-base shadow-lg shadow-primary/5 focus:shadow-xl focus:shadow-primary/10 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>
              <Button type="submit" size="lg" className="btn-gold rounded-full h-14 px-8 text-base font-bold shadow-lg shadow-primary/20">
                Buscar
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* ===== BRANDS BAR ===== */}
      <section className="py-6 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight font-display">Em alta</h2>
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
            <CatalogGridSkeleton count={5} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product) => (
                <CatalogProductCard key={product.id} product={product} hidePrice />
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

      {/* ===== UPCOMING RELEASES ===== */}
      <LazySection minHeight="300px">
        <Suspense fallback={<div className="h-[300px]" />}>
          <UpcomingReleasesSection />
        </Suspense>
      </LazySection>

      {/* ===== BEST SELLERS ===== */}
      <LazySection minHeight="400px">
        <Suspense fallback={<div className="h-[400px]" />}>
          <BestSellersSection products={products} />
        </Suspense>
      </LazySection>

      {/* ===== SECURITY & AUTHENTICITY ===== */}
      <LazySection minHeight="300px">
        <Suspense fallback={<div className="h-[300px]" />}>
          <SecuritySection />
        </Suspense>
      </LazySection>

      {/* ===== RECENTLY VIEWED ===== */}
      <LazySection minHeight="200px">
        <Suspense fallback={<div className="h-[200px]" />}>
          <RecentlyViewedSection />
        </Suspense>
      </LazySection>

      {/* ===== SELL CTA (hidden for sellers) ===== */}
      {!isSeller && (
        <LazySection minHeight="300px">
          <Suspense fallback={<div className="h-[300px]" />}>
            <SellCTASection />
          </Suspense>
        </LazySection>
      )}

      {/* ===== BRAND SPOTLIGHTS ===== */}
      <LazySection minHeight="400px">
        <Suspense fallback={<div className="h-[400px]" />}>
          <BrandSpotlightSection products={products} insertAfterIndex={0}>
            <RecentlyAddedSection products={products} />
          </BrandSpotlightSection>
        </Suspense>
      </LazySection>

      {/* ===== DROPS COUNTDOWN ===== */}
      <LazySection minHeight="200px">
        <Suspense fallback={<div className="h-[200px]" />}>
          <DropsCountdownSection />
        </Suspense>
      </LazySection>

      {/* ===== SELLER LEADERBOARD ===== */}
      <LazySection minHeight="300px">
        <Suspense fallback={<div className="h-[300px]" />}>
          <SellerLeaderboard />
        </Suspense>
      </LazySection>

    </div>
  );
}
