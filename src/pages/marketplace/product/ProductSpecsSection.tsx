import { useNavigate } from "react-router-dom";
import {
  Info, Hash, Calendar, Tag, DollarSign, Palette, ShoppingBag,
} from "lucide-react";
import { SpecRow } from "@/components/marketplace/SpecRow";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductSpecsSectionProps {
  product: {
    brand: string;
    model: string;
    sku: string | null;
    release_date: string | null;
    retail_price: number | null;
    colorway: string | null;
    description: string | null;
  };
}

export function ProductSpecsSection({ product }: ProductSpecsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl border border-border/20 p-6">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
          <Info className="h-4 w-4 text-primary" />
          Ficha Técnica
        </h3>
        <div className="rounded-xl border border-border/20 overflow-hidden">
          <SpecRow icon={<Hash className="h-3.5 w-3.5" />} label="SKU" value={product.sku || "—"} />
          <SpecRow icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" value={
            product.release_date
              ? format(parseISO(product.release_date), "dd/MM/yyyy", { locale: ptBR })
              : "—"
          } even />
          <SpecRow
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Marca"
            value={product.brand}
            onClick={() => navigate(`/app?q=${encodeURIComponent(product.brand)}`)}
          />
          <SpecRow
            icon={<ShoppingBag className="h-3.5 w-3.5" />}
            label="Silhueta"
            value={product.model}
            even
            onClick={() => navigate(`/app?q=${encodeURIComponent(product.model)}`)}
          />
          <SpecRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Preço de lançamento" value={
            product.retail_price
              ? `R$ ${product.retail_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : "—"
          } />
          <SpecRow icon={<Palette className="h-3.5 w-3.5" />} label="Colorway" value={product.colorway || "—"} even />
        </div>
      </div>

      {product.description && (
        <div className="bg-white rounded-2xl border border-border/20 p-6">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
            <Info className="h-4 w-4 text-primary" />
            Descrição
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}
    </div>
  );
}
