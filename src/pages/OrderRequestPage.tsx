import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle2, ArrowLeft, User, MapPin, Package, Image } from "lucide-react";
import { SNEAKER_BRANDS, getModelsForBrand } from "@/lib/sneaker-data";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const SHOE_SIZES = [
  "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"
];

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function OrderRequestPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    client_name: "",
    client_cpf: "",
    client_email: "",
    client_phone: "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    shoe_size: "",
    product_brand: "",
    product_model: "",
    product_color: "",
    product_link: "",
    additional_notes: "",
  });

  const [selectedBrand, setSelectedBrand] = useState("");

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format CPF
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Format phone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  // Format CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, "$1-$2");
  };

  // Fetch address from CEP
  const fetchAddressFromCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        address_street: data.logradouro || "",
        address_neighborhood: data.bairro || "",
        address_city: data.localidade || "",
        address_state: data.uf || "",
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Handle brand change
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    updateField("product_brand", brand);
    updateField("product_model", "");
  };

  // Validate form
  const validateForm = () => {
    const required = [
      "client_name", "client_cpf", "client_email", "client_phone",
      "address_cep", "address_street", "address_number", 
      "address_neighborhood", "address_city", "address_state",
      "shoe_size"
    ];

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Preencha todos os campos obrigatórios`);
        return false;
      }
    }

    const cpfClean = formData.client_cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      toast.error("CPF inválido");
      return false;
    }

    if (!formData.client_email.includes("@")) {
      toast.error("E-mail inválido");
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("sneaker-references")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("sneaker-references")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Insert request
      const { error } = await supabase
        .from("order_requests")
        .insert({
          ...formData,
          reference_image_url: imageUrl,
        });

      if (error) throw error;

      // Create notification for admins
      try {
        await supabase.functions.invoke("create-notification", {
          body: {
            target: "admin",
            type: "new_order_request",
            title: "Nova Solicitação de Pedido",
            message: `${formData.client_name} solicitou um orçamento para ${formData.product_brand || "tênis"} ${formData.product_model || ""} tamanho ${formData.shoe_size}`,
            reference_type: "order_request",
          },
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Don't block the success flow
      }

      setIsSuccess(true);
      toast.success("Solicitação enviada com sucesso!");

    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Solicitação Enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Recebemos sua solicitação e entraremos em contato em breve com o orçamento.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-3xl flex-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Solicitar Orçamento</h1>
          <p className="text-muted-foreground">
            Preencha o formulário abaixo e receba seu orçamento personalizado
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Suas informações de contato</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome Completo *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => updateField("client_name", e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_cpf">CPF *</Label>
                <Input
                  id="client_cpf"
                  value={formData.client_cpf}
                  onChange={(e) => updateField("client_cpf", formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">E-mail *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => updateField("client_email", e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone *</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => updateField("client_phone", formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Endereço de Entrega
              </CardTitle>
              <CardDescription>Onde você deseja receber o produto</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address_cep">CEP *</Label>
                <div className="relative">
                  <Input
                    id="address_cep"
                    value={formData.address_cep}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      updateField("address_cep", formatted);
                      if (formatted.replace(/\D/g, "").length === 8) {
                        fetchAddressFromCep(formatted);
                      }
                    }}
                    placeholder="00000-000"
                  />
                  {isLoadingCep && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_street">Rua *</Label>
                <Input
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => updateField("address_street", e.target.value)}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_number">Número *</Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => updateField("address_number", e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={formData.address_complement}
                  onChange={(e) => updateField("address_complement", e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_neighborhood">Bairro *</Label>
                <Input
                  id="address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={(e) => updateField("address_neighborhood", e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade *</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => updateField("address_city", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado *</Label>
                <Select
                  value={formData.address_state}
                  onValueChange={(value) => updateField("address_state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BR_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Informações do Tênis
              </CardTitle>
              <CardDescription>Detalhes do produto que você deseja</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shoe_size">Tamanho (BR) *</Label>
                <Select
                  value={formData.shoe_size}
                  onValueChange={(value) => updateField("shoe_size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                  onValueChange={handleBrandChange}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca primeiro" />
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
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="product_link">Link de Referência</Label>
                <Input
                  id="product_link"
                  type="url"
                  value={formData.product_link}
                  onChange={(e) => updateField("product_link", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Imagem de Referência
              </CardTitle>
              <CardDescription>Envie uma foto do tênis que você deseja (opcional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full max-h-64 object-contain rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Clique para enviar uma imagem</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
              <CardDescription>Algo mais que devemos saber?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.additional_notes}
                onChange={(e) => updateField("additional_notes", e.target.value)}
                placeholder="Informações adicionais sobre o pedido..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            type="submit" 
            size="lg" 
            className="w-full btn-gold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Solicitação"
            )}
          </Button>
        </form>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}