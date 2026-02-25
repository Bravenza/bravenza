import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  brand: string;
  model: string;
  images: string[] | null;
  lowest_price: number | null;
}

interface AddToClosetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cpf: string;
  memberId: string;
}

export function AddToClosetModal({ open, onOpenChange, onSuccess, cpf, memberId }: AddToClosetModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"search" | "details">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const searchProducts = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from("marketplace_products")
        .select("id, brand, model, images, lowest_price")
        .eq("is_active", true)
        .or(`brand.ilike.%${q}%,model.ilike.%${q}%`)
        .order("total_offers", { ascending: false })
        .limit(20);
      setResults((data as Product[]) || []);
    } catch { setResults([]); }
    finally { setIsSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep("details");
  };

  const handleSave = async () => {
    if (!selectedProduct || !size) {
      toast({ title: "Preencha o tamanho", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("vault_items" as any).insert({
        user_id: memberId,
        title: `${selectedProduct.brand} ${selectedProduct.model}`,
        brand: selectedProduct.brand,
        model: selectedProduct.model,
        size,
        marketplace_product_id: selectedProduct.id,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        verified_status: "PENDING",
        inspection_photos: selectedProduct.images || [],
      } as any);

      if (error) throw error;

      toast({ title: "Item adicionado ao closet! 🎉" });
      onSuccess();
      resetAndClose();
    } catch (err) {
      console.error("Error adding item:", err);
      toast({ title: "Erro ao adicionar item", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetAndClose = () => {
    setStep("search");
    setQuery("");
    setResults([]);
    setSelectedProduct(null);
    setSize("");
    setPurchasePrice("");
    onOpenChange(false);
  };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else onOpenChange(o); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl gap-0 max-h-[85vh]">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">
            {step === "search" ? "Adicionar ao Closet" : "Detalhes do item"}
          </DialogTitle>
        </DialogHeader>

        {step === "search" ? (
          <div className="px-5 pb-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por marca ou modelo..."
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
              {isSearching && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && query.length >= 2 && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
                </div>
              )}

              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase truncate">{product.brand}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{product.model}</p>
                    {product.lowest_price && (
                      <p className="text-[10px] text-primary font-medium">Mercado: {fmt(product.lowest_price)}</p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {/* Selected product preview */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/40 shrink-0">
                  {selectedProduct.images?.[0] ? (
                    <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/20 m-auto mt-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{selectedProduct.brand}</p>
                  <p className="text-xs text-muted-foreground">{selectedProduct.model}</p>
                  {selectedProduct.lowest_price && (
                    <p className="text-xs text-primary font-medium">
                      Valor de mercado: {fmt(selectedProduct.lowest_price)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tamanho *</Label>
              <Input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Ex: 42, 10 US"
              />
            </div>

            <div className="space-y-2">
              <Label>Preço de compra (opcional)</Label>
              <Input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="R$ 0,00"
              />
              <p className="text-[10px] text-muted-foreground">
                Informe quanto você pagou para rastrear a valorização
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("search")} className="flex-1 rounded-xl">
                Voltar
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !size} className="flex-1 rounded-xl">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
