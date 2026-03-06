import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X, Heart, LogOut, Settings, Store, Package, User, MessageSquare } from "lucide-react";
import { useState, useRef } from "react";
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
import { CartDrawer } from "@/components/client/vault/marketplace/CartDrawer";
import { cn } from "@/lib/utils";
import { navItems } from "./marketplace-nav";
import { useUnreadMessages } from "@/hooks/marketplace/useUnreadMessages";

interface MarketplaceHeaderProps {
  profile: { full_name?: string; cpf?: string } | null;
  signOut: () => void;
}

export function MarketplaceHeader({ profile, signOut }: MarketplaceHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { unread } = useUnreadMessages(profile?.cpf || null);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchRef.current?.value?.trim();
    if (q) {
      navigate(`/app?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 pointer-events-none" style={{ top: "var(--safe-area-top, 0px)" }}>
        <div className="px-3 pt-2 pb-2">
          <div className="pointer-events-auto theme-dark bg-background/80 backdrop-blur-2xl border border-border/40 rounded-2xl shadow-xl shadow-black/20 ring-1 ring-white/5">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center h-14 gap-4">
                {/* Logo */}
                <Link to="/app" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity" aria-label="Ir para página inicial do Market">
                  <Logo size="sm" />
                  <div className="hidden sm:flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Market</span>
                  </div>
                </Link>

                {/* Desktop Search */}
                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-auto" role="search">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      ref={searchRef}
                      placeholder="Buscar por marca, modelo ou SKU..."
                      defaultValue={new URLSearchParams(location.search).get("q") || ""}
                      className="pl-10 pr-4 h-10 bg-secondary/50 border-border/30 rounded-full text-sm focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/60"
                      aria-label="Buscar produtos"
                    />
                  </div>
                </form>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
                  {navItems.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        aria-current={isActive ? "page" : undefined}
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
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full hover:bg-secondary/60 transition-colors active:scale-95" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-secondary/60 transition-colors active:scale-95" asChild>
                    <Link to="/app/favoritos" aria-label="Favoritos">
                      <Heart className="h-4 w-4" />
                    </Link>
                  </Button>
                  <CartDrawer />
                  {unread.total > 0 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-secondary/60 transition-colors active:scale-95 relative" asChild>
                      <Link to="/app/loja" aria-label="Mensagens não lidas">
                        <MessageSquare className="h-4 w-4" />
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none">
                          {unread.total > 99 ? "99+" : unread.total}
                        </span>
                      </Link>
                    </Button>
                  )}

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0" aria-label="Menu do usuário">
                        <Avatar className="h-8 w-8 border border-primary/30">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-64 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/15 rounded-xl p-0">
                      {profile && (
                        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{profile.full_name}</p>
                            <p className="text-[11px] text-muted-foreground/70 font-mono">
                              {profile.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.•••.$3-••")}
                            </p>
                          </div>
                        </div>
                      )}
                      <DropdownMenuSeparator className="my-0 bg-border/30" />
                      <div className="p-1">
                        <DropdownMenuItem onClick={() => navigate("/app/closet")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" /> Meu Closet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/app/pedidos")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                          <Package className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" /> Minhas compras
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/app/favoritos")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                          <Heart className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" /> Favoritos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/app/loja")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                          <Store className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" /> Quero vender
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="my-0 bg-border/30" />
                      <div className="p-1">
                        <DropdownMenuItem onClick={() => navigate("/app")} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5">
                          <Settings className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" /> Painel do cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer px-3 py-2 rounded-md text-[13px] gap-2.5 text-destructive/80 focus:text-destructive">
                          <LogOut className="h-3.5 w-3.5 shrink-0" /> Sair
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen}>
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Search */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden border-t border-border/20 overflow-hidden">
                  <form onSubmit={handleSearch} className="px-4 py-3" role="search">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input ref={searchRef} autoFocus placeholder="Buscar sneakers..." className="pl-10 h-10 bg-secondary/50 border-border/30 rounded-full text-sm" aria-label="Buscar produtos" />
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-b border-border/30 bg-card/95 backdrop-blur-xl overflow-hidden z-40">
          <nav className="p-3 space-y-1" aria-label="Menu mobile">
            {navItems.map((item) => {
              const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={onClose} aria-current={isActive ? "page" : undefined} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
