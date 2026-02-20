import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateOrderId, cleanCPF, validateCPF, cleanPhone, validatePhone, validateEmail, formatCurrency } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateProductPrice, DEFAULT_MULTIPLIER } from "@/lib/budget-calculator";
import { ClientInfoSection, ProductInfoSection, PricingSection } from "@/components/admin/new-order";

const orderSchema = z.object({
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

  const [formData, setFormData] = useState<Record<string, string>>({
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
        sinal_value: formData.sinal_value ? parseFloat(formData.sinal_value) : undefined,
        balance_value: formData.balance_value ? parseFloat(formData.balance_value) : undefined,
      });
    } catch (err: any) {
      const errors = JSON.parse(err.message);
      toast({ title: "Erro de validação", description: errors[0].message, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const orderId = generateOrderId();
      const now = new Date();
      const slaDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sinalValue = formData.sinal_value ? parseFloat(formData.sinal_value) : productPrice * 0.5;
      const balanceValue = formData.balance_value ? parseFloat(formData.balance_value) : productPrice - sinalValue;

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

      const orderData = {
        order_id: orderId,
        order_type: "VAULT" as const,
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
        sla_vault_due_date: slaDate.toISOString().split("T")[0],
      };

      const { error: orderError } = await supabase.from("orders").insert(orderData);
      if (orderError) throw orderError;

      const { error: historyError } = await supabase.from("order_history").insert({
        order_id: orderId,
        status: "REQUEST_RECEIVED" as const,
        notes: "Solicitação recebida",
      });
      if (historyError) throw historyError;

      toast({ title: "Pedido criado!", description: `Pedido ${orderId} criado com sucesso.` });
      navigate(`/admin/pedidos/${orderId}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({ title: "Erro ao criar pedido", description: error.message || "Tente novamente.", variant: "destructive" });
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
          <p className="text-muted-foreground">Preencha os dados do novo pedido</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <ClientInfoSection formData={formData} setFormData={setFormData} />
          <ProductInfoSection formData={formData} setFormData={setFormData} />
          <PricingSection formData={formData} setFormData={setFormData} />
        </div>

        {/* Internal notes */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Observações Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
              placeholder="Observações internas sobre o pedido..."
              className="bg-secondary/50"
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link to="/admin/pedidos">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" className="btn-gold" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Criar Pedido</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
