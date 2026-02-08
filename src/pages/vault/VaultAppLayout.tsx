import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Search, Newspaper, Users, Crown, LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useVaultNotifications } from "@/hooks/useVaultNotifications";
import { VaultNotificationBell } from "@/components/vault/VaultNotificationBell";
import { supabase } from "@/integrations/supabase/client";

interface VaultMember {
  id: string;
  client_name: string;
  tier: "member" | "collector" | "elite";
  active_hunts: number;
  max_active_hunts: number;
  invites_remaining: number;
  community_opt_in: boolean;
}

const tierLabels: Record<string, { label: string; color: string }> = {
  member: { label: "Vault Access", color: "text-muted-foreground" },
  collector: { label: "Vault Privilege", color: "text-primary" },
  elite: { label: "Vault Black", color: "text-foreground" },
};

const navItems = [
  { path: "/vault/app", label: "Meu vault", icon: Box, exact: true },
  { path: "/vault/app/wishlist", label: "Wishlist e buscas", icon: Search },
  { path: "/vault/app/intel", label: "Intel", icon: Newspaper },
  { path: "/vault/app/club", label: "Clube", icon: Crown },
  { path: "/vault/app/community", label: "Comunidade", icon: Users },
];

export default function VaultAppLayout() {
  const { session, isLoading, logout } = useClientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [member, setMember] = useState<VaultMember | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Vault notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useVaultNotifications({ cpf: session?.cpf || null, enabled: !!session });

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/cliente/login?redirect=/vault/app");
    }
  }, [isLoading, session, navigate]);

  useEffect(() => {
    if (session?.cpf) {
      fetchMember();
    }
  }, [session?.cpf]);

  const fetchMember = async () => {
    if (!session?.cpf) return;
    
    const { data, error } = await supabase
      .rpc("get_vault_member", { p_cpf: session.cpf });
    
    if (!error && data && data.length > 0) {
      setMember(data[0] as unknown as VaultMember);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/vault");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tierInfo = tierLabels[member?.tier || "member"];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />
      
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/vault/app" className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-muted-foreground font-medium hidden sm:inline">Vault</span>
            </Link>

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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Tier badge */}
              {member && (
                <Badge 
                  variant="outline" 
                  className={`hidden sm:flex border-border/50 ${tierInfo.color}`}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {tierInfo.label}
                </Badge>
              )}

              {/* Notifications */}
              <VaultNotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />

              {/* Logout */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>

              {/* Mobile menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-border w-72">
                  <div className="flex flex-col h-full">
                    {/* User info */}
                    <div className="pb-4 mb-4 border-b border-border">
                      <p className="font-medium">{session.client_name}</p>
                      <Badge variant="outline" className={`mt-2 ${tierInfo.color} border-border/50`}>
                        {tierInfo.label}
                      </Badge>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 space-y-1">
                      {navItems.map((item) => {
                        const isActive = item.exact 
                          ? location.pathname === item.path
                          : location.pathname.startsWith(item.path);
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                              isActive 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Logout */}
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="justify-start text-muted-foreground hover:text-foreground mt-4"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet context={{ member, refreshMember: fetchMember }} />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/30 safe-bottom">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-3 px-3 min-h-[56px] text-xs transition ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
