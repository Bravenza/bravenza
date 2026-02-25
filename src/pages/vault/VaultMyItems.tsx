import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClientSession } from "@/hooks/useClientSession";
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

export default function VaultMyItems() {
  const { profile } = useClientSession();
  const session = profile ? { cpf: profile.cpf, client_name: profile.full_name } : null;
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.cpf) {
      fetchItems();
    }
  }, [session?.cpf]);

  const fetchItems = async () => {
    if (!session?.cpf) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_member_items", { p_cpf: session.cpf });
      
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Box className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Seu vault está vazio</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Quando você concluir compras pelo Vault Club, seus sneakers aparecerão aqui com Vault ID e certificado.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/app/wishlist">
            Criar wishlist
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Meu vault</h1>
        <p className="text-muted-foreground text-sm">
          {items.length} {items.length === 1 ? "item" : "itens"} na sua coleção
        </p>
      </div>

      {/* Items Grid - 4 columns on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <VaultItemCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}