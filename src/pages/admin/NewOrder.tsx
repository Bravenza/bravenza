import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateOrderId, cleanCPF, formatCPF, validateCPF, cleanPhone, formatPhone, validatePhone, validateEmail, formatCurrency } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SNEAKER_BRANDS, getModelsForBrand, getBrandLabel, getModelLabel } from "@/lib/sneaker-data";
import { calculateProductPrice, DEFAULT_MULTIPLIER, roundUpTo90 } from "@/lib/budget-calculator";

const orderSchema = z.object({
  order_type: z.enum(["VAULT", "READY"]),
  client_name: z.string().min(5, "Nome completo deve ter no mínimo 5 caracteres"),
  client_cpf: z.string().refine((val) => validateCPF(val), "CPF inválido"),
  client_email: z.string().min(1, "Email é obrigatório").refine((val) => validateEmail(val), "Email inválido"),
  client_phone: z.string().refine((val) => validatePhone(val), "Telefone inválido (mínimo 10 dígitos com DDD)"),
  client_cep: z.string().min(8, "CEP é obrigatório"),
  client_street: z.string().min(3, "Rua é obrigatória"),
  client_number: z.string().min(1, "Número é obrigatório"),
  client_neighborhood: z.string().min(2, "Bairro é obrigatório"),
  client_city: z.string().min(2, "Cidade é obrigatória"),
  client_state: z.string().length(2, "Estado deve ter 2 caracteres (UF)"),
  client_complement: z.string().optional(),
  product_brand: z.string().min(1, "Marca obrigatória"),
  product_model: z.string().min(1, "Modelo obrigatório"),
  product_name: z.string().min(2, "Nome do produto obrigatório"),
  product_size: z.string().min(1, "Tamanho obrigatório"),
  product_color: z.string().optional(),
  product_reference: z.string().optional(),
  product_link: z.string().url("URL inválida").optional().or(z.literal("")),
  product_cost: z.number().positive("Custo total é obrigatório"),
  product_price: z.number().positive("Preço será calculado automaticamente").optional(),
  sinal_value: z.number().min(0, "Valor inválido").optional(),
  balance_value: z.number().min(0, "Valor inválido").optional(),
  internal_notes: z.string().optional(),
});

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar seletores
  const [selectedBrandKey, setSelectedBrandKey] = useState("");
  const [selectedModelKey, setSelectedModelKey] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomModel, setShowCustomModel] = useState(false);

  const [formData, setFormData] = useState({
    order_type: "VAULT" as "VAULT" | "READY",
    client_name: "",
    client_cpf: "",
    client_cep: "",
    client_street: "",
    client_number: "",
    client_complement: "",
    client_neighborhood: "",
    client_city: "",
    client_state: "",
    client_email: "",
    client_phone: "",
    product_brand: "",
    product_model: "",
    product_name: "",
    product_size: "",
    product_color: "",
    product_reference: "",
    product_link: "",
    product_cost: "",
    product_price: "",
    sinal_value: "",
    balance_value: "",
    internal_notes: "",
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          client_street: data.logradouro || "",
          client_neighborhood: data.bairro || "",
          client_city: data.localidade || "",
          client_state: data.uf || "",
          client_complement: data.complemento || "",
        }));
        toast({
          title: "Endereço encontrado!",
          description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado ou preencha o endereço manualmente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço. Preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Handler para mudança de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    // Formatar CEP: 00000-000
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    
    setFormData((prev) => ({ ...prev, client_cep: value }));
    
    // Auto-buscar quando tiver 8 dígitos
    if (value.replace(/\D/g, "").length === 8) {
      fetchAddressByCep(value);
    }
  };

  // Atualiza modelos disponíveis quando a marca muda
  const availableModels = getModelsForBrand(selectedBrandKey);

  // Handler para mudança de marca
  const handleBrandChange = (value: string) => {
    setSelectedBrandKey(value);
    setSelectedModelKey("");
    setShowCustomModel(false);
    
    if (value === "other") {
      setShowCustomBrand(true);
      setFormData((prev) => ({ ...prev, product_brand: "", product_model: "" }));
    } else {
      setShowCustomBrand(false);
      const brandLabel = getBrandLabel(value);
      setFormData((prev) => ({ ...prev, product_brand: brandLabel, product_model: "" }));
    }
  };

  // Handler para mudança de modelo
  const handleModelChange = (value: string) => {
    setSelectedModelKey(value);
    
    if (value === "other") {
      setShowCustomModel(true);
      setFormData((prev) => ({ ...prev, product_model: "" }));
    } else {
      setShowCustomModel(false);
      const modelLabel = getModelLabel(selectedBrandKey, value);
      setFormData((prev) => ({ ...prev, product_model: modelLabel }));
    }
  };

  // Gerar nome completo automaticamente
  useEffect(() => {
    if (formData.product_brand && formData.product_model) {
      const color = formData.product_color ? ` ${formData.product_color}` : "";
      const generatedName = `${formData.product_brand} ${formData.product_model}${color}`;
      setFormData((prev) => ({ ...prev, product_name: generatedName }));
    }
  }, [formData.product_brand, formData.product_model, formData.product_color]);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = cleanCPF(value);
    if (cleaned.length <= 11) {
      setFormData((prev) => ({ ...prev, client_cpf: formatCPF(cleaned) }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = cleanPhone(value);
    if (cleaned.length <= 11) {
      setFormData((prev) => ({ ...prev, client_phone: formatPhone(cleaned) }));
    }
  };

  // Handler para mudança de custo - calcula preço automaticamente
  const handleCostChange = (value: string) => {
    const cost = parseFloat(value) || 0;
    if (cost > 0) {
      const calculatedPrice = calculateProductPrice(cost, DEFAULT_MULTIPLIER);
      const halfPrice = calculatedPrice / 2;
      setFormData((prev) => ({
        ...prev,
        product_cost: value,
        product_price: calculatedPrice.toFixed(2),
        sinal_value: halfPrice.toFixed(2),
        balance_value: halfPrice.toFixed(2),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        product_cost: value,
        product_price: "",
        sinal_value: "",
        balance_value: "",
      }));
    }
  };

  // Handler para ajuste manual do preço (mantendo regra do ,90)
  const handlePriceOverride = (value: string) => {
    const price = parseFloat(value) || 0;
    if (price > 0) {
      const roundedPrice = roundUpTo90(price);
      const halfPrice = roundedPrice / 2;
      setFormData((prev) => ({
        ...prev,
        product_price: roundedPrice.toFixed(2),
        sinal_value: halfPrice.toFixed(2),
        balance_value: halfPrice.toFixed(2),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        product_price: value,
        sinal_value: "",
        balance_value: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedCPF = cleanCPF(formData.client_cpf);
    const cleanedPhone = cleanPhone(formData.client_phone);
    const cleanedCep = formData.client_cep.replace(/\D/g, "");

    const productCost = formData.product_cost ? parseFloat(formData.product_cost) : 0;
    const productPrice = formData.product_price ? parseFloat(formData.product_price) : calculateProductPrice(productCost, DEFAULT_MULTIPLIER);

    try {
      orderSchema.parse({
        ...formData,
        client_cpf: cleanedCPF,
        client_phone: cleanedPhone,
        client_cep: cleanedCep,
        product_cost: productCost,
        product_price: productPrice,
        sinal_value: formData.sinal_value
          ? parseFloat(formData.sinal_value)
          : undefined,
        balance_value: formData.balance_value
          ? parseFloat(formData.balance_value)
          : undefined,
      });
    } catch (err: any) {
      const errors = JSON.parse(err.message);
      toast({
        title: "Erro de validação",
        description: errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const orderId = generateOrderId();
      const now = new Date();
      const slaDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Calcular sinal e saldo automaticamente se não informados
      const sinalValue = formData.sinal_value 
        ? parseFloat(formData.sinal_value) 
        : productPrice * 0.5;
      const balanceValue = formData.balance_value 
        ? parseFloat(formData.balance_value) 
        : productPrice - sinalValue;

      // Montar endereço completo a partir dos campos
      const addressParts = [
        formData.client_street,
        formData.client_number ? `nº ${formData.client_number}` : "",
        formData.client_complement,
        formData.client_neighborhood,
        formData.client_city && formData.client_state 
          ? `${formData.client_city} - ${formData.client_state}` 
          : formData.client_city || formData.client_state,
        formData.client_cep ? `CEP: ${formData.client_cep}` : "",
      ].filter(Boolean).join(", ");

      const productCost = formData.product_cost ? parseFloat(formData.product_cost) : null;

      const orderData = {
        order_id: orderId,
        order_type: formData.order_type,
        current_status: "REQUEST_RECEIVED" as const,
        client_name: formData.client_name,
        client_cpf: cleanedCPF,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        client_address: addressParts || null,
        product_brand: formData.product_brand || null,
        product_model: formData.product_model || null,
        product_name: formData.product_name,
        product_size: formData.product_size || null,
        product_color: formData.product_color || null,
        product_reference: formData.product_reference || null,
        product_link: formData.product_link || null,
        product_cost: productCost,
        product_price: productPrice,
        sinal_value: sinalValue,
        balance_value: balanceValue,
        internal_notes: formData.internal_notes || null,
        sla_vault_due_date:
          formData.order_type === "VAULT"
            ? slaDate.toISOString().split("T")[0]
            : null,
      };

      const { error: orderError } = await supabase
        .from("orders")
        .insert(orderData);

      if (orderError) throw orderError;

      // Add initial history entry
      const { error: historyError } = await supabase
        .from("order_history")
        .insert({
          order_id: orderId,
          status: "REQUEST_RECEIVED" as const,
          notes: "Solicitação recebida",
        });

      if (historyError) throw historyError;

      toast({
        title: "Pedido criado!",
        description: `Pedido ${orderId} criado com sucesso.`,
      });

      navigate(`/admin/pedidos/${orderId}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao criar pedido",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/pedidos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Pedido</h1>
          <p className="text-muted-foreground">
            Preencha os dados do novo pedido
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order type */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Tipo de Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.order_type}
                onValueChange={(value: "VAULT" | "READY") =>
                  setFormData((prev) => ({ ...prev, order_type: value }))
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAULT">VAULT - Sourcing internacional</SelectItem>
                  <SelectItem value="READY">READY - Pronta entrega</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {formData.order_type === "VAULT"
                  ? "Produto será buscado internacionalmente. Prazo: 30 dias."
                  : "Produto disponível para envio imediato."}
              </p>
            </CardContent>
          </Card>

          {/* Client info */}
          <Card className="card-premium lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome completo *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        client_name: e.target.value,
                      }))
                    }
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_cpf">CPF *</Label>
                  <Input
                    id="client_cpf"
                    value={formData.client_cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    className="bg-secondary/50"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        client_email: e.target.value,
                      }))
                    }
                    placeholder="email@exemplo.com"
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone *</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="bg-secondary/50"
                    required
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Endereço de Entrega *</h4>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_cep">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="client_cep"
                        value={formData.client_cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        className="bg-secondary/50"
                        maxLength={9}
                        required
                      />
                      {isLoadingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="client_street">Rua / Logradouro *</Label>
                    <Input
                      id="client_street"
                      value={formData.client_street}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_street: e.target.value,
                        }))
                      }
                      placeholder="Rua, Avenida, etc."
                      className="bg-secondary/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_number">Número *</Label>
                    <Input
                      id="client_number"
                      value={formData.client_number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_number: e.target.value,
                        }))
                      }
                      placeholder="123"
                      className="bg-secondary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_complement">Complemento</Label>
                    <Input
                      id="client_complement"
                      value={formData.client_complement}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_complement: e.target.value,
                        }))
                      }
                      placeholder="Apto, Bloco..."
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_neighborhood">Bairro *</Label>
                    <Input
                      id="client_neighborhood"
                      value={formData.client_neighborhood}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_neighborhood: e.target.value,
                        }))
                      }
                      placeholder="Bairro"
                      className="bg-secondary/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="client_city">Cidade *</Label>
                    <Input
                      id="client_city"
                      value={formData.client_city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_city: e.target.value,
                        }))
                      }
                      placeholder="Cidade"
                      className="bg-secondary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_state">Estado *</Label>
                    <Input
                      id="client_state"
                      value={formData.client_state}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_state: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="UF"
                      maxLength={2}
                      className="bg-secondary/50"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product info */}
          <Card className="card-premium lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados do Tênis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Marca Selector */}
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
                      value={formData.product_brand}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          product_brand: e.target.value,
                        }))
                      }
                      placeholder="Digite a marca..."
                      className="bg-secondary/50 mt-2"
                    />
                  )}
                </div>

                {/* Modelo Selector */}
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
                      value={formData.product_model}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          product_model: e.target.value,
                        }))
                      }
                      placeholder="Digite o modelo..."
                      className="bg-secondary/50 mt-2"
                    />
                  )}
                </div>

                {/* Nome completo (auto-gerado) */}
                <div className="space-y-2">
                  <Label htmlFor="product_name">Nome completo *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_name: e.target.value,
                      }))
                    }
                    placeholder="Nike Air Force 1 Low White"
                    className="bg-secondary/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Gerado automaticamente a partir da marca, modelo e cor
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_size">Tamanho *</Label>
                  <Input
                    id="product_size"
                    value={formData.product_size}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_size: e.target.value,
                      }))
                    }
                    placeholder="42, 10 US, 9 UK..."
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_color">Cor/Colorway</Label>
                  <Input
                    id="product_color"
                    value={formData.product_color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_color: e.target.value,
                      }))
                    }
                    placeholder="Branco, Preto/Vermelho..."
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_reference">SKU/Referência</Label>
                  <Input
                    id="product_reference"
                    value={formData.product_reference}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_reference: e.target.value,
                      }))
                    }
                    placeholder="CW2288-111"
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_link">Link de Referência</Label>
                <Input
                  id="product_link"
                  type="url"
                  value={formData.product_link}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      product_link: e.target.value,
                    }))
                  }
                  placeholder="https://stockx.com/..."
                  className="bg-secondary/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Calculadora de Preço Automático */}
          <Card className="card-premium lg:col-span-2 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Calculadora de Orçamento
                <Badge variant="secondary" className="ml-2">Multiplicador: {DEFAULT_MULTIPLIER}x</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  💡 Informe o custo total (produto + frete + impostos) e o preço de venda será calculado automaticamente com margem de {((DEFAULT_MULTIPLIER - 1) * 100).toFixed(0)}%.
                </p>
              </div>

              {/* Custo Total - Campo Principal */}
              <div className="p-4 bg-secondary/30 rounded-lg border-2 border-dashed border-primary/30">
                <div className="space-y-2">
                  <Label htmlFor="product_cost" className="text-base font-semibold">
                    Custo Total (Produto + Frete + Impostos) *
                  </Label>
                  <Input
                    id="product_cost"
                    type="number"
                    step="0.01"
                    value={formData.product_cost}
                    onChange={(e) => handleCostChange(e.target.value)}
                    placeholder="0,00"
                    className="bg-background text-lg font-medium"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    O preço de venda será calculado automaticamente
                  </p>
                </div>
              </div>

              {/* Cálculo em tempo real */}
              {parseFloat(formData.product_cost) > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Custo × {DEFAULT_MULTIPLIER}</p>
                      <p className="font-medium">
                        {formatCurrency(parseFloat(formData.product_cost) * DEFAULT_MULTIPLIER)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Arredondado (↑,90)</p>
                      <p className="font-bold text-primary text-lg">
                        {formData.product_price ? formatCurrency(parseFloat(formData.product_price)) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margem de Lucro</p>
                      <p className="font-bold text-success">
                        {formData.product_price && formData.product_cost 
                          ? `${((parseFloat(formData.product_price) - parseFloat(formData.product_cost)) / parseFloat(formData.product_price) * 100).toFixed(1)}%`
                          : "-"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-primary/20">
                    <Label className="text-sm text-muted-foreground">
                      Preço Final (Ajustável - arredonda para ,90)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.product_price}
                      onChange={(e) => handlePriceOverride(e.target.value)}
                      placeholder="0,00"
                      className="bg-background mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Sinal e Saldo - Calculados automaticamente */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sinal (50%)</Label>
                  <div className="p-2.5 bg-muted rounded-md border">
                    <p className="font-medium">
                      {formData.sinal_value ? formatCurrency(parseFloat(formData.sinal_value)) : "-"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                </div>
                <div className="space-y-2">
                  <Label>Saldo (50%)</Label>
                  <div className="p-2.5 bg-muted rounded-md border">
                    <p className="font-medium">
                      {formData.balance_value ? formatCurrency(parseFloat(formData.balance_value)) : "-"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Internal notes */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Observações Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.internal_notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  internal_notes: e.target.value,
                }))
              }
              placeholder="Observações internas sobre o pedido..."
              className="bg-secondary/50"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link to="/admin/pedidos">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" className="btn-gold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Pedido
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
