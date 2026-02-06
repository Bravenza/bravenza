import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
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

export interface MarketplaceFilterValues {
  search?: string;
  brand?: string;
  size?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  sort: string;
}

const conditionOptions = [
  { value: "novo", label: "Novo" },
  { value: "usado_excelente", label: "Usado - Excelente" },
  { value: "usado_bom", label: "Usado - Bom" },
  { value: "usado_regular", label: "Usado - Regular" },
];

const sizeOptions = Array.from({ length: 16 }, (_, i) => String(34 + i));

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
    filters.priceMin,
    filters.priceMax,
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
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por marca, modelo, cor..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="pl-9"
        />
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Condition */}
            <div>
              <label className="text-sm font-medium mb-2 block">Condição</label>
              <Select
                value={filters.condition || "all"}
                onValueChange={(v) => onFiltersChange({ ...filters, condition: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {conditionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tamanho</label>
              <Select
                value={filters.size || "all"}
                onValueChange={(v) => onFiltersChange({ ...filters, size: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sizeOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Faixa de preço: R$ {priceRange[0]} - R$ {priceRange[1]}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={5000}
                step={50}
                className="mt-4"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar</label>
              <Select value={filters.sort} onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
              <Button className="flex-1 btn-gold" onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
