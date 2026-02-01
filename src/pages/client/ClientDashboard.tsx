import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  Truck, 
  CreditCard,
  FileText,
  Download,
  Receipt,
  Star,
  Gift,
  Camera,
  Settings,
  Box,
  Search,
  Newspaper,
  Crown,
  Users,
  Shield,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Logo } from "@/components/Logo";
import { ReviewForm } from "@/components/client/ReviewForm";
import { ReferralCard } from "@/components/client/ReferralCard";
import { CashbackBanner } from "@/components/client/CashbackBanner";
import { ClientNotificationBell } from "@/components/client/ClientNotificationBell";
import { ClientPreferences } from "@/components/client/ClientPreferences";
import { InspectionPhotosGallery } from "@/components/client/InspectionPhotosGallery";
import { 
  VaultMyItemsTab, 
  VaultWishlistTab, 
  VaultIntelTab, 
  VaultClubTab, 
  VaultCommunityTab 
} from "@/components/client/vault";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderData {
  order_id: string;
  order_type: string;
  current_status: string;
  product_name: string;
  product_brand: string | null;
  product_model: string | null;
  product_size: string | null;
  product_color: string | null;
  product_price: number | null;
  product_currency: string | null;
  payment_mode: string | null;
  sinal_value: number | null;
  sinal_paid: boolean | null;
  sinal_paid_at: string | null;
  balance_value: number | null;
  balance_paid: boolean | null;
  balance_paid_at: string | null;
  budget_status: string | null;
  budget_approval_token: string | null;
  international_tracking: string | null;
  national_tracking: string | null;
  national_carrier: string | null;
  created_at: string;
  updated_at: string;
  history: { status: string; notes: string | null; created_at: string }[];
  inspection_photos: string[] | null;
}

interface VaultMemberData {
  id: string;
  tier: "member" | "collector" | "elite";
  total_purchases: number;
  active_hunts: number;
  max_active_hunts: number;
  max_wishlist_items: number;
  invites_remaining: number;
  community_opt_in: boolean;
  stats_purchases_count_12m: number;
  stats_spend_total_12m: number;
  stats_decision_rate: number;
  stats_converted_invites: number;
}

const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Pedido Confirmado",
  SOURCING: "Buscando Produto",
  NEGOTIATING: "Negociando",
  PURCHASE_COMPLETED: "Compra Realizada",
  PACKAGE_EN_ROUTE: "Em Trânsito Internacional",
  ARRIVED: "Chegou no Brasil",
  INSPECTION_APPROVED: "Inspeção Aprovada",
  BALANCE_DUE: "Aguardando Saldo",
  INTERNATIONAL_DISPATCH: "Enviado",
  CUSTOMS: "Na Alfândega",
  NATIONAL_TRANSIT: "Em Trânsito Nacional",
  DISPATCHED: "Saiu para Entrega",
  DELIVERED: "Entregue",
};

const STATUS_COLORS: Record<string, string> = {
  ORDER_CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SOURCING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  NEGOTIATING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  PURCHASE_COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  PACKAGE_EN_ROUTE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ARRIVED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  INSPECTION_APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  BALANCE_DUE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  INTERNATIONAL_DISPATCH: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  CUSTOMS: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  NATIONAL_TRANSIT: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  DISPATCHED: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
};

const tierConfig = {
  member: { label: "Vault Access", icon: Shield, color: "text-muted-foreground" },
  collector: { label: "Vault Privilege", icon: Crown, color: "text-amber-500" },
  elite: { label: "Vault Black", icon: Sparkles, color: "text-primary" },
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { session, isLoading: authLoading, logout } = useClientAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<{ orderId: string; productName: string } | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedOrderPhotos, setSelectedOrderPhotos] = useState<{ photos: string[]; productName: string } | null>(null);
  const [vaultMember, setVaultMember] = useState<VaultMemberData | null>(null);
  const [activeTab, setActiveTab] = useState("pedidos");
  const referralSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/cliente/login");
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.session_token) return;

      try {
        // Fetch orders
        const { data, error } = await supabase.functions.invoke("client-orders", {
          body: { session_token: session.session_token },
        });

        if (!error && data?.orders) {
          setOrders(data.orders);
        }

        // Fetch vault member data
        const { data: memberData } = await supabase
          .rpc("get_vault_member", { p_cpf: session.cpf });
        
        if (memberData && memberData.length > 0) {
          setVaultMember(memberData[0] as unknown as VaultMemberData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const refreshVaultMember = async () => {
    if (!session?.cpf) return;
    
    const { data } = await supabase
      .rpc("get_vault_member", { p_cpf: session.cpf });
    
    if (data && data.length > 0) {
      setVaultMember(data[0] as unknown as VaultMemberData);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/cliente/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (value: number | null, currency: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  };

  const tierInfo = vaultMember ? tierConfig[vaultMember.tier] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground">Olá,</p>
              <p className="font-semibold">{session?.client_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Vault Tier Badge */}
            {tierInfo && (
              <Badge variant="outline" className={`hidden sm:flex ${tierInfo.color}`}>
                <tierInfo.icon className="h-3 w-3 mr-1" />
                {tierInfo.label}
              </Badge>
            )}
            {session && <ClientNotificationBell clientCpf={session.cpf} />}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowPreferences(!showPreferences)}
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-8 flex-1">
        {/* Cashback Banner */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <CashbackBanner 
              clientCpf={session.cpf}
              onNavigateToReferrals={() => referralSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            />
          </motion.div>
        )}

        {/* Main Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto bg-card/50 border">
            <TabsTrigger value="pedidos" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            {vaultMember && (
              <>
                <TabsTrigger value="vault" className="gap-2">
                  <Box className="h-4 w-4" />
                  <span className="hidden sm:inline">Meu vault</span>
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Wishlist</span>
                </TabsTrigger>
                <TabsTrigger value="intel" className="gap-2">
                  <Newspaper className="h-4 w-4" />
                  <span className="hidden sm:inline">Intel</span>
                </TabsTrigger>
                <TabsTrigger value="club" className="gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Clube</span>
                </TabsTrigger>
                <TabsTrigger value="community" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Comunidade</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Pedidos Tab */}
          <TabsContent value="pedidos">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 lg:grid-cols-3"
            >
              {/* Orders List */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h1 className="text-xl font-bold">Meus pedidos</h1>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe o status de todos os seus pedidos
                  </p>
                </div>

                {isLoading ? (
                  <div className="grid gap-4">
                    {[1, 2].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                      <p className="text-muted-foreground">
                        Você ainda não tem pedidos registrados.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {orders.map((order, index) => (
                      <motion.div
                        key={order.order_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:border-primary/30 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Package className="h-5 w-5 text-primary" />
                                  {order.order_id}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {order.product_name}
                                  {order.product_brand && ` - ${order.product_brand}`}
                                  {order.product_model && ` ${order.product_model}`}
                                </CardDescription>
                              </div>
                              <Badge className={STATUS_COLORS[order.current_status] || "bg-muted"}>
                                {STATUS_LABELS[order.current_status] || order.current_status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Product Details */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              {order.product_size && (
                                <div>
                                  <p className="text-muted-foreground">Tamanho</p>
                                  <p className="font-medium">{order.product_size}</p>
                                </div>
                              )}
                              {order.product_color && (
                                <div>
                                  <p className="text-muted-foreground">Cor</p>
                                  <p className="font-medium">{order.product_color}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-muted-foreground">Tipo</p>
                                <p className="font-medium">
                                  {order.order_type === "VAULT" ? "Encomenda" : "Pronta Entrega"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Data</p>
                                <p className="font-medium">
                                  {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>

                            {/* Payment Status */}
                            {order.product_price && (
                              <div className="border-t border-border/50 pt-4">
                                {order.payment_mode === 'split' ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center justify-between sm:block">
                                      <p className="text-muted-foreground">Valor Total</p>
                                      <p className="font-semibold text-lg text-primary">
                                        {formatCurrency(order.product_price, order.product_currency)}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between sm:block">
                                      <div className="flex items-center gap-2">
                                        <p className="text-muted-foreground">Sinal (50%)</p>
                                        {order.sinal_paid ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Clock className="h-4 w-4 text-yellow-500" />
                                        )}
                                      </div>
                                      <p className="font-medium">
                                        {formatCurrency(order.sinal_value, order.product_currency)}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between sm:block">
                                      <div className="flex items-center gap-2">
                                        <p className="text-muted-foreground">Saldo</p>
                                        {order.balance_paid ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : order.sinal_paid ? (
                                          <Clock className="h-4 w-4 text-yellow-500" />
                                        ) : (
                                          <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                      </div>
                                      <p className="font-medium">
                                        {formatCurrency(order.balance_value, order.product_currency)}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Valor Total (100% à vista)</p>
                                      <p className="font-semibold text-lg text-primary">
                                        {formatCurrency(order.product_price, order.product_currency)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {order.sinal_paid || order.balance_paid ? (
                                        <>
                                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                                          <span className="text-sm font-medium text-green-500">Pago</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-5 w-5 text-yellow-500" />
                                          <span className="text-sm font-medium text-yellow-500">Pendente</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tracking */}
                            {(order.national_tracking || order.international_tracking) && (
                              <div className="border-t border-border/50 pt-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Truck className="h-4 w-4 text-primary" />
                                  <span className="text-muted-foreground">Rastreio:</span>
                                  <span className="font-mono font-medium">
                                    {order.national_tracking || order.international_tracking}
                                  </span>
                                  {order.national_carrier && (
                                    <span className="text-muted-foreground">
                                      ({order.national_carrier})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/rastreio/${order.order_id}`}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Rastrear
                                </Link>
                              </Button>

                              {order.budget_status === "APPROVED" && !order.balance_paid && order.sinal_paid && (
                                <Button size="sm" asChild>
                                  <Link to={`/pagamento/${order.budget_approval_token}`}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pagar Saldo
                                  </Link>
                                </Button>
                              )}

                              {order.budget_status === "SENT" && (
                                <Button size="sm" variant="default" asChild>
                                  <Link to={`/orcamento/${order.budget_approval_token}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Ver Orçamento
                                  </Link>
                                </Button>
                              )}

                              {order.budget_status === "APPROVED" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf?order_id=${order.order_id}&type=budget`, '_blank')}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  PDF
                                </Button>
                              )}

                              {order.inspection_photos && order.inspection_photos.length > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
                                  onClick={() => setSelectedOrderPhotos({ 
                                    photos: order.inspection_photos!, 
                                    productName: order.product_name 
                                  })}
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Fotos ({order.inspection_photos.length})
                                </Button>
                              )}

                              {order.current_status === "DELIVERED" && !reviewedOrders.has(order.order_id) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-primary/50 text-primary hover:bg-primary/10"
                                  onClick={() => setReviewOrder({ orderId: order.order_id, productName: order.product_name })}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Avaliar
                                </Button>
                              )}

                              {reviewedOrders.has(order.order_id) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  Avaliado
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4" ref={referralSectionRef}>
                {/* Vault Club Quick Info */}
                {!vaultMember && session && (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-primary" />
                        Bravenza Vault Club
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Acesso exclusivo a curadoria global de tênis raros e colecionáveis.
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full border-primary/50 hover:bg-primary/10">
                        <Link to="/vault">Saiba mais</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {session && (
                  <ReferralCard 
                    clientCpf={session.cpf}
                    clientName={session.client_name}
                  />
                )}
                
                {showPreferences && session && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <ClientPreferences 
                      clientCpf={session.cpf}
                      clientName={session.client_name}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Vault Tabs - Only visible if user is a vault member */}
          {vaultMember && session && (
            <>
              <TabsContent value="vault">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5 text-primary" />
                      Meu vault
                    </CardTitle>
                    <CardDescription>
                      Sua coleção certificada pelo Vault Club
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VaultMyItemsTab clientCpf={session.cpf} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wishlist">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      Wishlist e buscas
                    </CardTitle>
                    <CardDescription>
                      Gerencie seus itens desejados e acompanhe buscas ativas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VaultWishlistTab clientCpf={session.cpf} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="intel">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-primary" />
                      Intel
                    </CardTitle>
                    <CardDescription>
                      Conteúdo exclusivo, alertas de mercado e guias de curadoria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VaultIntelTab clientCpf={session.cpf} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="club">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Vault Club
                    </CardTitle>
                    <CardDescription>
                      Seu status no clube, convites e progresso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VaultClubTab 
                      clientCpf={session.cpf} 
                      member={vaultMember}
                      onMemberUpdate={refreshVaultMember}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="community">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Comunidade
                    </CardTitle>
                    <CardDescription>
                      Conecte-se com outros membros do Vault
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VaultCommunityTab 
                      clientCpf={session.cpf}
                      member={vaultMember}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Review Modal */}
        {reviewOrder && session && (
          <ReviewForm
            orderId={reviewOrder.orderId}
            productName={reviewOrder.productName}
            sessionToken={session.session_token}
            onClose={() => setReviewOrder(null)}
            onSubmitted={() => setReviewedOrders(prev => new Set([...prev, reviewOrder.orderId]))}
          />
        )}

        {/* Inspection Photos Gallery */}
        {selectedOrderPhotos && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Fotos de Inspeção - {selectedOrderPhotos.productName}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrderPhotos(null)}>
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <InspectionPhotosGallery 
                  photos={selectedOrderPhotos.photos} 
                  productName={selectedOrderPhotos.productName}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
