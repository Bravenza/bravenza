import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Box, Shield, Gem, TrendingUp } from "lucide-react";
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

  const totalValue = items.reduce((acc, item) => acc + (item.purchase_value || 0), 0);
  const verifiedCount = items.filter((i) => i.verified_status === "VERIFIED").length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted/15 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="relative inline-flex">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Box className="h-9 w-9 text-primary/60" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Seu vault está vazio</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          Quando você concluir compras pelo Vault Club, seus sneakers aparecerão aqui com Vault ID único e certificado de autenticidade.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Collection Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -translate-y-4 translate-x-4" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gem className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{items.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {items.length === 1 ? "Peça" : "Peças"}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-full blur-xl -translate-y-4 translate-x-4" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{verifiedCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verificadas</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -translate-y-4 translate-x-4" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="text-lg font-bold tracking-tight leading-tight">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Valor total</p>
          </div>
        </div>
      </motion.div>

      {/* Collection Grid */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <VaultItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
