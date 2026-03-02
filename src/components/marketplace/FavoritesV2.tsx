import { useState, useEffect, useMemo, useCallback } from "react";
import { Heart, Search, SlidersHorizontal, Check, X, Trash2, FolderOpen, ArrowUpDown, Eye, EyeOff, Plus, MoreHorizontal, Pencil } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
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
import { PriceVariationBadge } from "@/components/marketplace/PriceVariationBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketplaceListing } from "@/hooks/marketplace/types";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type SortKey = "recent" | "price_asc" | "price_desc" | "discount";

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
      {/* Selection checkbox */}
      {selectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(listing.id); }}
          className="absolute top-3 left-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors bg-background/80 backdrop-blur-sm"
          style={{ borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--border))" }}
        >
          {selected && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      )}

      {/* Remove button */}
      {!selectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(listing.id); }}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* SOLD badge */}
      {isSold && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-muted text-muted-foreground">
            Vendido
          </Badge>
        </div>
      )}

      {/* Image */}
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

        {/* Discount badge */}
        {discount && discount > 0 && !isSold && (
          <div className="absolute bottom-2 left-2">
            <Badge className="text-[9px] px-1.5 py-0.5 bg-destructive text-destructive-foreground border-0 font-bold">
              -{discount}%
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
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

        {/* Buy button */}
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

  // Filter + sort
  const processed = useMemo(() => {
    let items = [...listings];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.brand?.toLowerCase().includes(q) ||
        l.model?.toLowerCase().includes(q) ||
        l.colorway?.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterBrand && filterBrand !== "__all__") items = items.filter(l => l.brand === filterBrand);
    if (filterSize && filterSize !== "__all__") items = items.filter(l => l.size === filterSize);
    if (filterCondition && filterCondition !== "__all__") items = items.filter(l => l.condition === filterCondition);
    if (hideSold) items = items.filter(l => l.status !== "sold" && l.status !== "reserved");

    // Sort
    items.sort((a, b) => {
      const aSold = a.status === "sold" || a.status === "reserved" ? 1 : 0;
      const bSold = b.status === "sold" || b.status === "reserved" ? 1 : 0;
      if (aSold !== bSold) return aSold - bSold; // sold always last

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
    // Listings use the listing id as route param for marketplace detail
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
    // Add items to target list
    for (const id of selected) {
      await favLists.addItem(moveTargetListId, id);
    }
    setShowMoveDialog(false);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const hasActiveFilters = (filterBrand !== "__all__") || (filterSize !== "__all__") || (filterCondition !== "__all__") || hideSold;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <h1 className="text-xl font-bold">Meus Favoritos</h1>
          <Badge variant="secondary" className="text-xs font-semibold">
            {listings.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => { setSelectionMode(!selectionMode); setSelected(new Set()); }}
          >
            {selectionMode ? "Cancelar" : "Selecionar"}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nos favoritos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-full text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] text-xs rounded-full">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="price_asc">Menor preço</SelectItem>
              <SelectItem value="price_desc">Maior preço</SelectItem>
              <SelectItem value="discount">Maior desconto</SelectItem>
            </SelectContent>
          </Select>

          {/* Brand filter */}
          {brands.length > 0 && (
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="h-9 w-auto min-w-[110px] text-xs rounded-full">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {brands.map(b => <SelectItem key={b} value={b!}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Size filter */}
          {sizes.length > 0 && (
            <Select value={filterSize} onValueChange={setFilterSize}>
              <SelectTrigger className="h-9 w-auto min-w-[90px] text-xs rounded-full">
                <SelectValue placeholder="Tamanho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {sizes.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Condition filter */}
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="h-9 w-auto min-w-[100px] text-xs rounded-full">
              <SelectValue placeholder="Condição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              <SelectItem value="deadstock">Deadstock</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
            </SelectContent>
          </Select>

          {/* Hide sold toggle */}
          <Button
            variant={hideSold ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs rounded-full gap-1.5"
            onClick={() => setHideSold(!hideSold)}
          >
            {hideSold ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {hideSold ? "Mostrando ativos" : "Ocultar vendidos"}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => { setFilterBrand("__all__"); setFilterSize("__all__"); setFilterCondition("__all__"); setHideSold(false); }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Lists tabs (behind flag) */}
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

      {/* Selection bar */}
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

      {/* Content */}
      {isLoading ? (
        <FavoritesGridSkeleton />
      ) : processed.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={debouncedSearch || hasActiveFilters ? "Nenhum favorito encontrado" : "Você ainda não tem favoritos"}
          description={debouncedSearch || hasActiveFilters
            ? "Tente ajustar a busca ou filtros"
            : "Explore o marketplace e favorite os sneakers que mais gostar"}
          action={!debouncedSearch && !hasActiveFilters ? { label: "Explorar marketplace", onClick: () => navigate("/app") } : undefined}
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

      {/* Create List Dialog */}
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

      {/* Rename List Dialog */}
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

      {/* Move to List Dialog */}
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
