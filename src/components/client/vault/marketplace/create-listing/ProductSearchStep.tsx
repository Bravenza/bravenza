import { useState, useEffect, useCallback } from "react";
import { Search, Plus, ShieldCheck, Package, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

interface ProductSearchStepProps {
  onSelectProduct: (product: CatalogProduct) => void;
  onCreateNew: () => void;
  searchProducts: (query: string) => Promise<CatalogProduct[]>;
  vaultItems?: { id: string; title: string; brand: string | null; model: string | null; size: string | null; colorway: string | null }[];
}

export function ProductSearchStep({ onSelectProduct, onCreateNew, searchProducts, vaultItems = [] }: ProductSearchStepProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setHasSearched(false); return; }
    setIsSearching(true);
    const data = await searchProducts(q);
    setResults(data);
    setHasSearched(true);
    setIsSearching(false);
  }, [searchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Buscar produto no catálogo</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pesquise o sneaker que deseja vender ou cadastre um novo
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: Nike Air Jordan 1 Chicago"
          className="pl-9"
          autoFocus
        />
        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {results.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
          >
            {product.images?.[0] ? (
              <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{product.brand} {product.model}</p>
              {product.colorway && (
                <p className="text-xs text-muted-foreground">{product.colorway}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                {product.total_offers > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {product.total_offers} oferta{product.total_offers !== 1 ? "s" : ""}
                  </Badge>
                )}
                {product.lowest_price && (
                  <span className="text-[10px] text-muted-foreground">
                    a partir de R$ {product.lowest_price.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {hasSearched && results.length === 0 && (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Create new product button */}
      <Button variant="outline" onClick={onCreateNew} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Cadastrar novo produto
      </Button>
    </div>
  );
}
