import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductSearchStep } from "./create-listing/ProductSearchStep";
import { NewProductForm } from "./create-listing/NewProductForm";
import { OfferForm } from "./create-listing/OfferForm";
import { useConfig } from "@/hooks/useConfig";
import type { CatalogProduct } from "@/hooks/useMarketplaceCatalog";

type Step = "search" | "new-product" | "offer";

interface CreateListingDialogProps {
  onSubmit: (data: any) => Promise<any>;
  searchProducts: (query: string) => Promise<CatalogProduct[]>;
  createProduct: (data: any) => Promise<any>;
  vaultItems?: { id: string; title: string; brand: string | null; model: string | null; size: string | null; colorway: string | null }[];
}

export function CreateListingDialog({ onSubmit, searchProducts, createProduct, vaultItems = [] }: CreateListingDialogProps) {
  const { isEnabled } = useConfig();
  const catalogRequired = isEnabled("enable_catalog_required_for_new_listings");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const reset = () => {
    setStep("search");
    setSelectedProduct(null);
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setStep("offer");
  };

  const handleProductCreated = (product: any) => {
    // Map to CatalogProduct shape
    const catalogProduct: CatalogProduct = {
      id: product.id,
      slug: product.slug || "",
      brand: product.brand,
      model: product.model,
      colorway: product.colorway || null,
      sku: product.sku || null,
      release_date: null,
      retail_price: null,
      description: product.description || null,
      category: product.category || "sneakers",
      images: product.images || [],
      is_high_risk: false,
      total_offers: 0,
      lowest_price: null,
      created_at: product.created_at || new Date().toISOString(),
    };
    setSelectedProduct(catalogProduct);
    setStep("offer");
  };

  const handleOfferSubmit = async (data: any) => {
    const result = await onSubmit(data);
    if (result) {
      setOpen(false);
      reset();
    }
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="btn-gold gap-2">
          <Plus className="h-4 w-4" />
          Criar anúncio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "search" ? "Selecionar produto" : step === "new-product" ? "Cadastrar produto" : "Criar oferta"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {step === "search" && (
            <ProductSearchStep
              onSelectProduct={handleSelectProduct}
              onCreateNew={() => setStep("new-product")}
              searchProducts={searchProducts}
              vaultItems={vaultItems}
              catalogRequired={catalogRequired}
            />
          )}

          {step === "new-product" && (
            <NewProductForm
              onBack={() => setStep("search")}
              onCreated={handleProductCreated}
              createProduct={createProduct}
            />
          )}

          {step === "offer" && selectedProduct && (
            <OfferForm
              product={selectedProduct}
              onBack={() => { setStep("search"); setSelectedProduct(null); }}
              onSubmit={handleOfferSubmit}
              vaultItems={vaultItems}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
