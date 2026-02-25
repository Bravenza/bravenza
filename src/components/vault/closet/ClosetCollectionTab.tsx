import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ShoppingBag, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VaultItemCard } from "@/components/vault/VaultItemCard";
import { AddToClosetModal } from "./AddToClosetModal";

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
  marketplace_product_id?: string | null;
  purchase_price?: number | null;
  market_price?: number | null;
}

interface ClosetCollectionTabProps {
  items: VaultItem[];
  isLoading: boolean;
  onItemAdded: () => void;
  cpf: string;
  memberId: string;
}

export function ClosetCollectionTab({ items, isLoading, onItemAdded, cpf, memberId }: ClosetCollectionTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"} na coleção
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddModal(true)}
          className="gap-1.5 rounded-xl text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>

      {/* Value summary bar */}
      {items.length > 0 && <ValueSummary items={items} />}

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-semibold mb-1">Seu closet está vazio</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            Adicione sneakers da sua coleção para rastrear o valor de mercado
          </p>
          <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" />
            Adicionar primeiro item
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <VaultItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}

      <AddToClosetModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={onItemAdded}
        cpf={cpf}
        memberId={memberId}
      />
    </div>
  );
}

function ValueSummary({ items }: { items: VaultItem[] }) {
  const totalPurchase = items.reduce((sum, i) => sum + (i.purchase_price || i.purchase_value || 0), 0);
  const totalMarket = items.reduce((sum, i) => sum + (i.market_price || i.purchase_price || i.purchase_value || 0), 0);
  const diff = totalMarket - totalPurchase;
  const pct = totalPurchase > 0 ? ((diff / totalPurchase) * 100).toFixed(1) : "0";

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 flex items-center justify-between gap-2">
      <div className="text-center flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Investido</p>
        <p className="text-sm font-bold">{fmt(totalPurchase)}</p>
      </div>
      <div className="w-px h-8 bg-border/50" />
      <div className="text-center flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Mercado</p>
        <p className="text-sm font-bold">{fmt(totalMarket)}</p>
      </div>
      <div className="w-px h-8 bg-border/50" />
      <div className="text-center flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Variação</p>
        <div className="flex items-center justify-center gap-1">
          {diff > 0 ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : diff < 0 ? (
            <TrendingDown className="h-3 w-3 text-destructive" />
          ) : (
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={`text-sm font-bold ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {diff >= 0 ? "+" : ""}{pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
