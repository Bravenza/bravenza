import { useOutletContext, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store, Package, Megaphone, BarChart3, Tag, TrendingDown, HelpCircle,
  Plus, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMarketplace, type MarketplaceListing } from "@/hooks/useMarketplace";
import { useMarketplaceCatalog } from "@/hooks/useMarketplaceCatalog";
import { MarketplaceListingCard } from "@/components/client/vault/marketplace/MarketplaceListingCard";
import { CreateListingDialog } from "@/components/client/vault/marketplace/CreateListingDialog";
import { EditListingDialog } from "@/components/client/vault/marketplace/EditListingDialog";
import { ListingDetailSheet } from "@/components/client/vault/marketplace/ListingDetailSheet";
import { OffersListDialog } from "@/components/client/vault/marketplace/OffersListDialog";
import { SellerOnboardingDialog } from "@/components/client/vault/marketplace/SellerOnboardingDialog";
import { SellerAnalyticsDashboard } from "@/components/client/vault/marketplace/SellerAnalyticsDashboard";
import { CouponsManager } from "@/components/client/vault/marketplace/CouponsManager";
import { PriceDropSuggestions } from "@/components/client/vault/marketplace/PriceDropSuggestions";
import { MarketplaceHowItWorks } from "@/components/client/vault/marketplace/MarketplaceHowItWorks";
import { supabase } from "@/integrations/supabase/client";

interface VaultItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  colorway: string | null;
}

export default function MarketplaceMyStorePage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const navigate = useNavigate();
  const cpf = context?.cpf;
  const isLoggedIn = !!cpf && cpf !== "visitor";

  const {
    myListings, seller, fetchMyListings, updateListing, deleteListing,
    toggleFavorite, checkOnboardingStatus, completeOnboarding,
    fetchListingOffers, respondOffer, fetchPriceDropSuggestions, makeOffer,
  } = useMarketplace(cpf || null);

  const { searchProducts, createProduct, createOffer } = useMarketplaceCatalog(cpf || "visitor");

  const [sellerSubTab, setSellerSubTab] = useState("anuncios");
  const [sellerOnboarded, setSellerOnboarded] = useState<boolean | null>(null);
  const [sellerKycStatus, setSellerKycStatus] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [listingOffers, setListingOffers] = useState<Record<string, any[]>>({});
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    checkOnboardingStatus().then((res) => {
      setSellerOnboarded(res.onboarded);
      setSellerKycStatus(res.seller?.kyc_status || null);
    });
    fetchMyListings();
    fetchVaultItems();
  }, [isLoggedIn]);

  useEffect(() => {
    if (myListings.length > 0) {
      myListings.forEach(async (listing) => {
        const offers = await fetchListingOffers(listing.id);
        setListingOffers((prev) => ({ ...prev, [listing.id]: offers }));
      });
    }
  }, [myListings.length]);

  const fetchVaultItems = async () => {
    if (!cpf) return;
    const { data: member } = await supabase
      .from("vault_members")
      .select("id")
      .eq("client_cpf", cpf)
      .maybeSingle();
    if (!member) return;
    const { data } = await supabase
      .from("vault_items")
      .select("id, title, brand, model, size, colorway")
      .eq("user_id", member.id)
      .order("created_at", { ascending: false });
    setVaultItems((data || []) as VaultItem[]);
  };

  const handleCreateOffer = async (data: any) => {
    const result = await createOffer(data);
    if (result) fetchMyListings();
    return result;
  };

  const handleRespondOffer = async (offerId: string, action: string, extra?: any) => {
    const success = await respondOffer(offerId, action, extra);
    if (success) fetchMyListings();
    return success;
  };

  const handleApplyPriceDrop = async (listingId: string, newPrice: number) => {
    const success = await updateListing({ listing_id: listingId, price: newPrice });
    if (success) fetchMyListings();
    return success;
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Store className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Faça login para acessar sua loja</h2>
        <p className="text-sm text-muted-foreground mb-6">Acesse sua conta para gerenciar seus anúncios no marketplace.</p>
        <Button className="btn-gold" onClick={() => navigate("/minha-conta")}>
          Fazer login
        </Button>
      </div>
    );
  }

  const isSellerApproved = sellerOnboarded === true && sellerKycStatus === "approved";
  const isSellerPending = sellerOnboarded === true && sellerKycStatus === "pending_review";

  const sellerSubItems = [
    { id: "anuncios", label: "Meus anúncios", icon: Megaphone },
    ...(isSellerApproved ? [
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "cupons", label: "Cupons", icon: Tag },
      { id: "sugestoes", label: "Sugestões", icon: TrendingDown },
    ] : []),
    { id: "como-funciona", label: "Como funciona", icon: HelpCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display">Minha Loja</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus anúncios e vendas</p>
          </div>
        </div>

        {isSellerApproved && (
          <CreateListingDialog onSubmit={handleCreateOffer} searchProducts={searchProducts} createProduct={createProduct} vaultItems={vaultItems} />
        )}
        {isSellerPending && (
          <Badge variant="outline" className="border-warning/50 text-warning py-1.5 px-3">
            ⏳ Documentos em análise
          </Badge>
        )}
        {sellerOnboarded === false && (
          <Button className="btn-gold gap-2" onClick={() => setOnboardingOpen(true)}>
            <Plus className="h-4 w-4" />
            Começar a vender
          </Button>
        )}
      </div>

      {/* Not onboarded */}
      {sellerOnboarded === false && (
        <Card className="border-primary/10">
          <CardContent className="py-16 text-center">
            <Store className="h-14 w-14 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Transforme seus sneakers em oportunidade</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Complete o cadastro de vendedor para acessar todas as ferramentas: anúncios, analytics, cupons e sugestões de preço.
            </p>
            <Button className="btn-gold" onClick={() => setOnboardingOpen(true)}>
              Iniciar cadastro de vendedor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending review */}
      {isSellerPending && (
        <Card className="border-warning/20">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-warning border-t-transparent mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Documentos em análise</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Sua documentação está sendo verificada pela nossa equipe. Você será notificado quando for aprovado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seller onboarded */}
      {sellerOnboarded === true && (
        <div className="space-y-6">
          {/* Sub-navigation */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
            {sellerSubItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSellerSubTab(item.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  sellerSubTab === item.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          {seller && sellerSubTab === "anuncios" && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-border/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black">{seller.total_sales_count}</p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </CardContent>
              </Card>
              <Card className="border-border/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-primary">{seller.current_fee_percent}%</p>
                  <p className="text-xs text-muted-foreground">Taxa atual</p>
                </CardContent>
              </Card>
              <Card className="border-border/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black">{seller.average_rating ? seller.average_rating.toFixed(1) : "—"}</p>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Anúncios */}
          {sellerSubTab === "anuncios" && (
            <>
              {myListings.length === 0 ? (
                <Card className="border-border/20">
                  <CardContent className="py-16 text-center">
                    <Package className="h-14 w-14 mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Nenhum anúncio criado</h3>
                    <p className="text-sm text-muted-foreground mb-4">Comece a vender seus sneakers no marketplace</p>
                    {isSellerApproved && (
                      <CreateListingDialog onSubmit={handleCreateOffer} searchProducts={searchProducts} createProduct={createProduct} vaultItems={vaultItems} />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myListings.map((listing) => (
                    <div key={listing.id} className="relative space-y-2">
                      <MarketplaceListingCard
                        listing={listing}
                        onSelect={(l) => { setSelectedListing(l); setDetailOpen(true); }}
                        onToggleFavorite={() => toggleFavorite(listing.id)}
                      />
                      <Badge
                        className={`absolute top-12 right-2 text-[10px] z-10 ${
                          listing.status === "active" ? "bg-success/20 text-success"
                          : listing.status === "sold" ? "bg-primary/20 text-primary"
                          : listing.status === "reserved" ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {listing.status === "active" ? "Ativo" : listing.status === "sold" ? "Vendido" : listing.status === "reserved" ? "Reservado" : listing.status === "paused" ? "Pausado" : listing.status}
                      </Badge>
                      <div className="flex gap-1">
                        <EditListingDialog listing={listing} onUpdate={updateListing} onDelete={deleteListing} onRefresh={fetchMyListings} />
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

          {/* Analytics */}
          {sellerSubTab === "analytics" && isSellerApproved && cpf && (
            <SellerAnalyticsDashboard clientCpf={cpf} />
          )}

          {/* Cupons */}
          {sellerSubTab === "cupons" && isSellerApproved && cpf && (
            <CouponsManager clientCpf={cpf} />
          )}

          {/* Sugestões */}
          {sellerSubTab === "sugestoes" && isSellerApproved && (
            <PriceDropSuggestions
              fetchSuggestions={fetchPriceDropSuggestions}
              onApplyDrop={handleApplyPriceDrop}
            />
          )}

          {/* Como funciona */}
          {sellerSubTab === "como-funciona" && (
            <MarketplaceHowItWorks />
          )}
        </div>
      )}

      {/* Detail sheet */}
      <ListingDetailSheet
        listing={selectedListing}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFavorite={async (id) => { await toggleFavorite(id); }}
        onBuy={() => {}}
        onMakeOffer={async () => false}
        onViewSellerProfile={() => {}}
        isOwnListing={true}
      />

      {/* Onboarding */}
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
