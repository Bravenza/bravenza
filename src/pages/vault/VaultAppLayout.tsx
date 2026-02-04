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
  member: { label: "Vault Access", color: "text-zinc-400" },
  collector: { label: "Vault Privilege", color: "text-amber-400" },
  elite: { label: "Vault Black", color: "text-white" },
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tierInfo = tierLabels[member?.tier || "member"];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur">
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
                        ? "bg-amber-500/10 text-amber-500" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
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
                  className={`hidden sm:flex border-zinc-700 ${tierInfo.color}`}
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
                className="hidden sm:flex text-zinc-400 hover:text-white"
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
                <SheetContent side="right" className="bg-zinc-900 border-zinc-800 w-72">
                  <div className="flex flex-col h-full">
                    {/* User info */}
                    <div className="pb-4 mb-4 border-b border-zinc-800">
                      <p className="font-medium">{session.client_name}</p>
                      <Badge variant="outline" className={`mt-2 ${tierInfo.color} border-zinc-700`}>
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
                                ? "bg-amber-500/10 text-amber-500" 
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
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
                      className="justify-start text-zinc-400 hover:text-white mt-4"
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
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{ member, refreshMember: fetchMember }} />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-3 px-3 text-xs ${
                  isActive ? "text-amber-500" : "text-zinc-500"
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