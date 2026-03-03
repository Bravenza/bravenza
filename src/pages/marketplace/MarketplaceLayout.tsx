import { Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useClientSession } from "@/hooks/useClientSession";
import { CartProvider } from "@/hooks/useMarketplaceCart";
import { MarketplaceHeader } from "./components/MarketplaceHeader";
import { MarketplaceBottomNav } from "./components/MarketplaceBottomNav";

const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));

export default function MarketplaceLayout() {
  const { profile, signOut } = useClientSession();
  const cpf = profile?.cpf || null;

  return (
    <CartProvider cpf={cpf}>
      <div className="min-h-screen bg-background flex flex-col theme-light">
        <MarketplaceHeader profile={profile} signOut={signOut} />

        <main className="flex-1">
          <Outlet context={{ cpf: profile?.cpf, profile }} />
        </main>

        <div className="pb-20 md:pb-0">
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>

        <MarketplaceBottomNav />
      </div>
    </CartProvider>
  );
}
