import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkPlus, Trash2, Bell, BellOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { toast } from "sonner";

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, any>;
  notify_new_listings: boolean;
  results_count: number;
  created_at: string;
}

interface SavedSearchesWidgetProps {
  cpf: string;
  currentFilters?: Record<string, any>;
  onApplySearch?: (filters: Record<string, any>) => void;
  className?: string;
}

export function SavedSearchesWidget({ cpf, currentFilters, onApplySearch, className }: SavedSearchesWidgetProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const fetchSearches = async () => {
    try {
      const res = await marketplaceRequest(cpf, "saved-searches");
      setSearches(res.searches || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSearches(); }, [cpf]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      await marketplaceRequest(cpf, "save-search", "POST", {
        name: saveName.trim(),
        filters: currentFilters || {},
        notify: true,
      });
      toast.success("Busca salva com sucesso!");
      setSaveName("");
      setOpen(false);
      fetchSearches();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await marketplaceRequest(cpf, "delete-saved-search", "DELETE", undefined, { id });
      setSearches(s => s.filter(ss => ss.id !== id));
      toast.success("Busca removida");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filterLabel = (filters: Record<string, any>) => {
    const parts: string[] = [];
    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.brand) parts.push(filters.brand);
    if (filters.condition) parts.push(filters.condition);
    return parts.length > 0 ? parts.join(" · ") : "Sem filtros";
  };

  if (cpf === "visitor") return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Save current search button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <BookmarkPlus className="h-3.5 w-3.5" />
            Salvar busca
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              Salvar busca atual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome da busca</label>
              <Input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Ex: Jordan 1 High abaixo de R$ 800"
                className="text-sm"
              />
            </div>
            {currentFilters && Object.keys(currentFilters).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Filtros atuais:</p>
                <p className="text-xs font-medium">{filterLabel(currentFilters)}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Você será notificado quando novos anúncios corresponderem
            </div>
            <Button onClick={handleSave} className="w-full btn-gold" disabled={!saveName.trim()}>
              Salvar busca
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved searches list */}
      {searches.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground relative">
              <Bookmark className="h-3.5 w-3.5" />
              Minhas buscas
              <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 ml-0.5">
                {searches.length}
              </Badge>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                Buscas salvas
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {searches.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors group"
                  >
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{filterLabel(s.filters)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.notify_new_listings ? (
                        <Bell className="h-3 w-3 text-primary" />
                      ) : (
                        <BellOff className="h-3 w-3 text-muted-foreground" />
                      )}
                      {onApplySearch && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-[10px]"
                          onClick={() => onApplySearch(s.filters)}
                        >
                          Aplicar
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
