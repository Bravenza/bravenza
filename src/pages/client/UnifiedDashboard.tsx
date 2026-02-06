import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, 
  Crown, 
  LogOut, 
  Loader2, 
  ChevronRight,
  Shield,
  Star,
  Clock,
  CheckCircle2,
  Truck,
  Newspaper,
  Users,
  Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useClientSession } from "@/hooks/useClientSession";
import { ORDER_STATUS_LABELS, formatDate, formatCurrency } from "@/lib/constants";
import { Logo } from "@/components/Logo";

// Import existing Vault components
import { VaultClubTab } from "@/components/client/vault/VaultClubTab";
import { VaultWishlistTab } from "@/components/client/vault/VaultWishlistTab";
import { VaultMyItemsTab } from "@/components/client/vault/VaultMyItemsTab";
import { VaultIntelTab } from "@/components/client/vault/VaultIntelTab";
import { VaultCommunityTab } from "@/components/client/vault/VaultCommunityTab";
import { MarketplaceTab } from "@/components/client/vault/marketplace";

interface Order {
  order_id: string;
  current_status: string;
  product_name: string;
  product_price: number | null;
  created_at: string;
  sinal_paid: boolean;
  balance_paid: boolean;
}

interface VaultMember {
  id: string;
  tier: "member" | "collector" | "elite";
  total_purchases: number;
  invites_remaining: number;
  max_active_hunts: number;
  max_wishlist_items: number;
  stats_purchases_count_12m: number;
  stats_spend_total_12m: number;
  stats_decision_rate: number;
  stats_converted_invites: number;
}

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: sessionLoading, isVaultMember, signOut, refreshProfile } = useClientSession();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState("pedidos");
  const [vaultMember, setVaultMember] = useState<VaultMember | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !user) {
      navigate("/entrar");
    }
  }, [user, sessionLoading, navigate]);

  // Fetch orders and vault member
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.cpf) return;
      
      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase.rpc("get_client_orders");
        if (!ordersError) setOrders(ordersData || []);
        
        // Fetch vault member data if member
        if (profile.vault_member_id) {
          const { data: memberData, error: memberError } = await supabase
            .from("vault_members")
            .select("*")
            .eq("id", profile.vault_member_id)
            .single();
          
          if (!memberError && memberData) {
            setVaultMember(memberData as unknown as VaultMember);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (profile) {
      fetchData();
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta.",
    });
    navigate("/entrar");
  };

  const getStatusIcon = (status: string) => {
    if (status === "DELIVERED") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (["INTERNATIONAL_TRANSIT", "NATIONAL_TRANSIT", "SHIPPED_TO_CLIENT"].includes(status)) {
      return <Truck className="h-4 w-4 text-blue-500" />;
    }
    return <Clock className="h-4 w-4 text-warning" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "DELIVERED") return "bg-success/20 text-success";
    if (["BALANCE_DUE", "BALANCE_PENDING"].includes(status)) return "bg-warning/20 text-warning";
    return "bg-primary/20 text-primary";
  };

  const getTierBadge = (tier: string | null) => {
    switch (tier) {
      case "elite":
        return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black">Vault Black</Badge>;
      case "collector":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Vault Privilege</Badge>;
      default:
        return <Badge variant="secondary">Vault Access</Badge>;
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Welcome Card */}
          <Card className="card-premium overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    Olá, {profile?.full_name?.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-muted-foreground">
                    Gerencie seus pedidos e acesse benefícios exclusivos
                  </p>
                </div>
                {isVaultMember && (
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    {getTierBadge(profile?.vault_tier)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto flex flex-wrap">
              <TabsTrigger value="pedidos" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Meus Pedidos
              </TabsTrigger>
              {isVaultMember && (
                <>
                  <TabsTrigger value="vault" className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Vault Club
                  </TabsTrigger>
                  <TabsTrigger value="wishlist" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Wishlist
                  </TabsTrigger>
                  <TabsTrigger value="colecao" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Minha Coleção
                  </TabsTrigger>
                  <TabsTrigger value="intel" className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    Intel
                  </TabsTrigger>
                  <TabsTrigger value="comunidade" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Comunidade
                  </TabsTrigger>
                  <TabsTrigger value="marketplace" className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Marketplace
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="pedidos" className="space-y-4 mt-6">
              {isLoadingOrders ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <Card className="card-premium">
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Seus pedidos aparecerão aqui quando você fizer uma compra
                    </p>
                    <Button onClick={() => navigate("/")} variant="outline">
                      Explorar produtos
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.order_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card 
                        className="card-premium cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate(`/rastreio/${order.order_id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(order.current_status)}
                              <div>
                                <p className="font-medium">{order.order_id}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {order.product_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                <Badge className={getStatusColor(order.current_status)}>
                                  {ORDER_STATUS_LABELS[order.current_status] || order.current_status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(order.created_at)}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Vault Club Tabs (only for members) */}
            {isVaultMember && profile?.cpf && (
              <>
                <TabsContent value="vault" className="mt-6">
                  <VaultClubTab 
                    clientCpf={profile.cpf} 
                    member={vaultMember} 
                    onMemberUpdate={refreshProfile} 
                  />
                </TabsContent>

                <TabsContent value="wishlist" className="mt-6">
                  <VaultWishlistTab clientCpf={profile.cpf} />
                </TabsContent>

                <TabsContent value="colecao" className="mt-6">
                  <VaultMyItemsTab clientCpf={profile.cpf} />
                </TabsContent>

                <TabsContent value="intel" className="mt-6">
                  <VaultIntelTab clientCpf={profile.cpf} />
                </TabsContent>

                <TabsContent value="comunidade" className="mt-6">
                  <VaultCommunityTab clientCpf={profile.cpf} member={vaultMember} />
                </TabsContent>

                <TabsContent value="marketplace" className="mt-6">
                  <MarketplaceTab
                    clientCpf={profile.cpf}
                    isVaultMember={isVaultMember}
                    buyerName={profile.full_name || undefined}
                    buyerEmail={user?.email || undefined}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>

          {/* Vault Club CTA (for non-members) */}
          {!isVaultMember && (
            <Card className="card-premium overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Vault Club</h3>
                      <p className="text-sm text-muted-foreground">
                        Acesso exclusivo a peças raras com curadoria especializada
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/vault")} className="btn-gold">
                    Conhecer o Vault Club
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}