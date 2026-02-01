import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { VaultItemCard } from "@/components/vault/VaultItemCard";

interface VaultItem {
  id: string;
  vault_id: string;
  title: string;
  brand: string;
  model: string;
  colorway: string;
  size: string;
  verified_status: "VERIFIED" | "PENDING" | "REVOKED";
  inspection_photos: string[];
  certificate_pdf_url: string | null;
  qr_private_url: string | null;
  purchase_value: number;
  purchase_date: string;
}

interface VaultMyItemsTabProps {
  clientCpf: string;
}

export function VaultMyItemsTab({ clientCpf }: VaultMyItemsTabProps) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [clientCpf]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_member_items", { p_cpf: clientCpf });
      
      if (!error && data) {
        setItems(data as unknown as VaultItem[]);
      }
    } catch (error) {
      console.error("Error fetching vault items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Box className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Seu vault está vazio</h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
          Quando você concluir compras pelo Vault Club, seus tênis aparecerão aqui com Vault ID e certificado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "itens"} na sua coleção
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <VaultItemCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
