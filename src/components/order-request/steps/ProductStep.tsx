import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileSelect } from "@/components/ui/mobile-select";
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
    custom_model?: string;
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
  const models = selectedBrand ? getModelsForBrand(selectedBrand) : [];
  const isOtherModel = formData.product_model === "other";
  const isOtherBrand = selectedBrand === "other";

  const sizeOptions = SHOE_SIZES.map(size => ({ value: size, label: size }));
  const brandOptions = SNEAKER_BRANDS.map(brand => ({ value: brand.value, label: brand.label }));
  const modelOptions = models.map(model => ({ value: model.value, label: model.label }));

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
          <MobileSelect
            value={formData.shoe_size}
            onValueChange={(value) => updateField("shoe_size", value)}
            options={sizeOptions}
            placeholder="Selecione o tamanho"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_brand">Marca *</Label>
          <MobileSelect
            value={selectedBrand}
            onValueChange={onBrandChange}
            options={brandOptions}
            placeholder="Selecione a marca"
            className="h-12"
          />
        </div>

        {/* Campo de marca customizada quando "Outro" é selecionado */}
        {isOtherBrand && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="custom_brand">Nome da Marca *</Label>
            <Input
              id="custom_brand"
              value={formData.product_brand !== "other" ? formData.product_brand : ""}
              onChange={(e) => updateField("product_brand", e.target.value)}
              placeholder="Digite o nome da marca"
              className="h-12"
            />
          </div>
        )}

        {/* Seletor de modelo - só aparece se não for "Outro" na marca */}
        {!isOtherBrand && (
          <div className="space-y-2">
            <Label htmlFor="product_model">Modelo *</Label>
            <MobileSelect
              value={formData.product_model}
              onValueChange={(value) => {
                updateField("product_model", value);
                if (value !== "other") {
                  updateField("custom_model", "");
                }
              }}
              disabled={!selectedBrand}
              options={modelOptions}
              placeholder={selectedBrand ? "Selecione o modelo" : "Selecione a marca primeiro"}
              className="h-12"
            />
          </div>
        )}

        {/* Campo de modelo customizado quando "Outro" é selecionado no modelo OU na marca */}
        {(isOtherModel || isOtherBrand) && (
          <div className="space-y-2">
            <Label htmlFor="custom_model">Nome do Modelo *</Label>
            <Input
              id="custom_model"
              value={formData.custom_model || ""}
              onChange={(e) => updateField("custom_model", e.target.value)}
              placeholder="Digite o nome do modelo"
              className="h-12"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="product_color">Cor / Colorway *</Label>
          <Input
            id="product_color"
            value={formData.product_color}
            onChange={(e) => updateField("product_color", e.target.value)}
            placeholder="Ex: Triple Black, University Blue"
            className="h-12"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="product_link">Link de Referência (opcional)</Label>
          <Input
            id="product_link"
            type="text"
            inputMode="url"
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
