import { Suspense, lazy, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VaultCommunityTab = lazy(() => import("@/components/client/vault/VaultCommunityTab").then(m => ({ default: m.VaultCommunityTab })));

export default function AppCommunityPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cpf) return;
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

  if (!cpf) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <VaultCommunityTab clientCpf={cpf} member={member} />
        )}
      </Suspense>
    </div>
  );
}
