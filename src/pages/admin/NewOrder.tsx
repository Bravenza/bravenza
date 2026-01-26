import { useState } from "react";
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
import { generateOrderId, cleanCPF, formatCPF, validateCPF } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const orderSchema = z.object({
  order_type: z.enum(["VAULT", "READY"]),
  client_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  client_cpf: z.string().refine((val) => validateCPF(val), "CPF inválido"),
  client_email: z.string().email("Email inválido").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  client_address: z.string().optional(),
  product_brand: z.string().min(1, "Marca obrigatória"),
  product_model: z.string().min(1, "Modelo obrigatório"),
  product_name: z.string().min(2, "Nome do produto obrigatório"),
  product_size: z.string().min(1, "Tamanho obrigatório"),
  product_color: z.string().optional(),
  product_reference: z.string().optional(),
  product_link: z.string().url("URL inválida").optional().or(z.literal("")),
  product_price: z.number().positive("Valor deve ser positivo"),
  sinal_value: z.number().min(0, "Valor inválido").optional(),
  balance_value: z.number().min(0, "Valor inválido").optional(),
  internal_notes: z.string().optional(),
});

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    order_type: "VAULT" as "VAULT" | "READY",
    client_name: "",
    client_cpf: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    product_brand: "",
    product_model: "",
    product_name: "",
    product_size: "",
    product_color: "",
    product_reference: "",
    product_link: "",
    product_price: "",
    sinal_value: "",
    balance_value: "",
    internal_notes: "",
  });

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = cleanCPF(value);
    if (cleaned.length <= 11) {
      setFormData((prev) => ({ ...prev, client_cpf: formatCPF(cleaned) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedCPF = cleanCPF(formData.client_cpf);

    const productPrice = formData.product_price ? parseFloat(formData.product_price) : 0;

    try {
      orderSchema.parse({
        ...formData,
        client_cpf: cleanedCPF,
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

      const orderData = {
        order_id: orderId,
        order_type: formData.order_type,
        current_status: "ORDER_CONFIRMED" as const,
        client_name: formData.client_name,
        client_cpf: cleanedCPF,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        product_brand: formData.product_brand || null,
        product_model: formData.product_model || null,
        product_name: formData.product_name,
        product_size: formData.product_size || null,
        product_color: formData.product_color || null,
        product_reference: formData.product_reference || null,
        product_link: formData.product_link || null,
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
          status: "ORDER_CONFIRMED" as const,
          notes: "Pedido criado",
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
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
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
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        client_phone: e.target.value,
                      }))
                    }
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_address">Endereço</Label>
                <Textarea
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_address: e.target.value,
                    }))
                  }
                  className="bg-secondary/50"
                  rows={2}
                />
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
                <div className="space-y-2">
                  <Label htmlFor="product_brand">Marca *</Label>
                  <Input
                    id="product_brand"
                    value={formData.product_brand}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_brand: e.target.value,
                      }))
                    }
                    placeholder="Nike, Adidas, Jordan..."
                    className="bg-secondary/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_model">Modelo *</Label>
                  <Input
                    id="product_model"
                    value={formData.product_model}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_model: e.target.value,
                      }))
                    }
                    placeholder="Air Force 1, Yeezy 350..."
                    className="bg-secondary/50"
                    required
                  />
                </div>
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
              <div className="grid md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="product_price">Valor Total do Orçamento (R$) *</Label>
                  <Input
                    id="product_price"
                    type="number"
                    step="0.01"
                    value={formData.product_price}
                    onChange={(e) => {
                      const price = e.target.value;
                      const priceNum = parseFloat(price) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        product_price: price,
                        sinal_value: (priceNum * 0.5).toFixed(2),
                        balance_value: (priceNum * 0.5).toFixed(2),
                      }));
                    }}
                    className="bg-secondary/50"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial info */}
          <Card className="card-premium lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  💡 O valor do sinal é de 50% do valor total do orçamento. O saldo restante é pago quando o produto chegar ao Brasil.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sinal_value">Valor do Sinal - 50% (R$)</Label>
                  <Input
                    id="sinal_value"
                    type="number"
                    step="0.01"
                    value={formData.sinal_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sinal_value: e.target.value,
                      }))
                    }
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculado automaticamente como 50% do orçamento
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance_value">Valor do Saldo (R$)</Label>
                  <Input
                    id="balance_value"
                    type="number"
                    step="0.01"
                    value={formData.balance_value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        balance_value: e.target.value,
                      }))
                    }
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Restante a ser pago na chegada do produto
                  </p>
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
