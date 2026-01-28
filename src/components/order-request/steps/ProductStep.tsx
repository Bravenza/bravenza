import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";
import { SNEAKER_BRANDS, getModelsForBrand } from "@/lib/sneaker-data";

const SHOE_SIZES = [
  "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"
];

interface ProductStepProps {
  formData: {
    shoe_size: string;
    product_brand: string;
    product_model: string;
    product_color: string;
    product_link: string;
  };
  selectedBrand: string;
  updateField: (field: string, value: string) => void;
  onBrandChange: (brand: string) => void;
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

export const ProductStep = ({
  formData,
  selectedBrand,
  updateField,
  onBrandChange,
  imagePreview,
  onImageChange,
  onRemoveImage,
}: ProductStepProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Informações do Tênis</h2>
          <p className="text-sm text-muted-foreground">Detalhes do produto que você deseja</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shoe_size">Tamanho (BR) *</Label>
          <Select
            value={formData.shoe_size}
            onValueChange={(value) => updateField("shoe_size", value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o tamanho" />
            </SelectTrigger>
            <SelectContent>
              {SHOE_SIZES.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_brand">Marca</Label>
          <Select
            value={selectedBrand}
            onValueChange={onBrandChange}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {SNEAKER_BRANDS.map((brand) => (
                <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_model">Modelo</Label>
          <Select
            value={formData.product_model}
            onValueChange={(value) => updateField("product_model", value)}
            disabled={!selectedBrand}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={selectedBrand ? "Selecione o modelo" : "Selecione a marca primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {selectedBrand && getModelsForBrand(selectedBrand).map((model) => (
                <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_color">Cor / Colorway</Label>
          <Input
            id="product_color"
            value={formData.product_color}
            onChange={(e) => updateField("product_color", e.target.value)}
            placeholder="Ex: Triple Black, University Blue"
            className="h-12"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="product_link">Link de Referência</Label>
          <Input
            id="product_link"
            type="url"
            value={formData.product_link}
            onChange={(e) => updateField("product_link", e.target.value)}
            placeholder="https://..."
            className="h-12"
          />
        </div>
      </div>

      {/* Image upload section */}
      <div className="pt-4 border-t border-border">
        <Label className="mb-3 block">Imagem de Referência (opcional)</Label>
        {imagePreview ? (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-48 object-contain rounded-lg border border-border bg-muted/50"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onRemoveImage}
            >
              Remover
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Clique para enviar uma imagem</span>
            <span className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageChange}
            />
          </label>
        )}
      </div>
    </div>
  );
};
