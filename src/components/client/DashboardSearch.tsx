import { useState, useCallback, useRef, useEffect, memo } from "react";
import { Search, X, Box, ShoppingBag, Store, Users, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  tab: string;
  icon: React.ElementType;
}

const searchSections = [
  { tab: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { tab: "vault", label: "Coleção", icon: Box },
  { tab: "marketplace", label: "Marketplace", icon: Store },
  { tab: "comunidade", label: "Comunidade", icon: Users },
];

interface DashboardSearchProps {
  onNavigate: (tab: string, search?: string) => void;
}

export const DashboardSearch = memo(function DashboardSearch({ onNavigate }: DashboardSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((section: typeof searchSections[0]) => {
    onNavigate(section.tab, query);
    setQuery("");
    setIsOpen(false);
  }, [query, onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setIsOpen(query.length > 0);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar em pedidos, coleção, marketplace..."
          className="pl-9 pr-9 h-10 rounded-xl bg-muted/30 border-border/30 text-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted/50"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-2 border-b border-border/30">
              <p className="text-[10px] text-muted-foreground px-2">Buscar "{query}" em:</p>
            </div>
            <div className="p-1.5">
              {searchSections.map((section) => (
                <button
                  key={section.tab}
                  onClick={() => handleSearch(section)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                    <section.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Buscar "{query}" em {section.label.toLowerCase()}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
