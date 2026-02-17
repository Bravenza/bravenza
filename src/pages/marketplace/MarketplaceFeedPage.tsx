import { useOutletContext } from "react-router-dom";
import { Activity } from "lucide-react";

export default function MarketplaceFeedPage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display mb-6">Feed</h1>
      <div className="rounded-2xl bg-card/50 border border-border/20 p-8 text-center">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">Em breve: acompanhe as novidades e atividades do marketplace.</p>
      </div>
    </div>
  );
}
