import { useOutletContext, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarketplace } from "@/hooks/useMarketplace";
import { MarketplaceOrdersView } from "@/components/client/vault/marketplace/MarketplaceOrdersView";

export default function MarketplaceOrdersPage2() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const navigate = useNavigate();
  const cpf = context?.cpf;
  const isLoggedIn = !!cpf && cpf !== "visitor";

  const {
    myOrders, mySales, fetchMyOrders, fetchMySales, updateOrderStatus, rateSeller,
  } = useMarketplace(cpf || null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchMyOrders();
    fetchMySales();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState
          icon={Package}
          title="Faça login para ver seus pedidos"
          description="Acesse sua conta para acompanhar suas compras e vendas no marketplace."
          action={{ label: "Fazer login", onClick: () => navigate("/entrar"), variant: "premium" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display">Meus Pedidos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe suas compras e vendas</p>
        </div>
      </div>

      <MarketplaceOrdersView
        orders={myOrders}
        sales={mySales}
        isVaultMember={true}
        clientCpf={cpf!}
        clientName={context?.profile?.full_name || ""}
        onRefreshOrders={fetchMyOrders}
        onRefreshSales={fetchMySales}
        onUpdateOrderStatus={updateOrderStatus}
        onRateSeller={rateSeller}
      />
    </div>
  );
}
