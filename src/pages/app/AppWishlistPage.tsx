import { Suspense, lazy } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";

const VaultWishlistTab = lazy(() => import("@/components/client/vault/VaultWishlistTab").then(m => ({ default: m.VaultWishlistTab })));

export default function AppWishlistPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();
  if (!cpf) return null;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        <VaultWishlistTab clientCpf={cpf} />
      </Suspense>
    </div>
  );
}
