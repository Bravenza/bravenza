import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface MarketplaceFilterValues {
  search?: string;
  brand?: string;
  size?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  sort: string;
  favoritesOnly?: boolean;
  modality?: string;
  trustedOnly?: boolean;
}

const conditionOptions = [
  { value: "novo", label: "Novo", color: "bg-emerald-400" },
  { value: "usado_excelente", label: "Excelente", color: "bg-sky-400" },
  { value: "usado_bom", label: "Bom", color: "bg-amber-400" },
  { value: "usado_regular", label: "Regular", color: "bg-zinc-400" },
];

const sizeOptions = Array.from({ length: 16 }, (_, i) => String(34 + i));

const popularBrands = [
  "Nike", "Jordan", "adidas", "New Balance", "Yeezy", "Asics", "Puma",
  "Reebok", "Converse", "Vans",
];

interface MarketplaceFiltersProps {
  filters: MarketplaceFilterValues;
  onFiltersChange: (filters: MarketplaceFilterValues) => void;
  onSearch: () => void;
}

export function MarketplaceFilters({ filters, onFiltersChange, onSearch }: MarketplaceFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([filters.priceMin || 0, filters.priceMax || 5000]);

  const activeFilterCount = [
    filters.condition,
    filters.size,
    filters.brand,
    filters.priceMin,
    filters.priceMax,
    filters.favoritesOnly,
    filters.modality,
    filters.trustedOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({ sort: filters.sort, search: filters.search });
    setPriceRange([0, 5000]);
  };

  const applyFilters = () => {
    onFiltersChange({
      ...filters,
      priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      priceMax: priceRange[1] < 5000 ? priceRange[1] : undefined,
    });
    setFiltersOpen(false);
    onSearch();
  };

  return (
    <div className="space-y-3">
      {/* Search + Filter + Sort row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca, modelo, cor..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-9 bg-[hsl(0,0%,16%)] border-border/50 h-10"
          />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 relative h-10 bg-[hsl(0,0%,16%)] border-border/50">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg">Filtros</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Brand - Visual pills */}
              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">Marca</label>
                <div className="flex flex-wrap gap-2">
                  {popularBrands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => onFiltersChange({
                        ...filters,
                        brand: filters.brand === brand ? undefined : brand,
                      })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                        filters.brand === brand
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-[hsl(0,0%,18%)] text-muted-foreground border-border/50 hover:border-primary/40"
                      )}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Condition - Visual cards */}
              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">Condição</label>
                <div className="grid grid-cols-2 gap-2">
                  {conditionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({
                        ...filters,
                        condition: filters.condition === opt.value ? undefined : opt.value,
                      })}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg text-sm border transition-all duration-200",
                        filters.condition === opt.value
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-[hsl(0,0%,16%)] border-border/30 text-muted-foreground hover:border-primary/20"
                      )}
                    >
                      <span className={cn("w-3 h-3 rounded-full flex-shrink-0", opt.color)} />
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Size - Grid of clickable sizes */}
              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">Tamanho</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onFiltersChange({
                        ...filters,
                        size: filters.size === s ? undefined : s,
                      })}
                      className={cn(
                        "h-10 rounded-lg text-sm font-medium border transition-all duration-200",
                        filters.size === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-[hsl(0,0%,16%)] text-muted-foreground border-border/30 hover:border-primary/30"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-1 block text-foreground">Faixa de preço</label>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>R$ {priceRange[0].toLocaleString("pt-BR")}</span>
                  <span>R$ {priceRange[1].toLocaleString("pt-BR")}</span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={5000}
                  step={50}
                />
              </div>

              <Separator className="bg-border/30" />

              {/* Modality */}
              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">Modalidade de envio</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "direct", label: "Envio Direto" },
                    { value: "pro", label: "PRO Hub" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onFiltersChange({
                        ...filters,
                        modality: filters.modality === opt.value ? undefined : opt.value,
                      })}
                      className={cn(
                        "p-3 rounded-lg text-sm border transition-all duration-200 font-medium",
                        filters.modality === opt.value
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-[hsl(0,0%,16%)] border-border/30 text-muted-foreground hover:border-primary/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Trusted seller */}
              <div>
                <button
                  onClick={() => onFiltersChange({ ...filters, trustedOnly: !filters.trustedOnly })}
                  className={cn(
                    "w-full p-3 rounded-lg text-sm border transition-all duration-200 flex items-center justify-between",
                    filters.trustedOnly
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "bg-[hsl(0,0%,16%)] border-border/30 text-muted-foreground hover:border-primary/20"
                  )}
                >
                  <span className="font-medium">Apenas vendedores confiáveis</span>
                  <Badge variant={filters.trustedOnly ? "default" : "outline"} className="text-[10px]">
                    Ouro / Elite
                  </Badge>
                </button>
              </div>

              <Separator className="bg-border/30" />

              {/* Sort */}
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Ordenar por</label>
                <Select value={filters.sort} onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}>
                  <SelectTrigger className="bg-[hsl(0,0%,16%)] border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="price_asc">Menor preço</SelectItem>
                    <SelectItem value="price_desc">Maior preço</SelectItem>
                    <SelectItem value="popular">Mais populares</SelectItem>
                    <SelectItem value="best_seller">Melhor vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 sticky bottom-0 bg-card pb-2">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
                <Button className="flex-1 btn-gold" onClick={applyFilters}>
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Sort - Desktop inline */}
        <Select value={filters.sort} onValueChange={(v) => { onFiltersChange({ ...filters, sort: v }); onSearch(); }}>
          <SelectTrigger className="w-[140px] hidden sm:flex bg-[hsl(0,0%,16%)] border-border/50 h-10">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recentes</SelectItem>
            <SelectItem value="price_asc">Menor preço</SelectItem>
            <SelectItem value="price_desc">Maior preço</SelectItem>
            <SelectItem value="popular">Populares</SelectItem>
          </SelectContent>
        </Select>

        {/* Favorites toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 flex-shrink-0 border-border/50",
            filters.favoritesOnly
              ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
              : "bg-[hsl(0,0%,16%)] hover:border-primary/40"
          )}
          onClick={() => {
            onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly });
            setTimeout(onSearch, 0);
          }}
          title="Meus favoritos"
        >
          <Heart className={cn("h-4 w-4", filters.favoritesOnly && "fill-red-400")} />
        </Button>
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            {filters.brand && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => { onFiltersChange({ ...filters, brand: undefined }); onSearch(); }}
              >
                {filters.brand}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.condition && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => { onFiltersChange({ ...filters, condition: undefined }); onSearch(); }}
              >
                {conditionOptions.find(c => c.value === filters.condition)?.label}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.size && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => { onFiltersChange({ ...filters, size: undefined }); onSearch(); }}
              >
                Tam. {filters.size}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.priceMin && (
              <Badge variant="secondary" className="text-xs">
                Min R$ {filters.priceMin}
              </Badge>
            )}
            {filters.priceMax && (
              <Badge variant="secondary" className="text-xs">
                Max R$ {filters.priceMax}
              </Badge>
            )}
            {filters.favoritesOnly && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => { onFiltersChange({ ...filters, favoritesOnly: undefined }); onSearch(); }}
              >
                <Heart className="h-3 w-3 fill-red-400 text-red-400" />
                Favoritos
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.modality && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => { onFiltersChange({ ...filters, modality: undefined }); onSearch(); }}
              >
                {filters.modality === "pro" ? "PRO Hub" : "Direto"}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.trustedOnly && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => { onFiltersChange({ ...filters, trustedOnly: undefined }); onSearch(); }}
              >
                Confiáveis
                <X className="h-3 w-3" />
              </Badge>
            )}
            <button
              onClick={() => { clearFilters(); onSearch(); }}
              className="text-[11px] text-destructive hover:underline"
            >
              Limpar tudo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
