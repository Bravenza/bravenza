import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Package, Heart, DollarSign, Store, Activity, Box, Settings,
  Star, Award, Sparkles, Users, HelpCircle, Shield, RefreshCw,
  FileText, LogOut, ArrowRight, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientSession } from "@/hooks/useClientSession";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MenuGroup {
  label?: string;
  items: { path: string; label: string; icon: React.ElementType; highlight?: boolean }[];
}

const getMenuGroups = (isVaultMember: boolean): MenuGroup[] => [
  {
    items: [
      { path: "/app/pedidos", label: "Pedidos", icon: Package },
      { path: "/app/favoritos", label: "Favoritos", icon: Heart },
    ],
  },
  {
    label: "Vendedor",
    items: [
      { path: "/vender", label: "Quero Vender", icon: DollarSign, highlight: true },
      { path: "/app/loja", label: "Minha Loja", icon: Store },
      { path: "/app/feed", label: "Feed", icon: Activity },
    ],
  },
  {
    label: "Minha conta",
    items: [
      { path: "/app/closet", label: "Meu Closet", icon: Box },
      { path: "/app/perfil", label: "Meus Dados", icon: Settings },
    ],
  },
  ...(isVaultMember
    ? [{
        label: "Vault Club",
        items: [
          { path: "/app/wishlist", label: "Wishlist", icon: Star },
          { path: "/app/vault", label: "Meu Status", icon: Award },
          { path: "/app/drops", label: "Drops & Intel", icon: Sparkles },
          { path: "/app/comunidade", label: "Comunidade", icon: Users },
        ],
      }]
    : []),
  {
    label: "Informações",
    items: [
      { path: "/faq", label: "Perguntas Frequentes", icon: HelpCircle },
      { path: "/sobre-autenticidade", label: "Autenticidade", icon: Shield },
      { path: "/trocas-devolucoes", label: "Trocas e Devoluções", icon: RefreshCw },
      { path: "/termos", label: "Termos de Uso", icon: FileText },
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

  const isActive = (path: string) => location.pathname.startsWith(path);
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
        size="sm"
        className="mb-4 gap-1.5 text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* User card */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-card border border-border/40">
        <Avatar className="h-12 w-12 border border-primary/30">
          <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-base font-semibold truncate">{profile?.full_name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground">
            {cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.$3-**")}
          </p>
        </div>
      </div>

      {/* Grouped menu items */}
      <div className="space-y-1">
        {menuGroups.map((group, gi) => (
          <div key={gi} className="pb-3 mb-3 border-b border-border/20 last:border-b-0 last:mb-0 last:pb-0">
            {group.label && (
              <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
            )}
            {group.items.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors",
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
        <div className="pt-3 border-t border-border/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}