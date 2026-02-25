import { Suspense, lazy } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";

const VaultClubTab = lazy(() => import("@/components/client/vault/VaultClubTab").then(m => ({ default: m.VaultClubTab })));
const VaultMemberStatsCard = lazy(() => import("@/components/client/vault/VaultMemberStatsCard").then(m => ({ default: m.VaultMemberStatsCard })));

export default function AppVaultPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();
  if (!cpf) return null;
  // This page needs vault member data — will be fetched inside the tab
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        <p className="text-lg font-bold mb-4">Meu Status no Vault Club</p>
        <p className="text-sm text-muted-foreground mb-6">Seus benefícios, tier e estatísticas de membro</p>
        {/* The VaultClubTab and stats are complex — for now show a placeholder that links to the full dashboard */}
        <div className="text-center py-12 text-muted-foreground">
          <p>Em breve, seu status completo aparecerá aqui.</p>
          <p className="text-sm mt-2">Por enquanto, acesse pelo <a href="/minha-conta?tab=clube" className="text-primary underline">dashboard</a>.</p>
        </div>
      </Suspense>
    </div>
  );
}
