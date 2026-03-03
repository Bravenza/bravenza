import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Package, Heart, DollarSign, Store, Box, Settings, Bell,
  HelpCircle, Shield, RefreshCw, FileText, LogOut, Lock, 
  ArrowRight, ChevronLeft, MessageSquare, MapPin,
  Tag, Star, Award, Sparkles, Users, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientSession } from "@/hooks/useClientSession";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
}

interface MenuGroup {
  items: MenuItem[];
}

const getMenuGroups = (isVaultMember: boolean): MenuGroup[] => [
  {
    items: [
      { path: "/app/notificacoes", label: "Notificações", icon: Bell },
      { path: "/app/pedidos", label: "Compras", icon: Package },
      { path: "/app/favoritos", label: "Favoritos", icon: Heart },
    ],
  },
  {
    items: [
      { path: "/vender", label: "Quero vender meu sneaker", icon: DollarSign, highlight: true },
      { path: "/app", label: "Market", icon: Store },
      { path: "/app/loja", label: "Vendas", icon: Activity },
    ],
  },
  {
    items: [
      { path: "/app/mensagens", label: "Mensagens", icon: MessageSquare },
      { path: "/app/closet", label: "Closet", icon: Box },
      { path: "/app/enderecos", label: "Meus Endereços", icon: MapPin },
      { path: "/app/documentos", label: "Documentos", icon: FileText },
      { path: "/app/feed", label: "Feed", icon: Activity },
    ],
  },
  ...(isVaultMember
    ? [{
        items: [
          { path: "/app/wishlist", label: "Wishlist", icon: Star },
          { path: "/app/vault", label: "Meu Status", icon: Award },
          { path: "/app/drops", label: "Drops & Intel", icon: Sparkles },
          { path: "/app/comunidade", label: "Comunidade", icon: Users },
        ],
      }]
    : []),
  {
    items: [
      { path: "/faq", label: "Como a Bravenza funciona?", icon: HelpCircle },
    ],
  },
  {
    items: [
      { path: "/termos", label: "Termos de Uso", icon: FileText },
      { path: "/politicas", label: "Política de Privacidade", icon: Shield },
      { path: "/trocas-devolucoes", label: "Trocas e Devoluções", icon: RefreshCw },
    ],
  },
  {
    items: [
      { path: "/app/perfil", label: "Configurações", icon: Settings },
      { path: "/app/seguranca", label: "Segurança", icon: Shield },
    ],
  },
];

export default function AppMorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, isVaultMember } = useClientSession();
  const cpf = profile?.cpf || null;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const isActive = (path: string) =>
    path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(path);
  const menuGroups = getMenuGroups(isVaultMember);

  const handleLogout = async () => {
    await signOut();
    navigate("/entrar");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Helmet>
        <title>Mais opções | BRAVENZA</title>
      </Helmet>

      {/* Back button */}
      <Button
        variant="ghost"
        size="default"
        className="mb-4 gap-1.5 text-muted-foreground min-h-[44px] px-3 active:scale-95 transition-transform"
        onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/app")}
      >
        <ChevronLeft className="h-5 w-5" />
        Voltar
      </Button>

      {/* User card - clickable to profile */}
      <button
        onClick={() => navigate("/app/perfil")}
        className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-card border border-border/40 w-full text-left hover:bg-secondary/50 transition-colors"
      >
        <Avatar className="h-12 w-12 border border-primary/30">
          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
          <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold truncate">{profile?.full_name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground">
            {cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.$3-**")}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {/* Grouped menu items */}
      <div className="space-y-1">
        {menuGroups.map((group, gi) => (
          <div key={gi} className="pb-2 mb-2 border-b border-border/20 last:border-b-0 last:mb-0 last:pb-0">
            {group.items.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-3.5 min-h-[48px] rounded-xl text-sm font-medium transition-all active:scale-[0.98] active:bg-secondary/80",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : item.highlight
                      ? "text-foreground font-semibold hover:bg-secondary"
                      : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className={cn("h-5 w-5", item.highlight ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.highlight && <ArrowRight className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div className="pt-2 border-t border-border/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3.5 min-h-[48px] rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
