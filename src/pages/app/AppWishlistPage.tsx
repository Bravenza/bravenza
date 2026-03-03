import { Suspense, lazy } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Loader2, Star, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VaultWishlistTab = lazy(() => import("@/components/client/vault/VaultWishlistTab").then(m => ({ default: m.VaultWishlistTab })));

export default function AppWishlistPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();

  if (!cpf) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 pb-28 md:pb-12">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Wishlist</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Faça login para acessar sua wishlist e receber alertas quando os modelos que você procura estiverem disponíveis.
            </p>
            <Button asChild>
              <Link to="/entrar" className="flex items-center gap-2">
                Fazer login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        <VaultWishlistTab clientCpf={cpf} />
      </Suspense>
    </div>
  );
}
