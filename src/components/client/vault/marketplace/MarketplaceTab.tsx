import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Package, TrendingDown, ShoppingBag, BarChart3, Tag, Activity, Megaphone, HelpCircle, ChevronRight, Bot } from "lucide-react";
import { MarketplaceHowItWorks } from "./MarketplaceHowItWorks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { useMarketplaceCatalog } from "@/hooks/useMarketplaceCatalog";
import { MarketplaceListingCard } from "./MarketplaceListingCard";
import { CatalogProductCard } from "./CatalogProductCard";
import { CreateListingDialog } from "./CreateListingDialog";
import { EditListingDialog } from "./EditListingDialog";
import { ListingDetailSheet } from "./ListingDetailSheet";
// MarketplaceCheckoutDialog removed — checkout is now a full page
import { MarketplaceOrdersView } from "./MarketplaceOrdersView";
import { MarketplaceFilters, type MarketplaceFilterValues } from "./MarketplaceFilters";
import { SellerProfileSheet } from "./SellerProfileSheet";
import { OffersListDialog } from "./OffersListDialog";
import { SellerOnboardingDialog } from "./SellerOnboardingDialog";
import { PriceDropSuggestions } from "./PriceDropSuggestions";
import { AutoCutManager } from "./AutoCutManager";
import { useSellerPlan } from "@/hooks/marketplace/useSellerPlan";
const SellerAnalyticsDashboard = lazy(() => import("./SellerAnalyticsDashboard").then(m => ({ default: m.SellerAnalyticsDashboard })));
import { CouponsManager } from "./CouponsManager";
import { ActivityFeed } from "./ActivityFeed";
import { supabase } from "@/integrations/supabase/client";
import { RecentlyViewedSection } from "@/components/marketplace/home/RecentlyViewedSection";
import { LoyaltyPointsWidget } from "@/components/marketplace/LoyaltyPointsWidget";

interface MarketplaceTabProps {
  clientCpf: string;
  isVaultMember: boolean;
  buyerName?: string;
  buyerEmail?: string;
  initialSearch?: string;
}

interface VaultItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  colorway: string | null;
}

export function MarketplaceTab({ clientCpf, isVaultMember, buyerName, buyerEmail, initialSearch }: MarketplaceTabProps) {
  const {
    listings,
    myListings,
    seller,
    total,
    isLoading,
    myOrders,
    mySales,
    fetchListings,
    fetchMyListings,
    createListing,
    updateListing,
    deleteListing,
    toggleFavorite,
    createOrder,
    fetchMyOrders,
    fetchMySales,
    updateOrderStatus,
    rateSeller,
    makeOffer,
    fetchListingOffers,
    respondOffer,
    checkOnboardingStatus,
    completeOnboarding,
    fetchPriceDropSuggestions,
  } = useMarketplace(clientCpf);

  const { searchProducts, createProduct, createOffer, products: catalogProducts, totalProducts, isLoading: catalogLoading, fetchProducts: fetchCatalogProducts } = useMarketplaceCatalog(clientCpf);

  const [innerTab, setInnerTab] = useState("explorar");
  const [sellerSubTab, setSellerSubTab] = useState("anuncios");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // checkout is now page-based
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilterValues>({ sort: "recent", search: initialSearch });
  const [sellerProfileOpen, setSellerProfileOpen] = useState(false);
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
  const [listingOffers, setListingOffers] = useState<Record<string, any[]>>({});
  const [sellerOnboarded, setSellerOnboarded] = useState<boolean | null>(null);
  const [sellerKycStatus, setSellerKycStatus] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const { status: planStatus } = useSellerPlan(seller?.id || null);
  const isElitePlan = planStatus?.plan?.id === "elite";

  useEffect(() => {
    handleSearch();
    if (isVaultMember) {
      checkOnboardingStatus().then((res) => {
        setSellerOnboarded(res.onboarded);
        setSellerKycStatus(res.seller?.kyc_status || null);
      });
    }
  }, []);

  useEffect(() => {
    if (innerTab === "minha-loja" && isVaultMember) {
      fetchMyListings();
      fetchVaultItems();
    }
  }, [innerTab, isVaultMember]);

  // Fetch offers for my listings when tab is active
  useEffect(() => {
    if (innerTab === "minha-loja" && myListings.length > 0) {
      myListings.forEach(async (listing) => {
        const offers = await fetchListingOffers(listing.id);
        setListingOffers((prev) => ({ ...prev, [listing.id]: offers }));
      });
    }
  }, [innerTab, myListings.length]);

  const fetchVaultItems = async () => {
    // First get member id from CPF, then fetch their vault items
    const { data: member } = await supabase
      .from("vault_members")
      .select("id")
      .eq("client_cpf", clientCpf)
      .maybeSingle();
    
    if (!member) {
      setVaultItems([]);
      return;
    }

    const { data } = await supabase
      .from("vault_items")
      .select("id, title, brand, model, size, colorway")
      .eq("user_id", member.id)
      .order("created_at", { ascending: false });
    setVaultItems((data || []) as VaultItem[]);
  };

  const handleSelect = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setDetailOpen(true);
  };

  const tabNavigate = useNavigate();
  const handleBuy = (listing: MarketplaceListing) => {
    setDetailOpen(false);
    const group = {
      sellerId: listing.seller_id,
      sellerName: listing.seller?.member?.client_name || "Vendedor",
      items: [{
        id: listing.id,
        offer_id: listing.id,
        product_id: "",
        added_at: new Date().toISOString(),
        offer: {
          id: listing.id,
          price: listing.price,
          size: listing.size || "",
          condition: listing.condition,
          photos: listing.photos,
          shipping_mode: listing.shipping_mode,
          seller_id: listing.seller_id,
          status: listing.status,
          product: listing.brand ? { brand: listing.brand, model: listing.model || "", slug: null, images: listing.photos } : undefined,
          seller: listing.seller ? { id: listing.seller.id, member: listing.seller.member ? { client_name: listing.seller.member.client_name } : undefined } : undefined,
        },
      }],
      subtotal: listing.price,
    };
    tabNavigate("/marketplace/checkout", { state: { group } });
  };

  const handleViewSellerProfile = (sellerId: string) => {
    setDetailOpen(false);
    setSellerProfileId(sellerId);
    setSellerProfileOpen(true);
  };

  const handleMakeOffer = async (data: { listing_id: string; offer_price: number; message?: string }) => {
    return makeOffer({ ...data, buyer_name: buyerName });
  };

  const handleRespondOffer = async (offerId: string, action: string, extra?: any) => {
    const success = await respondOffer(offerId, action, extra);
    if (success) fetchMyListings();
    return success;
  };

  const handleSearch = () => {
    fetchCatalogProducts({
      search: filters.search,
      brand: filters.brand,
      category: filters.condition,
    });
    fetchListings({
      search: filters.search,
      brand: filters.brand,
      size: filters.size,
      condition: filters.condition,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      sort: filters.sort,
      favoritesOnly: filters.favoritesOnly,
      modality: filters.modality,
      trustedOnly: filters.trustedOnly,
    });
  };

  const handleApplyPriceDrop = async (listingId: string, newPrice: number) => {
    const success = await updateListing({ listing_id: listingId, price: newPrice });
    if (success) fetchMyListings();
    return success;
  };

  const handleToggleFavorite = async (listingId: string) => {
    await toggleFavorite(listingId);
    if (filters.favoritesOnly) {
      handleSearch();
    }
  };

  const handleCreateOffer = async (data: any) => {
    const result = await createOffer(data);
    if (result) {
      fetchMyListings();
      handleSearch();
    }
    return result;
  };

  const isSellerApproved = sellerOnboarded === true && sellerKycStatus === "approved";
  const isSellerPending = sellerOnboarded === true && sellerKycStatus === "pending_review";

  const sellerSubItems = [
    { id: "anuncios", label: "Meus anúncios", icon: Megaphone },
    ...(isSellerApproved ? [
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      ...(isElitePlan ? [{ id: "autocut", label: "AutoCut", icon: Bot }] : []),
      { id: "cupons", label: "Cupons", icon: Tag },
      { id: "sugestoes", label: "Sugestões", icon: TrendingDown },
    ] : []),
    { id: "como-funciona", label: "Como funciona", icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Marketplace
          </h2>
          <p className="text-sm text-muted-foreground">
            Compre e venda sneakers entre colecionadores
          </p>
        </div>
        {isSellerApproved && (
          <CreateListingDialog onSubmit={handleCreateOffer} searchProducts={searchProducts} createProduct={createProduct} vaultItems={vaultItems} />
        )}
        {isSellerPending && (
          <Badge variant="outline" className="border-warning/50 text-warning py-1.5 px-3">
            ⏳ Documentos em análise
          </Badge>
        )}
        {isVaultMember && sellerOnboarded === false && (
          <Button className="btn-gold" onClick={() => setOnboardingOpen(true)}>
            Começar a vender
          </Button>
        )}
      </div>

      <Tabs value={innerTab} onValueChange={setInnerTab}>
        <TabsList className="flex overflow-x-auto scrollbar-hide w-full justify-start gap-0.5 -mx-1 px-1">
          <TabsTrigger value="explorar" className="min-h-[44px] text-sm">Explorar</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-1.5 min-h-[44px] text-sm">
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="feed" className="gap-1.5 min-h-[44px] text-sm">
            <Activity className="h-3.5 w-3.5 shrink-0" />
            Feed
          </TabsTrigger>
          {isVaultMember && (
            <TabsTrigger value="minha-loja" className="gap-1.5 min-h-[44px] text-sm whitespace-nowrap">
              <Store className="h-3.5 w-3.5 shrink-0" />
              Minha loja
            </TabsTrigger>
          )}
        </TabsList>

        {/* Explorar */}
        <TabsContent value="explorar" className="mt-4 space-y-4">
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
          />

          {!catalogLoading && (
            <p className="text-xs text-muted-foreground">{totalProducts} modelo{totalProducts !== 1 ? "s" : ""} encontrado{totalProducts !== 1 ? "s" : ""}</p>
          )}

          {catalogLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Buscando modelos...</p>
              </div>
            </div>
          ) : catalogProducts.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-16 text-center">
                <Package className="h-14 w-14 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-semibold mb-1.5 text-foreground">Nenhum modelo encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {filters.search || filters.brand
                    ? "Tente ajustar os filtros para encontrar o que procura"
                    : "Nenhum produto cadastrado no catálogo ainda."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {catalogProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <CatalogProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Vistos recentemente */}
          <RecentlyViewedSection />
        </TabsContent>

        {/* Pedidos */}
        <TabsContent value="pedidos" className="mt-4 space-y-4">
          {/* Loyalty Points Widget */}
          <LoyaltyPointsWidget clientCpf={clientCpf} />

          <MarketplaceOrdersView
            orders={myOrders}
            sales={mySales}
            isVaultMember={isVaultMember}
            clientCpf={clientCpf}
            clientName={buyerName || ""}
            onRefreshOrders={fetchMyOrders}
            onRefreshSales={fetchMySales}
            onUpdateOrderStatus={updateOrderStatus}
            onRateSeller={rateSeller}
          />
        </TabsContent>

        {/* Feed */}
        <TabsContent value="feed" className="mt-4">
          <ActivityFeed clientCpf={clientCpf} />
        </TabsContent>

        {/* Minha Loja — seller hub */}
        {isVaultMember && (
          <TabsContent value="minha-loja" className="mt-4 space-y-4">
            {/* Seller not onboarded */}
            {sellerOnboarded === false && (
              <Card className="card-premium">
                <CardContent className="py-12 text-center">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <h3 className="font-medium mb-1">Comece a vender</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete o cadastro de vendedor para acessar as ferramentas
                  </p>
                  <Button className="btn-gold" onClick={() => setOnboardingOpen(true)}>
                    Iniciar cadastro
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Seller pending review */}
            {isSellerPending && (
              <Card className="card-premium border-warning/20">
                <CardContent className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-warning border-t-transparent mx-auto mb-4" />
                  <h3 className="font-medium mb-1">Documentos em análise</h3>
                  <p className="text-sm text-muted-foreground">
                    Sua documentação está sendo verificada pela nossa equipe. Você será notificado quando for aprovado.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Seller onboarded */}
            {sellerOnboarded === true && (
              <>
                {/* Sub-navigation */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
                  {sellerSubItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSellerSubTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        sellerSubTab === item.id
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Seller stats */}
                {seller && sellerSubTab === "anuncios" && (
                  <Card className="card-premium">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{seller.total_sales_count}</p>
                          <p className="text-xs text-muted-foreground">Vendas</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">{seller.current_fee_percent}%</p>
                          <p className="text-xs text-muted-foreground">Taxa atual</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{seller.average_rating ? seller.average_rating.toFixed(1) : "—"}</p>
                          <p className="text-xs text-muted-foreground">Avaliação</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Anúncios sub-tab */}
                {sellerSubTab === "anuncios" && (
                  <>
                    {myListings.length === 0 ? (
                      <Card className="card-premium">
                        <CardContent className="py-12 text-center">
                          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                          <h3 className="font-medium mb-1">Nenhum anúncio criado</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Comece a vender seus sneakers no marketplace
                          </p>
                          {isSellerApproved && (
                            <CreateListingDialog onSubmit={handleCreateOffer} searchProducts={searchProducts} createProduct={createProduct} vaultItems={vaultItems} />
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {myListings.map((listing) => (
                          <div key={listing.id} className="relative space-y-2">
                            <MarketplaceListingCard listing={listing} onSelect={handleSelect} onToggleFavorite={handleToggleFavorite} />
                            <Badge
                              className={`absolute top-12 right-2 text-xs z-10 ${
                                listing.status === "active" ? "bg-success/20 text-success"
                                : listing.status === "sold" ? "bg-primary/20 text-primary"
                                : listing.status === "reserved" ? "bg-warning/20 text-warning"
                                : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {listing.status === "active" ? "Ativo" : listing.status === "sold" ? "Vendido" : listing.status === "reserved" ? "Reservado" : listing.status === "paused" ? "Pausado" : listing.status === "draft" ? "Rascunho" : listing.status}
                            </Badge>
                            <div className="flex gap-1">
                              <EditListingDialog
                                listing={listing}
                                onUpdate={updateListing}
                                onDelete={deleteListing}
                                onRefresh={fetchMyListings}
                              />
                              <OffersListDialog
                                listingId={listing.id}
                                listingTitle={listing.title}
                                listingPrice={listing.price}
                                offers={listingOffers[listing.id] || []}
                                onRespond={handleRespondOffer}
                                onRefresh={() => fetchListingOffers(listing.id).then((o) => setListingOffers((p) => ({ ...p, [listing.id]: o })))}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Analytics sub-tab */}
                {sellerSubTab === "analytics" && isSellerApproved && (
                  <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
                    <SellerAnalyticsDashboard clientCpf={clientCpf} />
                  </Suspense>
                )}

                {/* Cupons sub-tab */}
                {sellerSubTab === "cupons" && isSellerApproved && (
                  <CouponsManager clientCpf={clientCpf} />
                )}

                {/* AutoCut sub-tab */}
                {sellerSubTab === "autocut" && isSellerApproved && seller && (
                  <AutoCutManager sellerId={seller.id} listings={myListings} />
                )}

                {/* Sugestões sub-tab */}
                {sellerSubTab === "sugestoes" && isSellerApproved && (
                  <PriceDropSuggestions
                    fetchSuggestions={fetchPriceDropSuggestions}
                    onApplyDrop={handleApplyPriceDrop}
                  />
                )}

                {/* Como funciona sub-tab */}
                {sellerSubTab === "como-funciona" && (
                  <MarketplaceHowItWorks />
                )}
              </>
            )}
          </TabsContent>
        )}
      </Tabs>

      <ListingDetailSheet
        listing={selectedListing}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFavorite={handleToggleFavorite}
        onBuy={handleBuy}
        onMakeOffer={handleMakeOffer}
        onViewSellerProfile={handleViewSellerProfile}
        isOwnListing={selectedListing?.seller_id === seller?.id}
      />

      {/* Checkout is now a full page */}

      <SellerProfileSheet
        sellerId={sellerProfileId}
        open={sellerProfileOpen}
        onOpenChange={setSellerProfileOpen}
        onSelectListing={handleSelect}
        onToggleFavorite={handleToggleFavorite}
        clientCpf={clientCpf}
      />

      <SellerOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onComplete={async (data, documents) => {
          const success = await completeOnboarding(data, documents);
          if (success) {
            setSellerOnboarded(true);
            setSellerKycStatus("pending_review");
          }
          return success;
        }}
      />
    </div>
  );
}
