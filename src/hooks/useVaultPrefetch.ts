import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STALE } from "@/lib/query-config";

/**
 * Prefetches Vault member data (closet items, counts) in the background
 * so that navigating to the profile/closet pages feels instant.
 *
 * Should be called once in the app layout when the user is known to be a vault member.
 */
export function useVaultPrefetch(cpf: string | null, isVaultMember: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cpf || !isVaultMember) return;

    // Prefetch closet items
    queryClient.prefetchQuery({
      queryKey: ["vault", "items", cpf],
      queryFn: async () => {
        const { data, error } = await supabase.rpc("get_vault_member_items", { p_cpf: cpf });
        if (error) throw error;
        return data;
      },
      staleTime: STALE.SEMI_STATIC,
    });

    // Prefetch favorite count
    queryClient.prefetchQuery({
      queryKey: ["vault", "favorites-count", cpf],
      queryFn: async () => {
        const { count } = await supabase
          .from("favorite_list_items" as any)
          .select("id", { count: "exact", head: true })
          .eq("owner_cpf", cpf);
        return count ?? 0;
      },
      staleTime: STALE.SEMI_STATIC,
    });
  }, [cpf, isVaultMember, queryClient]);
}
