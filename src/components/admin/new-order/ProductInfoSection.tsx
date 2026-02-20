import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SNEAKER_BRANDS, getModelsForBrand, getBrandLabel, getModelLabel } from "@/lib/sneaker-data";

interface ProductInfoSectionProps {
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ProductInfoSection({ formData, setFormData }: ProductInfoSectionProps) {
  const [selectedBrandKey, setSelectedBrandKey] = useState("");
  const [selectedModelKey, setSelectedModelKey] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomModel, setShowCustomModel] = useState(false);

  const availableModels = getModelsForBrand(selectedBrandKey);

  const handleBrandChange = (value: string) => {
    setSelectedBrandKey(value);
    setSelectedModelKey("");
    setShowCustomModel(false);
    if (value === "other") {
      setShowCustomBrand(true);
      setFormData(prev => ({ ...prev, product_brand: "", product_model: "" }));
    } else {
      setShowCustomBrand(false);
      setFormData(prev => ({ ...prev, product_brand: getBrandLabel(value), product_model: "" }));
    }
  };

  const handleModelChange = (value: string) => {
    setSelectedModelKey(value);
    if (value === "other") {
      setShowCustomModel(true);
      setFormData(prev => ({ ...prev, product_model: "" }));
    } else {
      setShowCustomModel(false);
      setFormData(prev => ({ ...prev, product_model: getModelLabel(selectedBrandKey, value) }));
    }
  };

  // Auto-generate product name
  useEffect(() => {
    if (formData.product_brand && formData.product_model) {
      const color = formData.product_color ? ` ${formData.product_color}` : "";
      setFormData(prev => ({ ...prev, product_name: `${formData.product_brand} ${formData.product_model}${color}` }));
    }
  }, [formData.product_brand, formData.product_model, formData.product_color]);

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Card className="card-premium lg:col-span-2">
      <CardHeader>
        <CardTitle>Dados do Sneaker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Marca *</Label>
            <Select value={selectedBrandKey} onValueChange={handleBrandChange}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {SNEAKER_BRANDS.map(brand => (
                  <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showCustomBrand && (
              <Input value={formData.product_brand} onChange={updateField("product_brand")} placeholder="Digite a marca..." className="bg-secondary/50 mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Modelo *</Label>
            <Select value={selectedModelKey} onValueChange={handleModelChange} disabled={!selectedBrandKey}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder={selectedBrandKey ? "Selecione o modelo" : "Selecione a marca primeiro"} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {availableModels.map(model => (
                  <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showCustomModel && (
              <Input value={formData.product_model} onChange={updateField("product_model")} placeholder="Digite o modelo..." className="bg-secondary/50 mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_name">Nome completo *</Label>
            <Input id="product_name" value={formData.product_name} onChange={updateField("product_name")} placeholder="Nike Air Force 1 Low White" className="bg-secondary/50" required />
            <p className="text-xs text-muted-foreground">Gerado automaticamente a partir da marca, modelo e cor</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product_size">Tamanho *</Label>
            <Input id="product_size" value={formData.product_size} onChange={updateField("product_size")} placeholder="42, 10 US, 9 UK..." className="bg-secondary/50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_color">Cor/Colorway</Label>
            <Input id="product_color" value={formData.product_color} onChange={updateField("product_color")} placeholder="Branco, Preto/Vermelho..." className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_reference">SKU/Referência</Label>
            <Input id="product_reference" value={formData.product_reference} onChange={updateField("product_reference")} placeholder="CW2288-111" className="bg-secondary/50" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_link">Link de Referência</Label>
          <Input id="product_link" type="url" value={formData.product_link} onChange={updateField("product_link")} placeholder="https://stockx.com/..." className="bg-secondary/50" />
        </div>
      </CardContent>
    </Card>
  );
}
