import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Store, Activity, User, Menu, X, ArrowLeft, Crown, Heart, Package, MapPin, Tag, LogOut, Settings, Ticket } from "lucide-react";
import { lazy, Suspense, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/Logo";
import { useClientSession } from "@/hooks/useClientSession";
import { CartProvider } from "@/hooks/useMarketplaceCart";
import { CartDrawer } from "@/components/client/vault/marketplace/CartDrawer";

const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/marketplace", label: "Explorar", mobileLabel: "Explorar", exact: true },
  { path: "/marketplace/pedidos", label: "Pedidos", mobileLabel: "Pedidos", icon: ShoppingBag },
  { path: "/marketplace/favoritos", label: "Favoritos", mobileLabel: "Favoritos", icon: Heart },
  { path: "/marketplace/feed", label: "Feed", mobileLabel: "Feed", icon: Activity },
  { path: "/marketplace/loja", label: "Minha Loja", mobileLabel: "Loja", icon: Store },
  { path: "/marketplace/planos", label: "Planos", mobileLabel: "Planos", icon: Crown },
];

export default function MarketplaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isVaultMember } = useClientSession();
  const cpf = profile?.cpf || null;
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";
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
    <CartProvider cpf={cpf}>
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

                {/* Cart */}
                <CartDrawer />

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                      <Avatar className="h-8 w-8 border border-primary/30">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {profile && (
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium truncate">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.$3-**")}</p>
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/marketplace/perfil")}>
                      <User className="h-4 w-4 mr-2" /> Meu Closet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace/pedidos")}>
                      <Package className="h-4 w-4 mr-2" /> Minhas compras
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace/favoritos")}>
                      <Heart className="h-4 w-4 mr-2" /> Favoritos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace/loja")}>
                      <Store className="h-4 w-4 mr-2" /> Quero vender
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/marketplace/planos")}>
                      <Crown className="h-4 w-4 mr-2" /> Planos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/minha-conta")}>
                      <Settings className="h-4 w-4 mr-2" /> Painel do cliente
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
    </CartProvider>
  );
}
