import { Suspense, lazy, useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Loader2, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VaultCommunityTab = lazy(() => import("@/components/client/vault/VaultCommunityTab").then(m => ({ default: m.VaultCommunityTab })));

export default function AppCommunityPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cpf) {
      setLoading(false);
      return;
    }
    const fetchMember = async () => {
      try {
        const { data } = await supabase.rpc("get_vault_member", { p_cpf: cpf });
        if (data && Array.isArray(data) && data.length > 0) {
          setMember(data[0]);
        }
      } catch (err) {
        console.error("Error fetching vault member:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [cpf]);

  if (!cpf) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 pb-28 md:pb-12">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Comunidade</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Faça login para participar da comunidade, compartilhar sua coleção e interagir com outros colecionadores.
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        <VaultCommunityTab clientCpf={cpf} member={member} />
      </Suspense>
    </div>
  );
}
