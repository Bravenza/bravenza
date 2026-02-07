import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Package, TrendingDown, Percent, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { MarketplaceListingCard } from "./MarketplaceListingCard";
import { CreateListingDialog } from "./CreateListingDialog";
import { EditListingDialog } from "./EditListingDialog";
import { ListingDetailSheet } from "./ListingDetailSheet";
import { MarketplaceCheckoutDialog } from "./MarketplaceCheckoutDialog";
import { MarketplaceOrdersView } from "./MarketplaceOrdersView";
import { MarketplaceFilters, type MarketplaceFilterValues } from "./MarketplaceFilters";
import { SellerProfileSheet } from "./SellerProfileSheet";
import { OffersListDialog } from "./OffersListDialog";
import { supabase } from "@/integrations/supabase/client";

interface MarketplaceTabProps {
  clientCpf: string;
  isVaultMember: boolean;
  buyerName?: string;
  buyerEmail?: string;
}

interface VaultItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  colorway: string | null;
}

const feeTable = [
  { range: "0-2 vendas", fee: "14%" },
  { range: "3-5 vendas", fee: "12%" },
  { range: "6-10 vendas", fee: "10%" },
  { range: "11+ vendas", fee: "9%" },
];

export function MarketplaceTab({ clientCpf, isVaultMember, buyerName, buyerEmail }: MarketplaceTabProps) {
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
  } = useMarketplace(clientCpf);

  const [innerTab, setInnerTab] = useState("explorar");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutListing, setCheckoutListing] = useState<MarketplaceListing | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilterValues>({ sort: "recent" });
  const [sellerProfileOpen, setSellerProfileOpen] = useState(false);
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
  const [listingOffers, setListingOffers] = useState<Record<string, any[]>>({});

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    if (innerTab === "meus-anuncios" && isVaultMember) {
      fetchMyListings();
      fetchVaultItems();
    }
  }, [innerTab, isVaultMember]);

  // Fetch offers for my listings when tab is active
  useEffect(() => {
    if (innerTab === "meus-anuncios" && myListings.length > 0) {
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

  const handleBuy = (listing: MarketplaceListing) => {
    setDetailOpen(false);
    setCheckoutListing(listing);
    setCheckoutOpen(true);
  };

  const handleCheckoutConfirm = async (data: any) => {
    const result = await createOrder(data);
    if (result) {
      handleSearch();
      return result;
    }
    return null;
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
    fetchListings({
      search: filters.search,
      brand: filters.brand,
      size: filters.size,
      condition: filters.condition,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      sort: filters.sort,
      favoritesOnly: filters.favoritesOnly,
    });
  };

  const handleToggleFavorite = async (listingId: string) => {
    await toggleFavorite(listingId);
    if (filters.favoritesOnly) {
      handleSearch();
    }
  };

  const handleCreateListing = async (data: any) => {
    const result = await createListing(data);
    if (result) {
      fetchMyListings();
      handleSearch();
    }
    return result;
  };

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
            Compre e venda tênis entre colecionadores
          </p>
        </div>
        {isVaultMember && (
          <CreateListingDialog onSubmit={handleCreateListing} vaultItems={vaultItems} />
        )}
      </div>

      <Tabs value={innerTab} onValueChange={setInnerTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="explorar">Explorar</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            Pedidos
          </TabsTrigger>
          {isVaultMember && (
            <TabsTrigger value="meus-anuncios">Meus anúncios</TabsTrigger>
          )}
          <TabsTrigger value="como-funciona">Como funciona</TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explorar" className="mt-4 space-y-4">
          {/* Advanced Filters (includes active chips internally) */}
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
          />

          {/* Results count */}
          {!isLoading && (
            <p className="text-xs text-muted-foreground">{total} anúncio{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>
          )}

          {/* Listings Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Buscando anúncios...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-16 text-center">
                <Package className="h-14 w-14 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-semibold mb-1.5 text-foreground">Nenhum anúncio encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {filters.search || filters.condition || filters.size || filters.brand
                    ? "Tente ajustar os filtros para encontrar o que procura"
                    : "Seja o primeiro a anunciar no marketplace!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <MarketplaceListingCard
                    listing={listing}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="pedidos" className="mt-4">
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

        {/* My Listings Tab */}
        {isVaultMember && (
          <TabsContent value="meus-anuncios" className="mt-4 space-y-4">
            {seller && (
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

            {myListings.length === 0 ? (
              <Card className="card-premium">
                <CardContent className="py-12 text-center">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <h3 className="font-medium mb-1">Nenhum anúncio criado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comece a vender seus tênis no marketplace
                  </p>
                  <CreateListingDialog onSubmit={handleCreateListing} vaultItems={vaultItems} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myListings.map((listing) => (
                  <div key={listing.id} className="relative space-y-2">
                    <MarketplaceListingCard listing={listing} onSelect={handleSelect} onToggleFavorite={handleToggleFavorite} />
                    <Badge
                      className={`absolute top-2 right-2 text-xs ${
                        listing.status === "active" ? "bg-success/20 text-success"
                        : listing.status === "sold" ? "bg-primary/20 text-primary"
                        : listing.status === "reserved" ? "bg-warning/20 text-warning"
                        : listing.status === "paused" ? "bg-muted text-muted-foreground"
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
          </TabsContent>
        )}

        {/* How it works Tab */}
        <TabsContent value="como-funciona" className="mt-4 space-y-4">
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Taxa de serviço progressiva
              </CardTitle>
              <CardDescription>Quanto mais você vende, menor a taxa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feeTable.map((row) => (
                  <div key={row.range} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">
                    <span className="text-sm">{row.range}</span>
                    <Badge variant="outline" className="text-primary border-primary/30">{row.fee}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1 text-primary" />
                  A taxa diminui automaticamente conforme seu número de vendas aumenta.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { step: "1", title: "Crie seu anúncio", desc: "Descreva o produto, defina o preço e adicione fotos." },
                { step: "2", title: "Comprador finaliza a compra", desc: "O comprador paga via PIX ou cartão pelo Mercado Pago." },
                { step: "3", title: "Envie o produto", desc: "Envie direto ao comprador ou via Bravenza para autenticação." },
                { step: "4", title: "Período de proteção", desc: "O comprador tem 7 dias úteis para reportar problemas." },
                { step: "5", title: "Receba o pagamento", desc: "O valor é liberado via PIX, descontada a taxa de serviço." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
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

      <MarketplaceCheckoutDialog
        listing={checkoutListing}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onConfirm={handleCheckoutConfirm}
        buyerDefaults={{ name: buyerName, email: buyerEmail }}
      />

      <SellerProfileSheet
        sellerId={sellerProfileId}
        open={sellerProfileOpen}
        onOpenChange={setSellerProfileOpen}
        onSelectListing={handleSelect}
        onToggleFavorite={handleToggleFavorite}
        clientCpf={clientCpf}
      />
    </div>
  );
}
