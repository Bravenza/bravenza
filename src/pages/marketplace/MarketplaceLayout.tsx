import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Store, Activity, User, Menu, X, ArrowLeft, Crown } from "lucide-react";
import { lazy, Suspense, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useClientSession } from "@/hooks/useClientSession";

const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/marketplace", label: "Explorar", mobileLabel: "Explorar", exact: true },
  { path: "/marketplace/pedidos", label: "Pedidos", mobileLabel: "Pedidos", icon: ShoppingBag },
  { path: "/marketplace/feed", label: "Feed", mobileLabel: "Feed", icon: Activity },
  { path: "/marketplace/loja", label: "Minha Loja", mobileLabel: "Loja", icon: Store },
  { path: "/marketplace/planos", label: "Planos", mobileLabel: "Planos", icon: Crown },
];

export default function MarketplaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useClientSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchRef.current?.value?.trim();
    if (q) {
      navigate(`/marketplace?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col theme-light">
      {/* ===== MARKETPLACE HEADER ===== */}
      <header className="sticky top-0 z-50 theme-dark" style={{ top: "var(--safe-area-top, 0px)" }}>
        {/* Top gold line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="bg-background/95 backdrop-blur-xl border-b border-border/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-16 gap-4">
              {/* Logo + Brand */}
              <Link to="/marketplace" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
                <Logo size="sm" />
                <div className="hidden sm:flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Market</span>
                </div>
              </Link>

              {/* Desktop Search Bar */}
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-auto">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Buscar por marca, modelo ou SKU..."
                    defaultValue={new URLSearchParams(location.search).get("q") || ""}
                    className="pl-10 pr-4 h-10 bg-secondary/50 border-border/30 rounded-full text-sm focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/60"
                  />
                </div>
              </form>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Right actions */}
              <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
                {/* Mobile search toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-full"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Back to dashboard */}
                <Link to="/minha-conta">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>

                {/* Mobile menu */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-full"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar (expandable) */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-border/20 overflow-hidden"
              >
                <form onSubmit={handleSearch} className="px-4 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchRef}
                      autoFocus
                      placeholder="Buscar sneakers..."
                      className="pl-10 h-10 bg-secondary/50 border-border/30 rounded-full text-sm"
                    />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border/30 bg-card/95 backdrop-blur-xl overflow-hidden z-40"
          >
            <div className="p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border/20">
                <Link
                  to="/minha-conta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao painel
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet context={{ cpf: profile?.cpf, profile }} />
      </main>

      <div className="pb-20 md:pb-0">
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/30 safe-bottom z-50">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            const Icon = item.icon || Search;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 min-h-[52px] min-w-[52px] text-[10px] font-medium transition-colors active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-0.5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]")} />
                <span>{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
