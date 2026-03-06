import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Users, Crown, Store, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface SearchResult {
  type: "order" | "client" | "vault_member" | "marketplace_order";
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      const q = searchQuery.trim();

      // Search orders by ID or client name
      const [ordersRes, membersRes, mkOrdersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("order_id, client_name, client_cpf, current_status, product_name")
          .or(`order_id.ilike.%${q}%,client_name.ilike.%${q}%,client_cpf.ilike.%${q}%,product_name.ilike.%${q}%`)
          .limit(8),
        supabase
          .from("vault_members")
          .select("id, client_name, client_cpf, client_email, tier")
          .or(`client_name.ilike.%${q}%,client_cpf.ilike.%${q}%,client_email.ilike.%${q}%`)
          .limit(5),
        supabase
          .from("vault_marketplace_orders")
          .select("id, order_code, buyer_name, status, listing:vault_marketplace_listings(title)")
          .or(`order_code.ilike.%${q}%,buyer_name.ilike.%${q}%`)
          .limit(5),
      ]);

      // Process orders
      if (ordersRes.data) {
        // Extract unique clients from orders
        const clientMap = new Map<string, { name: string; cpf: string }>();
        
        ordersRes.data.forEach((order) => {
          searchResults.push({
            type: "order",
            id: order.order_id,
            title: `${order.order_id} — ${order.product_name || ""}`,
            subtitle: `${order.client_name} · ${ORDER_STATUS_LABELS[order.current_status] || order.current_status}`,
            path: `/admin/pedidos/${order.order_id}`,
          });

          if (!clientMap.has(order.client_cpf)) {
            clientMap.set(order.client_cpf, { name: order.client_name, cpf: order.client_cpf });
          }
        });

        // Add unique clients
        clientMap.forEach(({ name, cpf }) => {
          searchResults.push({
            type: "client",
            id: cpf,
            title: name,
            subtitle: `CPF: ${cpf}`,
            path: `/admin/pedidos?search=${encodeURIComponent(name)}`,
          });
        });
      }

      // Process vault members
      if (membersRes.data) {
        membersRes.data.forEach((member) => {
          searchResults.push({
            type: "vault_member",
            id: member.id,
            title: member.client_name,
            subtitle: `Vault ${member.tier?.toUpperCase()} · ${member.client_email || member.client_cpf}`,
            path: `/admin/vault/membros`,
          });
        });
      }

      setResults(searchResults.slice(0, 12));
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const typeIcons = {
    order: <Package className="h-4 w-4 text-primary" />,
    client: <Users className="h-4 w-4 text-info" />,
    vault_member: <Crown className="h-4 w-4 text-warning" />,
  };

  const typeLabels = {
    order: "Pedido",
    client: "Cliente",
    vault_member: "Vault",
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors border border-border/30"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden [&>button]:hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar pedidos, clientes, membros Vault..."
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-12 text-base"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {query.length >= 2 && results.length === 0 && !isLoading && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum resultado encontrado para "{query}"
              </div>
            )}

            {query.length < 2 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      index === selectedIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-shrink-0">{typeIcons[result.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex-shrink-0">
                      {typeLabels[result.type]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer shortcuts */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded border border-border/50 bg-muted">↑↓</kbd> Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded border border-border/50 bg-muted">↵</kbd> Selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded border border-border/50 bg-muted">Esc</kbd> Fechar
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
