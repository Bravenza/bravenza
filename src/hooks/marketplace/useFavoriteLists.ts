import { useState, useCallback } from "react";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";

export interface FavoriteList {
  id: string;
  name: string;
  item_count: number;
  created_at: string;
}

export function useFavoriteLists(cpf: string | null) {
  const { toast } = useToast();
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!cpf) return;
    setIsLoading(true);
    try {
      const res = await marketplaceRequest(cpf, "favorite-lists:list");
      setLists(res.data || []);
    } catch (err) {
      console.error("Fetch favorite lists error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cpf]);

  const createList = useCallback(async (name: string) => {
    if (!cpf) return null;
    try {
      const res = await marketplaceRequest(cpf, "favorite-lists:create", "POST", { name });
      toast({ title: "Lista criada!", description: `"${name}" foi criada.` });
      await fetchLists();
      return res.data;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return null;
    }
  }, [cpf, toast, fetchLists]);

  const renameList = useCallback(async (listId: string, name: string) => {
    if (!cpf) return false;
    try {
      await marketplaceRequest(cpf, "favorite-lists:rename", "PUT", { list_id: listId, name });
      toast({ title: "Lista renomeada" });
      await fetchLists();
      return true;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return false;
    }
  }, [cpf, toast, fetchLists]);

  const deleteList = useCallback(async (listId: string) => {
    if (!cpf) return false;
    try {
      await marketplaceRequest(cpf, "favorite-lists:delete", "DELETE", undefined, { list_id: listId });
      toast({ title: "Lista removida" });
      await fetchLists();
      return true;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return false;
    }
  }, [cpf, toast, fetchLists]);

  const addItem = useCallback(async (listId: string, listingId: string) => {
    if (!cpf) return false;
    try {
      await marketplaceRequest(cpf, "favorite-lists:add-item", "POST", { list_id: listId, listing_id: listingId });
      return true;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return false;
    }
  }, [cpf, toast]);

  const removeItem = useCallback(async (listId: string, listingId: string) => {
    if (!cpf) return false;
    try {
      await marketplaceRequest(cpf, "favorite-lists:remove-item", "DELETE", undefined, { list_id: listId, listing_id: listingId });
      return true;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return false;
    }
  }, [cpf, toast]);

  const moveItems = useCallback(async (fromListId: string, toListId: string, listingIds: string[]) => {
    if (!cpf) return false;
    try {
      await marketplaceRequest(cpf, "favorite-lists:move-items", "POST", {
        from_list_id: fromListId,
        to_list_id: toListId,
        listing_ids: listingIds,
      });
      toast({ title: "Itens movidos!" });
      await fetchLists();
      return true;
    } catch (err) {
      toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
      return false;
    }
  }, [cpf, toast, fetchLists]);

  return {
    lists, isLoading, fetchLists,
    createList, renameList, deleteList,
    addItem, removeItem, moveItems,
  };
}
