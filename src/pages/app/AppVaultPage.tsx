import { Suspense, lazy, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VaultClubTab = lazy(() => import("@/components/client/vault/VaultClubTab").then(m => ({ default: m.VaultClubTab })));

export default function AppVaultPage() {
  const { cpf } = useOutletContext<{ cpf?: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMember = async () => {
    if (!cpf) return;
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

  if (!cpf) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <VaultClubTab clientCpf={cpf} member={member} onMemberUpdate={fetchMember} />
        )}
      </Suspense>
    </div>
  );
}
