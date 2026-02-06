import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Search, SlidersHorizontal, Package, TrendingDown, Percent, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { MarketplaceListingCard } from "./MarketplaceListingCard";
import { CreateListingDialog } from "./CreateListingDialog";
import { ListingDetailSheet } from "./ListingDetailSheet";
import { MarketplaceCheckoutDialog } from "./MarketplaceCheckoutDialog";
import { MarketplaceOrdersView } from "./MarketplaceOrdersView";
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
    deleteListing,
    toggleFavorite,
    createOrder,
    fetchMyOrders,
    fetchMySales,
    updateOrderStatus,
    rateSeller,
  } = useMarketplace(clientCpf);

  const [innerTab, setInnerTab] = useState("explorar");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutListing, setCheckoutListing] = useState<MarketplaceListing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);

  useEffect(() => {
    fetchListings({ sort: sortBy });
  }, [sortBy]);

  useEffect(() => {
    if (innerTab === "meus-anuncios" && isVaultMember) {
      fetchMyListings();
      fetchVaultItems();
    }
  }, [innerTab, isVaultMember]);

  const fetchVaultItems = async () => {
    const { data } = await supabase
      .from("vault_items")
      .select("id, title, brand, model, size, colorway")
      .eq("user_id", clientCpf)
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
      fetchListings({ sort: sortBy });
      return result;
    }
    return null;
  };

  const handleSearch = () => {
    fetchListings({ brand: searchQuery, sort: sortBy });
  };

  const handleCreateListing = async (data: any) => {
    const result = await createListing(data);
    if (result) {
      fetchMyListings();
      fetchListings({ sort: sortBy });
    }
    return result;
  };

  const filteredListings = searchQuery
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.model?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

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
          {/* Search & Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca, modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredListings.length === 0 ? (
            <Card className="card-premium">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                <h3 className="font-medium mb-1">Nenhum anúncio encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Tente outra busca"
                    : "Seja o primeiro a anunciar no marketplace!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredListings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <MarketplaceListingCard
                    listing={listing}
                    onSelect={handleSelect}
                    onToggleFavorite={toggleFavorite}
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
            onRefreshOrders={fetchMyOrders}
            onRefreshSales={fetchMySales}
            onUpdateOrderStatus={updateOrderStatus}
            onRateSeller={rateSeller}
          />
        </TabsContent>

        {/* My Listings Tab */}
        {isVaultMember && (
          <TabsContent value="meus-anuncios" className="mt-4 space-y-4">
            {/* Seller Stats */}
            {seller && (
              <Card className="card-premium">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{seller.total_sales_count}</p>
                      <p className="text-xs text-muted-foreground">Vendas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {seller.current_fee_percent}%
                      </p>
                      <p className="text-xs text-muted-foreground">Taxa atual</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {seller.average_rating
                          ? seller.average_rating.toFixed(1)
                          : "—"}
                      </p>
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
                  <div key={listing.id} className="relative">
                    <MarketplaceListingCard
                      listing={listing}
                      onSelect={handleSelect}
                      onToggleFavorite={toggleFavorite}
                    />
                    <Badge
                      className={`absolute top-2 right-2 text-xs ${
                        listing.status === "active"
                          ? "bg-success/20 text-success"
                          : listing.status === "sold"
                          ? "bg-primary/20 text-primary"
                          : listing.status === "reserved"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {listing.status === "active"
                        ? "Ativo"
                        : listing.status === "sold"
                        ? "Vendido"
                        : listing.status === "reserved"
                        ? "Reservado"
                        : listing.status === "draft"
                        ? "Rascunho"
                        : listing.status}
                    </Badge>
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
              <CardDescription>
                Quanto mais você vende, menor a taxa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feeTable.map((row) => (
                  <div
                    key={row.range}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30"
                  >
                    <span className="text-sm">{row.range}</span>
                    <Badge variant="outline" className="text-primary border-primary/30">
                      {row.fee}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1 text-primary" />
                  A taxa diminui automaticamente conforme seu número de vendas aumenta.
                  Apenas membros do Vault Club podem vender no marketplace.
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
                {
                  step: "1",
                  title: "Crie seu anúncio",
                  desc: "Descreva o produto, defina o preço e adicione fotos. Itens certificados pelo Vault têm destaque especial.",
                },
                {
                  step: "2",
                  title: "Comprador finaliza a compra",
                  desc: "O comprador paga via PIX ou cartão pelo Mercado Pago. O anúncio é reservado automaticamente.",
                },
                {
                  step: "3",
                  title: "Envie o produto",
                  desc: "Envie direto ao comprador ou via Bravenza para autenticação física e emissão de certificado Vault ID.",
                },
                {
                  step: "4",
                  title: "Período de proteção",
                  desc: "Após a entrega, o comprador tem 7 dias úteis para reportar problemas. Após esse prazo, o valor é liberado.",
                },
                {
                  step: "5",
                  title: "Receba o pagamento",
                  desc: "O valor é liberado via PIX/transferência, descontada a taxa de serviço progressiva.",
                },
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

      {/* Detail Sheet */}
      <ListingDetailSheet
        listing={selectedListing}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFavorite={toggleFavorite}
        onBuy={handleBuy}
        isOwnListing={selectedListing?.seller_id === seller?.id}
      />

      {/* Checkout Dialog */}
      <MarketplaceCheckoutDialog
        listing={checkoutListing}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onConfirm={handleCheckoutConfirm}
        buyerDefaults={{ name: buyerName, email: buyerEmail }}
      />
    </div>
  );
}
