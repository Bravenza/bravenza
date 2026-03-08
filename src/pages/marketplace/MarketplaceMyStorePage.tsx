import { useOutletContext, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { motion } from "framer-motion";
import {
  Store, Package, Megaphone, BarChart3, Tag, TrendingDown, HelpCircle,
  Plus, ShoppingBag, Rocket, Layout, Lock, Layers, Palette, PackageCheck,
  Eye, DollarSign, Star, ArrowRight, Zap, TrendingUp, Sparkles, Crown
} from "lucide-react";
import { CollectionsManager } from "@/components/marketplace/CollectionsManager";
import { PillTabs } from "@/components/ui/pill-tabs";
import { ConsignmentList } from "@/components/client/vault/marketplace/ConsignmentList";
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
const SellerAnalyticsDashboard = lazy(() => import("@/components/client/vault/marketplace/SellerAnalyticsDashboard").then(m => ({ default: m.SellerAnalyticsDashboard })));
import { SellerDashboardV2 } from "@/components/marketplace/SellerDashboardV2";
import { CouponsManager } from "@/components/client/vault/marketplace/CouponsManager";
import { PriceDropSuggestions } from "@/components/client/vault/marketplace/PriceDropSuggestions";
import { MarketplaceHowItWorks } from "@/components/client/vault/marketplace/MarketplaceHowItWorks";
import { SellerPlanBanner } from "@/components/marketplace/SellerPlanBanner";
import { BatchEditListings } from "@/components/marketplace/BatchEditListings";
import { PlanLimitModal } from "@/components/marketplace/PlanLimitModal";
import { useSellerPlan } from "@/hooks/marketplace/useSellerPlan";
import { StoreCustomizationPanel } from "@/components/marketplace/StoreCustomizationPanel";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VaultItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  colorway: string | null;
}

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

export default function MarketplaceMyStorePage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const navigate = useNavigate();
  const cpf = context?.cpf;
  const profile = context?.profile;
  const isLoggedIn = !!cpf && cpf !== "visitor";

  const {
    myListings, seller, fetchMyListings, updateListing, deleteListing,
    toggleFavorite, checkOnboardingStatus, completeOnboarding,
    fetchListingOffers, respondOffer, fetchPriceDropSuggestions, makeOffer,
  } = useMarketplace(cpf || null);

  const { searchProducts, createProduct, createOffer } = useMarketplaceCatalog(cpf || "visitor");

  const { enabled: enable_seller_dashboard_v2 } = useFeatureFlag("enable_seller_dashboard_v2");
  const [sellerSubTab, setSellerSubTab] = useState(enable_seller_dashboard_v2 ? "dashboard" : "anuncios");
  const [sellerOnboarded, setSellerOnboarded] = useState<boolean | null>(null);
  const [sellerKycStatus, setSellerKycStatus] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [listingOffers, setListingOffers] = useState<Record<string, any[]>>({});
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);

  const { status: planStatus, checkLimits } = useSellerPlan(seller?.id || null);

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

  // Fetch store customization data for header
  useEffect(() => {
    if (!seller?.id) return;
    supabase
      .from("vault_seller_profiles" as any)
      .select("full_name, storefront_tagline, avatar_url, storefront_banner")
      .eq("id", seller.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setStoreData(data); });
  }, [seller?.id]);

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
    if (planStatus && !planStatus.canPublish) {
      setLimitModalOpen(true);
      return null;
    }
    const result = await createOffer(data);
    if (result) {
      fetchMyListings();
      checkLimits();
    }
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Faça login para acessar sua loja</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">Acesse sua conta para gerenciar seus anúncios no marketplace.</p>
          <Button className="btn-gold gap-2 rounded-full h-12 px-8" onClick={() => navigate("/entrar")}>
            Fazer login <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const isSellerApproved = sellerOnboarded === true && sellerKycStatus === "approved";
  const isSellerPending = sellerOnboarded === true && sellerKycStatus === "pending_review";

  const planId = planStatus?.plan?.id || "free";
  const hasBatchAccess = planId === "pro" || planId === "elite";
  const hasStorefront = planId === "elite";
  const hasPaidPlan = planId === "pro" || planId === "elite";

  const sellerSubItems = [
    ...(enable_seller_dashboard_v2 && isSellerApproved ? [{ id: "dashboard", label: "Visão Geral", icon: BarChart3 }] : []),
    { id: "anuncios", label: "Anúncios", icon: Megaphone },
    ...(isSellerApproved ? [
      { id: "saldo", label: "Saldo", icon: DollarSign },
      { id: "personalizar", label: "Personalizar", icon: Palette },
      ...(hasPaidPlan ? [{ id: "boosts", label: "Boosts", icon: Rocket }] : []),
      ...(hasStorefront ? [{ id: "colecoes", label: "Coleções", icon: Layout }] : []),
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "cupons", label: "Cupons", icon: Tag },
      { id: "sugestoes", label: "Sugestões", icon: TrendingDown },
      { id: "full", label: "Full", icon: PackageCheck },
    ] : []),
    { id: "como-funciona", label: "Info", icon: HelpCircle },
  ];

  // Calculate KPIs
  const activeListings = myListings.filter(l => l.status === "active").length;
  const soldListings = myListings.filter(l => l.status === "sold").length;
  const totalViews = myListings.reduce((s, l) => s + (l.views_count || 0), 0);
  const totalRevenue = myListings.filter(l => l.status === "sold").reduce((s, l) => s + l.price, 0);

  const storeName = (storeData as any)?.full_name || profile?.full_name || "Minha Loja";
  const storeTagline = (storeData as any)?.storefront_tagline;
  const storeAvatar = (storeData as any)?.avatar_url || profile?.avatar_url;
  const initials = (storeName || "").split(" ").filter((n: string) => n.length > 0).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-6 pb-28 md:pb-12 space-y-5"
    >
      {/* ═══ Premium Header ═══ */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card shadow-sm">
          {/* Banner background with BRAVENZA watermark */}
          <div className="h-28 md:h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative overflow-hidden">
            {(storeData as any)?.storefront_banner ? (
              <img src={(storeData as any).storefront_banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                <span className="text-[5rem] md:text-[7rem] font-black tracking-[0.2em] text-primary/[0.06] uppercase whitespace-nowrap">
                  BRAVENZA
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>

          <div className="px-5 pb-5 -mt-10 relative z-10">
            <div className="flex items-end gap-4">
              <Avatar className="h-18 w-18 border-4 border-card shadow-lg ring-2 ring-primary/10" style={{ height: 72, width: 72 }}>
                <AvatarImage src={storeAvatar || undefined} alt={storeName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl md:text-2xl font-black tracking-tight truncate">{storeName}</h1>
                {storeTagline && <p className="text-xs text-muted-foreground truncate mt-0.5">{storeTagline}</p>}
              </div>
              {isSellerApproved && (
                <CreateListingDialog onSubmit={handleCreateOffer} searchProducts={searchProducts} createProduct={createProduct} vaultItems={vaultItems} />
              )}
              {isSellerPending && (
                <Badge variant="outline" className="border-warning/50 text-warning py-1.5 px-3 shrink-0">⏳ Em análise</Badge>
              )}
              {sellerOnboarded === false && (
                <Button className="btn-gold gap-2 rounded-full shrink-0" onClick={() => setOnboardingOpen(true)}>
                  <Plus className="h-4 w-4" /> Vender
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI Cards ═══ */}
      {isSellerApproved && seller && (
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { label: "Anúncios", value: activeListings, icon: Megaphone, accent: "bg-primary/10 text-primary" },
            { label: "Vendas", value: seller.total_sales_count || soldListings, icon: ShoppingBag, accent: "bg-emerald-500/10 text-emerald-600" },
            { label: "Views", value: totalViews, icon: Eye, accent: "bg-blue-500/10 text-blue-500" },
            { label: "Avaliação", value: seller.average_rating ? seller.average_rating.toFixed(1) : "—", icon: Star, accent: "bg-primary/10 text-primary" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
            >
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/30 hover:border-border/60 transition-colors shadow-sm">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", kpi.accent)}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black tracking-tight leading-none">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{kpi.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ═══ Plan Banner ═══ */}
      {planStatus && isSellerApproved && (
        <motion.div variants={fadeUp}>
          <SellerPlanBanner status={planStatus} />
        </motion.div>
      )}

      {/* ═══ Not onboarded ═══ */}
      {sellerOnboarded === false && (
        <motion.div variants={fadeUp} className="space-y-3">
          <Card className="border-primary/10 overflow-hidden shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <CardContent className="py-16 text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-black text-xl mb-2">Transforme seus sneakers em oportunidade</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Complete o cadastro de vendedor para acessar todas as ferramentas: anúncios, analytics, cupons e sugestões de preço.
                </p>
                <Button className="btn-gold rounded-full h-12 px-8 gap-2 font-bold shadow-lg shadow-primary/20" onClick={() => setOnboardingOpen(true)}>
                  Iniciar cadastro de vendedor <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </div>
          </Card>

          {/* Bravenza Full CTA */}
          <button
            onClick={() => navigate("/full")}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/8 to-primary/4 border border-primary/15 hover:border-primary/30 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Bravenza Full — 22%</p>
                <p className="text-[11px] text-muted-foreground">Envie seu par e a gente cuida de tudo</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      )}

      {/* ═══ Pending review ═══ */}
      {isSellerPending && (
        <motion.div variants={fadeUp}>
          <Card className="border-warning/20 shadow-sm overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-warning via-warning/60 to-transparent" />
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-warning border-t-transparent mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-1">Documentos em análise</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Sua documentação está sendo verificada pela nossa equipe. Você será notificado quando for aprovado.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══ Seller Hub ═══ */}
      {sellerOnboarded === true && (
        <div className="space-y-5">
          {/* Sub-navigation — pill style */}
          <motion.div variants={fadeUp}>
            <PillTabs
              items={sellerSubItems}
              value={sellerSubTab}
              onValueChange={(v) => {
                if (v === "saldo") { navigate("/app/loja/saldo"); return; }
                setSellerSubTab(v);
              }}
            />
          </motion.div>

          {/* ── Dashboard V2 ── */}
          {sellerSubTab === "dashboard" && isSellerApproved && cpf && (
            <SellerDashboardV2 cpf={cpf} />
          )}

          {/* ── Anúncios ── */}
          {sellerSubTab === "anuncios" && (
            <motion.div variants={fadeUp}>
              {myListings.length === 0 ? (
                <EmptySection
                  icon={Package}
                  title="Nenhum anúncio criado"
                  description="Comece a vender seus sneakers no marketplace"
                  action={isSellerApproved ? (
                    <CreateListingDialog onSubmit={handleCreateOffer} searchProducts={searchProducts} createProduct={createProduct} vaultItems={vaultItems} />
                  ) : undefined}
                />
              ) : (
                <div className="space-y-4">
                  {hasBatchAccess && myListings.length > 1 && (
                    <div className="flex justify-end">
                      <BatchEditListings
                        listings={myListings}
                        onUpdate={updateListing}
                        onDelete={deleteListing}
                        onRefresh={fetchMyListings}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {myListings.map((listing) => (
                      <div key={listing.id} className="relative space-y-2">
                        <MarketplaceListingCard
                          listing={listing}
                          onSelect={(l) => { setSelectedListing(l); setDetailOpen(true); }}
                          onToggleFavorite={() => toggleFavorite(listing.id)}
                        />
                        <Badge
                          className={cn(
                            "absolute top-12 right-2 text-[10px] z-10",
                            listing.status === "active" ? "bg-emerald-500/20 text-emerald-600"
                            : listing.status === "sold" ? "bg-primary/20 text-primary"
                            : listing.status === "reserved" ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground"
                          )}
                        >
                          {listing.status === "active" ? "Ativo" : listing.status === "sold" ? "Vendido" : listing.status === "reserved" ? "Reservado" : listing.status === "paused" ? "Pausado" : listing.status}
                        </Badge>
                        <div className="flex gap-1">
                          <EditListingDialog listing={listing} onUpdate={updateListing} onDelete={deleteListing} onRefresh={fetchMyListings} searchProducts={searchProducts} />
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
                </div>
              )}
            </motion.div>
          )}

          {/* ── Personalizar ── */}
          {sellerSubTab === "personalizar" && isSellerApproved && cpf && (
            <motion.div variants={fadeUp}>
              <StoreCustomizationPanel cpf={cpf} />
            </motion.div>
          )}

          {/* ── Analytics ── */}
          {sellerSubTab === "analytics" && isSellerApproved && cpf && (
            <motion.div variants={fadeUp}>
              <Suspense fallback={<div className="h-64 animate-pulse bg-muted/40 rounded-2xl" />}>
                <SellerAnalyticsDashboard clientCpf={cpf} />
              </Suspense>
            </motion.div>
          )}

          {/* ── Boosts ── */}
          {sellerSubTab === "boosts" && isSellerApproved && hasPaidPlan && (
            <motion.div variants={fadeUp}>
              <Card className="border-border/30 shadow-sm overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Rocket className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Destaques / Boosts</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                      Destaque seus anúncios para aparecer no topo das buscas.
                      Seu plano permite <strong className="text-foreground">{planStatus?.plan?.boost_slots || 1}</strong> boost(s) ativos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-center p-3 rounded-xl bg-muted/40 border border-border/30 max-w-xs mx-auto">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-[11px] text-muted-foreground text-left">
                      Para ativar, vá em <span className="font-semibold text-foreground">Anúncios</span> → clique no anúncio → <span className="font-semibold text-foreground">Destacar</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Coleções ── */}
          {sellerSubTab === "colecoes" && isSellerApproved && hasStorefront && cpf && (
            <motion.div variants={fadeUp}>
              <CollectionsManager clientCpf={cpf} myListings={myListings} />
            </motion.div>
          )}

          {/* ── Cupons ── */}
          {sellerSubTab === "cupons" && isSellerApproved && cpf && (
            <motion.div variants={fadeUp}>
              {hasBatchAccess ? (
                <CouponsManager clientCpf={cpf} />
              ) : (
                <LockedFeatureCard
                  icon={Tag}
                  title="Cupons de desconto"
                  description="Crie cupons personalizados para atrair mais compradores e aumentar suas vendas."
                  planLabel="Pro"
                  onUpgrade={() => navigate("/marketplace/planos")}
                />
              )}
            </motion.div>
          )}

          {/* ── Sugestões ── */}
          {sellerSubTab === "sugestoes" && isSellerApproved && (
            <motion.div variants={fadeUp}>
              {hasBatchAccess ? (
                <PriceDropSuggestions
                  fetchSuggestions={fetchPriceDropSuggestions}
                  onApplyDrop={handleApplyPriceDrop}
                />
              ) : (
                <LockedFeatureCard
                  icon={TrendingDown}
                  title="Sugestões de preço"
                  description="Receba recomendações inteligentes para ajustar preços e vender mais rápido."
                  planLabel="Pro"
                  onUpgrade={() => navigate("/marketplace/planos")}
                />
              )}
            </motion.div>
          )}

          {/* ── Bravenza Full ── */}
          {sellerSubTab === "full" && isSellerApproved && (
            <motion.div variants={fadeUp}>
              {seller?.id ? (
                <ConsignmentList sellerId={seller.id} />
              ) : (
                <EmptySection
                  icon={PackageCheck}
                  title="Bravenza Full"
                  description="Envie seu sneaker e nós cuidamos de tudo: fotos profissionais, autenticação, anúncio e envio ao comprador."
                  action={
                    <Button variant="outline" className="gap-2 rounded-full" onClick={() => navigate("/full")}>
                      Saiba mais <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              )}
            </motion.div>
          )}

          {/* ── Como funciona / Info ── */}
          {sellerSubTab === "como-funciona" && (
            <motion.div variants={fadeUp} className="space-y-4">
              {/* Current Plan Card */}
              {planStatus && (
                <Card className="border-primary/15 overflow-hidden shadow-sm">
                  <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary/25 to-transparent" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center",
                          planId === "elite" ? "bg-primary/15" :
                          planId === "pro" ? "bg-primary/10" :
                          "bg-muted/60"
                        )}>
                          {planId === "elite" ? <Crown className="h-5 w-5 text-primary" /> :
                           planId === "pro" ? <Zap className="h-5 w-5 text-primary" /> :
                           <Store className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Seu plano</p>
                          <p className="text-lg font-black tracking-tight capitalize">{planStatus.plan?.name || "Free"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">{planStatus.plan?.fee_percent ?? 14}%</p>
                        <p className="text-[10px] text-muted-foreground">comissão</p>
                      </div>
                    </div>
                    {planId !== "elite" && (
                      <Button
                        size="sm"
                        className="w-full mt-4 btn-gold gap-2 rounded-full font-bold"
                        onClick={() => navigate("/marketplace/planos")}
                      >
                        <Rocket className="h-3.5 w-3.5" /> Fazer upgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              <MarketplaceHowItWorks />
            </motion.div>
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

      {/* Plan Limit Modal */}
      <PlanLimitModal
        open={limitModalOpen}
        onOpenChange={setLimitModalOpen}
        reason={planStatus?.blockReason || null}
        currentPlan={planStatus?.plan?.id}
      />
    </motion.div>
  );
}

/* ─── Reusable Empty State ─── */
function EmptySection({ icon: Icon, title, description, action }: {
  icon: typeof Package; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/30 shadow-sm">
      <CardContent className="py-14 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-muted-foreground/25" />
        </div>
        <h3 className="font-bold text-base mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}

/* ─── Locked Feature Card ─── */
function LockedFeatureCard({ icon: Icon, title, description, planLabel, onUpgrade }: {
  icon: typeof Lock; title: string; description: string; planLabel: string; onUpgrade: () => void;
}) {
  return (
    <Card className="border-border/30 shadow-sm overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/10 to-transparent" />
      <CardContent className="p-6 text-center space-y-4">
        <div className="relative w-14 h-14 mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
            <Icon className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border-2 border-card flex items-center justify-center">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h3 className="font-black text-base">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-bold">
            Plano {planLabel}+
          </Badge>
        </div>
        <Button variant="outline" onClick={onUpgrade} className="gap-2 rounded-full">
          <Rocket className="h-3.5 w-3.5" /> Ver planos
        </Button>
      </CardContent>
    </Card>
  );
}
