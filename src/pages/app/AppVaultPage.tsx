import { Suspense, lazy, useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Loader2, Crown, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VaultClubTab = lazy(() => import("@/components/client/vault/VaultClubTab").then(m => ({ default: m.VaultClubTab })));

export default function AppVaultPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMember = async () => {
    if (!cpf) {
      setLoading(false);
      return;
    }
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

  useEffect(() => { fetchMember(); }, [cpf]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!cpf || !member) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 pb-28 md:pb-12">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Vault Club</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Você ainda não é membro do Vault Club. Junte-se para ter acesso a benefícios exclusivos, curadoria personalizada e muito mais.
            </p>
            <Button asChild>
              <Link to="/vault" className="flex items-center gap-2">
                Conhecer o Vault Club
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
        <VaultClubTab clientCpf={cpf} member={member} onMemberUpdate={fetchMember} />
      </Suspense>
    </div>
  );
}
