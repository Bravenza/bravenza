import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Heart, Search, SlidersHorizontal, Check, X, Trash2,
  FolderOpen, ArrowUpDown, Eye, EyeOff, Plus, MoreHorizontal,
  Pencil, ChevronDown, Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FavoritesGridSkeleton } from "@/components/skeletons/ContentAwareSkeletons";
import { useMarketplaceListings } from "@/hooks/marketplace/useMarketplaceListings";
import { useFavoriteLists } from "@/hooks/marketplace/useFavoriteLists";
import { useConfig } from "@/hooks/useConfig";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { optimizeImageUrl } from "@/lib/image-utils";
import { formatProductName } from "@/lib/text-utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import type { MarketplaceListing } from "@/hooks/marketplace/types";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type SortKey = "recent" | "price_asc" | "price_desc" | "discount";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  discount: "Maior desconto",
};

const CONDITION_LABELS: Record<string, string> = {
  deadstock: "Deadstock",
  novo: "Novo",
  usado: "Usado",
};

// ─── FavoriteCard ────────────────────────────────────────────
interface FavoriteCardProps {
  listing: MarketplaceListing;
  selected: boolean;
  selectionMode: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: (id: string) => void;
}

function FavoriteCard({ listing, selected, selectionMode, onSelect, onRemove, onNavigate }: FavoriteCardProps) {
  const isSold = listing.status === "sold" || listing.status === "reserved";
  const name = formatProductName(listing.brand || "", listing.model || listing.title);
  const mainImg = listing.photos?.[0];
  const discount = listing.original_purchase_price && listing.original_purchase_price > listing.price
    ? Math.round((1 - listing.price / listing.original_purchase_price) * 100)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative rounded-2xl overflow-hidden bg-card border transition-all duration-200 flex flex-col",
        isSold ? "opacity-60 border-border/20" : "border-border/30 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1",
        selected && "ring-2 ring-primary border-primary/50"
      )}
    >
      {selectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(listing.id); }}
          className={cn(
            "absolute top-3 left-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-background/80 backdrop-blur-sm",
            selected ? "border-primary bg-primary/20" : "border-border"
          )}
        >
          {selected && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      )}

      {!selectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(listing.id); }}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {isSold && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-muted text-muted-foreground">
            Vendido
          </Badge>
        </div>
      )}

      <div
        className="relative aspect-[4/3] bg-white overflow-hidden cursor-pointer"
        onClick={() => !selectionMode && onNavigate(listing.id)}
      >
        {mainImg ? (
          <OptimizedImage
            src={optimizeImageUrl(mainImg, { width: 400, height: 300, quality: 80, resize: "contain" })}
            alt={name}
            width={400}
            height={300}
            className={cn("w-full h-full object-contain p-4 transition-transform duration-500", !isSold && "group-hover:scale-110")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/10">
            <span className="text-4xl opacity-10">👟</span>
          </div>
        )}

        {discount && discount > 0 && !isSold && (
          <div className="absolute bottom-2 left-2">
            <Badge className="text-[9px] px-1.5 py-0.5 bg-destructive text-destructive-foreground border-0 font-bold">
              -{discount}%
            </Badge>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 cursor-pointer" onClick={() => !selectionMode && onNavigate(listing.id)}>
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">{listing.brand}</p>
        <p className="text-xs font-bold leading-snug line-clamp-2 mt-0.5">{name}</p>

        {listing.size && (
          <div className="mt-1.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium">
              Tam. {listing.size}
            </Badge>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-border/20">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black tracking-tight">R$ {fmt(listing.price)}</span>
          </div>
          {listing.original_purchase_price && listing.original_purchase_price > listing.price && (
            <span className="text-[10px] text-muted-foreground line-through">
              R$ {fmt(listing.original_purchase_price)}
            </span>
          )}
        </div>

        {!isSold && !selectionMode && (
          <Button
            size="sm"
            className="w-full mt-2 h-8 text-xs font-semibold"
            onClick={(e) => { e.stopPropagation(); onNavigate(listing.id); }}
          >
            Comprar
          </Button>
        )}
        {isSold && (
          <Button size="sm" variant="outline" className="w-full mt-2 h-8 text-xs" disabled>
            Vendido
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Active Filter Pill ──────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors group"
    >
      {label}
      <X className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

// ─── Filter Panel (inside Popover) ───────────────────────────
interface FilterPanelProps {
  brands: string[];
  sizes: string[];
  filterBrand: string;
  filterSize: string;
  filterCondition: string;
  hideSold: boolean;
  onBrandChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onConditionChange: (v: string) => void;
  onHideSoldChange: (v: boolean) => void;
  onClear: () => void;
  activeCount: number;
}

function FilterPanel({
  brands, sizes, filterBrand, filterSize, filterCondition,
  hideSold, onBrandChange, onSizeChange, onConditionChange,
  onHideSoldChange, onClear, activeCount,
}: FilterPanelProps) {
  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Filtros</p>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Marca</label>
          <Select value={filterBrand} onValueChange={onBrandChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Todas as marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as marcas</SelectItem>
              {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Size */}
      {sizes.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tamanho</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSizeChange("__all__")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                filterSize === "__all__"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-secondary-foreground border-border/40 hover:border-primary/40"
              )}
            >
              Todos
            </button>
            {sizes.map(s => (
              <button
                key={s}
                onClick={() => onSizeChange(s)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                  filterSize === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-secondary-foreground border-border/40 hover:border-primary/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Condição</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onConditionChange("__all__")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
              filterCondition === "__all__"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-secondary-foreground border-border/40 hover:border-primary/40"
            )}
          >
            Todas
          </button>
          {Object.entries(CONDITION_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => onConditionChange(k)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                filterCondition === k
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-secondary-foreground border-border/40 hover:border-primary/40"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Hide sold */}
      <div className="pt-1 border-t border-border/30">
        <button
          onClick={() => onHideSoldChange(!hideSold)}
          className="flex items-center justify-between w-full py-2 group"
        >
          <span className="text-xs text-foreground font-medium">Ocultar vendidos</span>
          <div
            className={cn(
              "w-9 h-5 rounded-full transition-colors relative",
              hideSold ? "bg-primary" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-background shadow-sm transition-transform",
                hideSold ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
interface FavoritesV2Props {
  cpf: string;
}

export function FavoritesV2({ cpf }: FavoritesV2Props) {
  const navigate = useNavigate();
  const { isEnabled } = useConfig();
  const listsEnabled = isEnabled("enable_favorites_lists");

  const { listings, isLoading, fetchListings, toggleFavorite } = useMarketplaceListings(cpf);
  const favLists = useFavoriteLists(cpf);

  // State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [hideSold, setHideSold] = useState(false);
  const [filterBrand, setFilterBrand] = useState("__all__");
  const [filterSize, setFilterSize] = useState("__all__");
  const [filterCondition, setFilterCondition] = useState("__all__");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // List management dialogs
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTargetListId, setMoveTargetListId] = useState("");
  const [renameListId, setRenameListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch favorites
  useEffect(() => {
    fetchListings({ favoritesOnly: true });
    if (listsEnabled) favLists.fetchLists();
  }, [cpf]);

  // Extract unique brands/sizes for filters
  const brands = useMemo(() => [...new Set(listings.map(l => l.brand).filter(Boolean))].sort() as string[], [listings]);
  const sizes = useMemo(() => [...new Set(listings.map(l => l.size).filter(Boolean))].sort() as string[], [listings]);

  // Active filter count
  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; clear: () => void }[] = [];
    if (filterBrand !== "__all__") pills.push({ key: "brand", label: `Marca: ${filterBrand}`, clear: () => setFilterBrand("__all__") });
    if (filterSize !== "__all__") pills.push({ key: "size", label: `Tam: ${filterSize}`, clear: () => setFilterSize("__all__") });
    if (filterCondition !== "__all__") pills.push({ key: "cond", label: CONDITION_LABELS[filterCondition] || filterCondition, clear: () => setFilterCondition("__all__") });
    if (hideSold) pills.push({ key: "sold", label: "Vendidos ocultos", clear: () => setHideSold(false) });
    return pills;
  }, [filterBrand, filterSize, filterCondition, hideSold]);

  const clearAllFilters = useCallback(() => {
    setFilterBrand("__all__");
    setFilterSize("__all__");
    setFilterCondition("__all__");
    setHideSold(false);
  }, []);

  // Filter + sort
  const processed = useMemo(() => {
    let items = [...listings];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.brand?.toLowerCase().includes(q) ||
        l.model?.toLowerCase().includes(q) ||
        l.colorway?.toLowerCase().includes(q)
      );
    }

    if (filterBrand !== "__all__") items = items.filter(l => l.brand === filterBrand);
    if (filterSize !== "__all__") items = items.filter(l => l.size === filterSize);
    if (filterCondition !== "__all__") items = items.filter(l => l.condition === filterCondition);
    if (hideSold) items = items.filter(l => l.status !== "sold" && l.status !== "reserved");

    items.sort((a, b) => {
      const aSold = a.status === "sold" || a.status === "reserved" ? 1 : 0;
      const bSold = b.status === "sold" || b.status === "reserved" ? 1 : 0;
      if (aSold !== bSold) return aSold - bSold;

      switch (sort) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "discount": {
          const dA = a.original_purchase_price ? (1 - a.price / a.original_purchase_price) : 0;
          const dB = b.original_purchase_price ? (1 - b.price / b.original_purchase_price) : 0;
          return dB - dA;
        }
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return items;
  }, [listings, debouncedSearch, filterBrand, filterSize, filterCondition, hideSold, sort]);

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    await toggleFavorite(id);
    fetchListings({ favoritesOnly: true });
  }, [toggleFavorite, fetchListings]);

  const handleBulkRemove = useCallback(async () => {
    for (const id of selected) {
      await toggleFavorite(id);
    }
    setSelected(new Set());
    setSelectionMode(false);
    fetchListings({ favoritesOnly: true });
  }, [selected, toggleFavorite, fetchListings]);

  const handleNavigate = useCallback((id: string) => {
    const listing = listings.find(l => l.id === id);
    if (listing) {
      navigate(`/marketplace/produto/${id}`);
    }
  }, [listings, navigate]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await favLists.createList(newListName.trim());
    setNewListName("");
    setShowCreateList(false);
  };

  const handleRenameList = async () => {
    if (!renameListId || !renameValue.trim()) return;
    await favLists.renameList(renameListId, renameValue.trim());
    setRenameListId(null);
    setRenameValue("");
  };

  const handleMoveToList = async () => {
    if (!moveTargetListId || selected.size === 0) return;
    for (const id of selected) {
      await favLists.addItem(moveTargetListId, id);
    }
    setShowMoveDialog(false);
    setSelected(new Set());
    setSelectionMode(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart className="h-4.5 w-4.5 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Meus Favoritos</h1>
            <p className="text-[11px] text-muted-foreground">
              {processed.length === listings.length
                ? `${listings.length} ${listings.length === 1 ? "item" : "itens"}`
                : `${processed.length} de ${listings.length} itens`}
            </p>
          </div>
        </div>
        <Button
          variant={selectionMode ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 rounded-lg"
          onClick={() => { setSelectionMode(!selectionMode); setSelected(new Set()); }}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {selectionMode ? "Cancelar" : "Selecionar"}
        </Button>
      </div>

      {/* ─── Toolbar: Search + Sort + Filter button ─── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos favoritos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm bg-secondary/30 border-border/30 focus:bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-10 w-auto min-w-[130px] text-xs rounded-xl bg-secondary/30 border-border/30 gap-1.5 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter button with Popover */}
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 rounded-xl text-xs gap-1.5 shrink-0 border-border/30 bg-secondary/30 relative",
                activeFilters.length > 0 && "border-primary/40 bg-primary/5"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilters.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <FilterPanel
              brands={brands}
              sizes={sizes}
              filterBrand={filterBrand}
              filterSize={filterSize}
              filterCondition={filterCondition}
              hideSold={hideSold}
              onBrandChange={setFilterBrand}
              onSizeChange={setFilterSize}
              onConditionChange={setFilterCondition}
              onHideSoldChange={setHideSold}
              onClear={clearAllFilters}
              activeCount={activeFilters.length}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ─── Active filter pills ─── */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 flex-wrap overflow-hidden"
          >
            {activeFilters.map(f => (
              <FilterPill key={f.key} label={f.label} onRemove={f.clear} />
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-muted-foreground hover:text-foreground ml-1 transition-colors"
            >
              Limpar tudo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Lists tabs (behind flag) ─── */}
      {listsEnabled && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={!activeListId ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs rounded-full shrink-0"
            onClick={() => setActiveListId(null)}
          >
            Todos
          </Button>
          {favLists.lists.map(list => (
            <div key={list.id} className="relative group shrink-0">
              <Button
                variant={activeListId === list.id ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs rounded-full pr-7"
                onClick={() => setActiveListId(list.id)}
              >
                {list.name} ({list.item_count})
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => { setRenameListId(list.id); setRenameValue(list.name); }}>
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => favLists.deleteList(list.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs rounded-full shrink-0 gap-1"
            onClick={() => setShowCreateList(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Nova lista
          </Button>
        </div>
      )}

      {/* ─── Selection bar ─── */}
      <AnimatePresence>
        {selectionMode && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <span className="text-sm font-medium">
              {selected.size} selecionado{selected.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {listsEnabled && (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setShowMoveDialog(true)}>
                  <FolderOpen className="h-3.5 w-3.5" /> Mover para lista
                </Button>
              )}
              <Button size="sm" variant="destructive" className="h-8 text-xs gap-1.5" onClick={handleBulkRemove}>
                <Trash2 className="h-3.5 w-3.5" /> Remover ({selected.size})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content ─── */}
      {isLoading ? (
        <FavoritesGridSkeleton />
      ) : processed.length === 0 ? (
        <EmptyState
          icon={activeFilters.length > 0 || debouncedSearch ? Package : Heart}
          title={debouncedSearch || activeFilters.length > 0 ? "Nenhum favorito encontrado" : "Você ainda não tem favoritos"}
          description={debouncedSearch || activeFilters.length > 0
            ? "Tente ajustar a busca ou filtros"
            : "Explore o marketplace e favorite os sneakers que mais gostar"}
          action={!debouncedSearch && activeFilters.length === 0 ? { label: "Explorar marketplace", onClick: () => navigate("/app") } : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {processed.map((listing) => (
              <FavoriteCard
                key={listing.id}
                listing={listing}
                selected={selected.has(listing.id)}
                selectionMode={selectionMode}
                onSelect={handleSelect}
                onRemove={handleRemove}
                onNavigate={handleNavigate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Dialogs ─── */}
      <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova lista</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome da lista"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateList(false)}>Cancelar</Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameListId} onOpenChange={(o) => !o && setRenameListId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear lista</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Novo nome"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameList()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameListId(null)}>Cancelar</Button>
            <Button onClick={handleRenameList} disabled={!renameValue.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mover para lista</DialogTitle>
          </DialogHeader>
          <Select value={moveTargetListId} onValueChange={setMoveTargetListId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma lista" />
            </SelectTrigger>
            <SelectContent>
              {favLists.lists.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>Cancelar</Button>
            <Button onClick={handleMoveToList} disabled={!moveTargetListId}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
