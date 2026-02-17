import { useOutletContext } from "react-router-dom";
import { Package } from "lucide-react";

export default function MarketplaceOrdersPage2() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();

  if (!context?.cpf || context.cpf === "visitor") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Faça login para ver seus pedidos</h2>
        <p className="text-sm text-muted-foreground">Acesse sua conta para acompanhar suas compras e vendas no marketplace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display mb-6">Meus pedidos</h1>
      <div className="rounded-2xl bg-card/50 border border-border/20 p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">Você ainda não possui pedidos no marketplace.</p>
      </div>
    </div>
  );
}
