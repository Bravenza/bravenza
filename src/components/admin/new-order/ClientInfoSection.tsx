import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cleanCPF, formatCPF, cleanPhone, formatPhone, validateCPF } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

interface ClientInfoSectionProps {
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ClientInfoSection({ formData, setFormData }: ClientInfoSectionProps) {
  const { toast } = useToast();
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCpf, setIsLoadingCpf] = useState(false);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanCPF(e.target.value);
    if (cleaned.length <= 11) {
      setFormData((prev) => ({ ...prev, client_cpf: formatCPF(cleaned) }));
    }
  };

  const handleCpfBlur = async () => {
    const cleaned = cleanCPF(formData.client_cpf);
    if (!validateCPF(cleaned)) return;

    setIsLoadingCpf(true);
    try {
      const { data } = await supabase
        .from("orders")
        .select("client_name, client_email, client_phone")
        .eq("client_cpf", cleaned)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setFormData(prev => ({
          ...prev,
          client_name: data.client_name || prev.client_name,
          client_email: data.client_email || prev.client_email,
          client_phone: data.client_phone || prev.client_phone,
        }));
        toast({ title: "Dados do cliente preenchidos automaticamente" });
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
    } finally {
      setIsLoadingCpf(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanPhone(e.target.value);
    if (cleaned.length <= 11) {
      setFormData((prev) => ({ ...prev, client_phone: formatPhone(cleaned) }));
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = `${value.slice(0, 5)}-${value.slice(5)}`;
    setFormData((prev) => ({ ...prev, client_cep: value }));
    if (value.replace(/\D/g, "").length === 8) fetchAddressByCep(value);
  };

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
        toast({ title: "Endereço encontrado!", description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}` });
      } else {
        toast({ title: "CEP não encontrado", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setIsLoadingCep(false);
    }
  };

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Card className="card-premium lg:col-span-2">
      <CardHeader>
        <CardTitle>Dados do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nome completo *</Label>
            <Input id="client_name" value={formData.client_name} onChange={updateField("client_name")} className="bg-secondary/50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_cpf">CPF *</Label>
            <div className="relative">
              <Input id="client_cpf" value={formData.client_cpf} onChange={handleCPFChange} onBlur={handleCpfBlur} placeholder="000.000.000-00" className="bg-secondary/50" required />
              {isLoadingCpf && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_email">Email *</Label>
            <Input id="client_email" type="email" value={formData.client_email} onChange={updateField("client_email")} placeholder="email@exemplo.com" className="bg-secondary/50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_phone">Telefone *</Label>
            <Input id="client_phone" value={formData.client_phone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" className="bg-secondary/50" required />
          </div>
        </div>

        {/* Address */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Endereço de Entrega *</h4>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="client_cep">CEP *</Label>
              <div className="relative">
                <Input id="client_cep" value={formData.client_cep} onChange={handleCepChange} placeholder="00000-000" className="bg-secondary/50" maxLength={9} required />
                {isLoadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="client_street">Rua / Logradouro *</Label>
              <Input id="client_street" value={formData.client_street} onChange={updateField("client_street")} placeholder="Rua, Avenida, etc." className="bg-secondary/50" required />
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="client_number">Número *</Label>
              <Input id="client_number" value={formData.client_number} onChange={updateField("client_number")} placeholder="123" className="bg-secondary/50" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_complement">Complemento</Label>
              <Input id="client_complement" value={formData.client_complement} onChange={updateField("client_complement")} placeholder="Apto, Bloco..." className="bg-secondary/50" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="client_neighborhood">Bairro *</Label>
              <Input id="client_neighborhood" value={formData.client_neighborhood} onChange={updateField("client_neighborhood")} placeholder="Bairro" className="bg-secondary/50" required />
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="client_city">Cidade *</Label>
              <Input id="client_city" value={formData.client_city} onChange={updateField("client_city")} placeholder="Cidade" className="bg-secondary/50" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_state">Estado *</Label>
              <Input id="client_state" value={formData.client_state} onChange={(e) => setFormData(prev => ({ ...prev, client_state: e.target.value.toUpperCase() }))} placeholder="UF" maxLength={2} className="bg-secondary/50" required />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
