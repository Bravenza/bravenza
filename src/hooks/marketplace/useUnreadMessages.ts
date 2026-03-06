import { useState, useEffect, useCallback } from "react";
import { marketplaceRequest } from "./api";

interface UnreadData {
  total: number;
  by_listing: Record<string, number>;
  by_order: Record<string, number>;
}

export function useUnreadMessages(cpf: string | null) {
  const [unread, setUnread] = useState<UnreadData>({ total: 0, by_listing: {}, by_order: {} });

  const fetch = useCallback(async () => {
    if (!cpf) return;
    try {
      const res = await marketplaceRequest(cpf, "unread-count");
      if (res.total !== undefined) setUnread(res);
    } catch {
      // silent
    }
  }, [cpf]);

  useEffect(() => { fetch(); }, [fetch]);

  return { unread, refetchUnread: fetch };
}
