import { useOutletContext } from "react-router-dom";
import { Store } from "lucide-react";

export default function MarketplaceMyStorePage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();

  if (!context?.cpf || context.cpf === "visitor") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Store className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Faça login para acessar sua loja</h2>
        <p className="text-sm text-muted-foreground">Acesse sua conta para gerenciar seus anúncios no marketplace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display mb-6">Minha loja</h1>
      <div className="rounded-2xl bg-card/50 border border-border/20 p-8 text-center">
        <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">Em breve: gerencie seus anúncios, analytics e cupons.</p>
      </div>
    </div>
  );
}
