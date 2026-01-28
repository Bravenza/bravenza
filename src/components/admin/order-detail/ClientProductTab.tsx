import { useEffect, useState } from "react";
import { User, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCPF, formatPhone, cleanPhone } from "@/lib/constants";
import { SNEAKER_BRANDS, getModelsForBrand, getBrandLabel, getModelLabel, findBrandKey, findModelKey } from "@/lib/sneaker-data";
import { Order, AddressFields, SHOE_SIZES, BRAZILIAN_STATES } from "./types";

interface ClientProductTabProps {
  order: Order;
  editData: Partial<Order>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Order>>>;
  isEditing: boolean;
}

export const ClientProductTab = ({
  order,
  editData,
  setEditData,
  isEditing,
}: ClientProductTabProps) => {
  const [selectedBrandKey, setSelectedBrandKey] = useState("");
  const [selectedModelKey, setSelectedModelKey] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomModel, setShowCustomModel] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [addressFields, setAddressFields] = useState<AddressFields>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const availableModels = getModelsForBrand(selectedBrandKey);

  useEffect(() => {
    if (isEditing && order) {
      const brandKey = findBrandKey(order.product_brand);
      const modelKey = findModelKey(brandKey, order.product_model);
      
      setSelectedBrandKey(brandKey);
      setSelectedModelKey(modelKey);
      setShowCustomBrand(brandKey === "other");
      setShowCustomModel(modelKey === "other");
      
      parseAddressToFields(order.client_address);
    }
  }, [isEditing, order]);

  const parseAddressToFields = (address: string | null) => {
    if (!address) {
      setAddressFields({
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      });
      return;
    }
    
    const cepMatch = address.match(/CEP:\s*(\d{5}-?\d{3})/i);
    const cep = cepMatch ? cepMatch[1].replace("-", "") : "";
    
    const parts = address.split(",").map(p => p.trim());
    
    let street = "", number = "", complement = "", neighborhood = "", city = "", state = "";
    
    if (parts.length >= 1) street = parts[0];
    if (parts.length >= 2) {
      const numMatch = parts[1].match(/n[º°]?\s*(\S+)/i);
      if (numMatch) number = numMatch[1];
    }
    if (parts.length >= 4) {
      const lastPart = parts[parts.length - 1];
      const hasCep = lastPart.toLowerCase().includes("cep");
      
      if (hasCep && parts.length >= 5) {
        neighborhood = parts[2];
        const cityStateMatch = parts[parts.length - 2].match(/(.+)\s*-\s*(\w{2})/);
        if (cityStateMatch) {
          city = cityStateMatch[1].trim();
          state = cityStateMatch[2].trim();
        }
        if (parts.length >= 6) {
          complement = parts[2];
          neighborhood = parts[3];
        }
      } else if (parts.length >= 3) {
        neighborhood = parts[2];
        const cityStateMatch = parts[parts.length - 1].match(/(.+)\s*-\s*(\w{2})/);
        if (cityStateMatch) {
          city = cityStateMatch[1].trim();
          state = cityStateMatch[2].trim();
        }
      }
    }
    
    setAddressFields({ cep, street, number, complement, neighborhood, city, state });
  };

  const handleCepChange = async (value: string) => {
    const cleanedCep = value.replace(/\D/g, "");
    setAddressFields(prev => ({ ...prev, cep: cleanedCep }));
    
    if (cleanedCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddressFields(prev => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  useEffect(() => {
    if (isEditing) {
      const parts = [
        addressFields.street,
        addressFields.number ? `nº ${addressFields.number}` : "",
        addressFields.complement,
        addressFields.neighborhood,
        addressFields.city && addressFields.state ? `${addressFields.city} - ${addressFields.state}` : "",
        addressFields.cep ? `CEP: ${addressFields.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}` : "",
      ].filter(Boolean);
      
      const fullAddress = parts.join(", ");
      setEditData(prev => ({ ...prev, client_address: fullAddress }));
    }
  }, [isEditing, addressFields, setEditData]);

  const handleBrandChange = (value: string) => {
    setSelectedBrandKey(value);
    setSelectedModelKey("");
    setShowCustomModel(false);
    
    if (value === "other") {
      setShowCustomBrand(true);
      setEditData((prev) => ({ ...prev, product_brand: "", product_model: "" }));
    } else {
      setShowCustomBrand(false);
      const brandLabel = getBrandLabel(value);
      setEditData((prev) => ({ ...prev, product_brand: brandLabel, product_model: "" }));
    }
  };

  const handleModelChange = (value: string) => {
    setSelectedModelKey(value);
    
    if (value === "other") {
      setShowCustomModel(true);
      setEditData((prev) => ({ ...prev, product_model: "" }));
    } else {
      setShowCustomModel(false);
      const modelLabel = getModelLabel(selectedBrandKey, value);
      setEditData((prev) => ({ ...prev, product_model: modelLabel }));
    }
  };

  useEffect(() => {
    if (isEditing && editData.product_brand && editData.product_model) {
      const color = editData.product_color ? ` ${editData.product_color}` : "";
      const generatedName = `${editData.product_brand} ${editData.product_model}${color}`;
      setEditData((prev) => ({ ...prev, product_name: generatedName }));
    }
  }, [isEditing, editData.product_brand, editData.product_model, editData.product_color, setEditData]);

  const handlePhoneChange = (value: string) => {
    const cleaned = cleanPhone(value);
    if (cleaned.length <= 11) {
      setEditData((prev) => ({ ...prev, client_phone: formatPhone(cleaned) }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Cliente */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editData.client_name || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, client_name: e.target.value }))
                    }
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={formatCPF(order.client_cpf)}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editData.client_email || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, client_email: e.target.value }))
                    }
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editData.client_phone || ""}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Endereço de Entrega</Label>
                  {isFetchingCep && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>CEP *</Label>
                    <Input
                      value={addressFields.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Rua *</Label>
                    <Input
                      value={addressFields.street}
                      onChange={(e) => setAddressFields(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Nome da rua"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número *</Label>
                    <Input
                      value={addressFields.number}
                      onChange={(e) => setAddressFields(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="123"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input
                      value={addressFields.complement}
                      onChange={(e) => setAddressFields(prev => ({ ...prev, complement: e.target.value }))}
                      placeholder="Apto, Bloco..."
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro *</Label>
                    <Input
                      value={addressFields.neighborhood}
                      onChange={(e) => setAddressFields(prev => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Bairro"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade *</Label>
                    <Input
                      value={addressFields.city}
                      onChange={(e) => setAddressFields(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Cidade"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Select
                      value={addressFields.state}
                      onValueChange={(value) => setAddressFields(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.value} - {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{order.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{formatCPF(order.client_cpf)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.client_email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{order.client_phone || "-"}</p>
              </div>
              {order.client_address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{order.client_address}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produto */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Dados do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Select value={selectedBrandKey} onValueChange={handleBrandChange}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {SNEAKER_BRANDS.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCustomBrand && (
                    <Input
                      value={editData.product_brand || ""}
                      onChange={(e) => setEditData((prev) => ({ ...prev, product_brand: e.target.value }))}
                      placeholder="Digite a marca..."
                      className="bg-secondary/50 mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Select 
                    value={selectedModelKey} 
                    onValueChange={handleModelChange}
                    disabled={!selectedBrandKey}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder={selectedBrandKey ? "Selecione o modelo" : "Selecione a marca primeiro"} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCustomModel && (
                    <Input
                      value={editData.product_model || ""}
                      onChange={(e) => setEditData((prev) => ({ ...prev, product_model: e.target.value }))}
                      placeholder="Digite o modelo..."
                      className="bg-secondary/50 mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input
                    value={editData.product_name || ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, product_name: e.target.value }))}
                    placeholder="Nike Air Force 1 Low White"
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Gerado automaticamente
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tamanho *</Label>
                  <Select 
                    value={editData.product_size || ""} 
                    onValueChange={(value) => setEditData((prev) => ({ ...prev, product_size: value }))}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Tamanho" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {SHOE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cor/Colorway</Label>
                  <Input
                    value={editData.product_color || ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, product_color: e.target.value }))}
                    placeholder="Branco, Preto..."
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>SKU/Referência</Label>
                  <Input
                    value={editData.product_reference || ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, product_reference: e.target.value }))}
                    placeholder="CW2288-111"
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link de Referência</Label>
                <Input
                  type="url"
                  value={editData.product_link || ""}
                  onChange={(e) => setEditData((prev) => ({ ...prev, product_link: e.target.value }))}
                  placeholder="https://..."
                  className="bg-secondary/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {order.reference_image_url && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Imagem de Referência</p>
                  <img 
                    src={order.reference_image_url} 
                    alt="Referência do cliente" 
                    className="w-full max-h-48 object-contain rounded-lg border border-border bg-muted"
                  />
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{order.product_brand || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{order.product_model || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{order.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tamanho</p>
                  <p className="font-medium">{order.product_size || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cor</p>
                  <p className="font-medium">{order.product_color || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU/Ref</p>
                  <p className="font-medium">{order.product_reference || "-"}</p>
                </div>
                {order.product_link && (
                  <div className="md:col-span-3">
                    <p className="text-sm text-muted-foreground">Link</p>
                    <a 
                      href={order.product_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline truncate block"
                    >
                      {order.product_link}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
