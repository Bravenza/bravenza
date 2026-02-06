import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/constants";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface OrderCost {
  id: string;
  order_id: string;
  cost_type: string;
  description: string | null;
  amount: number;
  created_at: string;
}

// Payment fee rates
const PAYMENT_FEE_RATES = {
  PIX: 0.0099, // 0.99%
  CREDIT_CARD: 0.0499, // 4.99%
};

interface OrderCostsSectionProps {
  orderId: string;
  productCost: number | null;
  shippingCost: number | null;
  otherCosts: number | null;
  productPrice: number | null;
  sinalValue: number | null;
  sinalPaid: boolean;
  sinalPaymentMethod: string | null;
  balanceValue: number | null;
  balancePaid: boolean;
  balancePaymentMethod: string | null;
  isEditing: boolean;
  onUpdateField: (field: string, value: number | null) => void;
}

const COST_TYPES = [
  { value: "shipping", label: "Frete Nacional" },
  { value: "customs", label: "Taxas e Impostos" },
  { value: "packaging", label: "Embalagem" },
  { value: "insurance", label: "Seguro" },
  { value: "other", label: "Outros" },
];

export const OrderCostsSection = ({
  orderId,
  productCost,
  shippingCost,
  otherCosts,
  productPrice,
  sinalValue,
  sinalPaid,
  sinalPaymentMethod,
  balanceValue,
  balancePaid,
  balancePaymentMethod,
  isEditing,
  onUpdateField,
}: OrderCostsSectionProps) => {
  const { toast } = useToast();
  const [additionalCosts, setAdditionalCosts] = useState<OrderCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCost, setNewCost] = useState({ type: "", description: "", amount: "" });
  const [deleteCostId, setDeleteCostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const { data, error } = await supabase
          .from("order_costs")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setAdditionalCosts(data || []);
      } catch (error) {
        console.error("Error fetching costs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCosts();
  }, [orderId]);

  const handleAddCost = async () => {
    if (!newCost.type || !newCost.amount) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("order_costs")
        .insert({
          order_id: orderId,
          cost_type: newCost.type,
          description: newCost.description || null,
          amount: parseFloat(newCost.amount),
        })
        .select()
        .single();

      if (error) throw error;

      setAdditionalCosts([...additionalCosts, data]);
      setNewCost({ type: "", description: "", amount: "" });
      setShowAddForm(false);

      toast({
        title: "Custo adicionado",
        description: "O custo foi registrado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o custo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCost = async () => {
    if (!deleteCostId) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("order_costs")
        .delete()
        .eq("id", deleteCostId);

      if (error) throw error;

      setAdditionalCosts(additionalCosts.filter(c => c.id !== deleteCostId));

      toast({
        title: "Custo removido",
        description: "O custo foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o custo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteCostId(null);
    }
  };

  // Calculate payment fees
  const calculatePaymentFee = (value: number | null, paid: boolean, method: string | null) => {
    if (!paid || !value || !method) return 0;
    const rate = method === "PIX" ? PAYMENT_FEE_RATES.PIX : PAYMENT_FEE_RATES.CREDIT_CARD;
    return value * rate;
  };

  const sinalPaymentFee = calculatePaymentFee(sinalValue, sinalPaid, sinalPaymentMethod);
  const balancePaymentFee = calculatePaymentFee(balanceValue, balancePaid, balancePaymentMethod);
  const totalPaymentFees = sinalPaymentFee + balancePaymentFee;

  // Calculate totals
  const totalProductCost = productCost || 0;
  const totalShippingCost = shippingCost || 0;
  const totalOtherCosts = otherCosts || 0;
  const totalAdditionalCosts = additionalCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalCosts = totalProductCost + totalShippingCost + totalOtherCosts + totalAdditionalCosts + totalPaymentFees;
  const revenue = productPrice || 0;
  const grossProfit = revenue - totalCosts;
  const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return (
    <Card className="card-premium">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">💰 Financeiro</CardTitle>
        {!isLoading && (
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${grossProfit >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
            Margem: {profitMargin.toFixed(1)}%
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main costs */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Custo do Produto</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                min="0"
                value={productCost || ""}
                onChange={(e) => onUpdateField("product_cost", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className="bg-secondary/50"
              />
            ) : (
              <p className="text-lg font-medium">
                {productCost ? formatCurrency(productCost) : "-"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Frete Nacional</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost || ""}
                onChange={(e) => onUpdateField("shipping_cost", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className="bg-secondary/50"
              />
            ) : (
              <p className="text-lg font-medium">
                {shippingCost ? formatCurrency(shippingCost) : "-"}
              </p>
            )}
          </div>
        </div>

        {/* Additional costs list */}
        {additionalCosts.length > 0 && (
          <div className="space-y-2">
            <Label>Custos Adicionais</Label>
            <div className="space-y-2">
              {additionalCosts.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {COST_TYPES.find(t => t.value === cost.cost_type)?.label || cost.cost_type}
                    </p>
                    {cost.description && (
                      <p className="text-sm text-muted-foreground">{cost.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(cost.amount)}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteCostId(cost.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add cost form */}
        {isEditing && (
          <div className="space-y-4">
            {showAddForm ? (
              <div className="p-4 border border-dashed border-border rounded-lg space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={newCost.type} onValueChange={(v) => setNewCost({ ...newCost, type: v })}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {COST_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Input
                      value={newCost.description}
                      onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                      placeholder="Detalhes do custo"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      placeholder="0.00"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddCost}
                    disabled={isSaving || !newCost.type || !newCost.amount}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Custo Extra
              </Button>
            )}
          </div>
        )}

        {/* Payment Fees Section */}
        {totalPaymentFees > 0 && (
          <div className="space-y-2">
            <Label>Taxas de Pagamento</Label>
            <div className="space-y-2">
              {sinalPaymentFee > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium">
                      Taxa Sinal ({sinalPaymentMethod === "PIX" ? "PIX 0,99%" : "Cartão 4,99%"})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sobre {formatCurrency(sinalValue || 0)}
                    </p>
                  </div>
                  <span className="font-medium text-destructive">
                    - {formatCurrency(sinalPaymentFee)}
                  </span>
                </div>
              )}
              {balancePaymentFee > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium">
                      Taxa Saldo ({balancePaymentMethod === "PIX" ? "PIX 0,99%" : "Cartão 4,99%"})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sobre {formatCurrency(balanceValue || 0)}
                    </p>
                  </div>
                  <span className="font-medium text-destructive">
                    - {formatCurrency(balancePaymentFee)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Receita (Preço de Venda)</span>
            <span className="font-medium">{formatCurrency(revenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo do Produto</span>
            <span className="font-medium text-destructive">- {formatCurrency(totalProductCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frete + Outros</span>
            <span className="font-medium text-destructive">- {formatCurrency(totalShippingCost + totalOtherCosts + totalAdditionalCosts)}</span>
          </div>
          {totalPaymentFees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxas de Pagamento</span>
              <span className="font-medium text-destructive">- {formatCurrency(totalPaymentFees)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
            <span>Lucro Bruto</span>
            <span className={grossProfit >= 0 ? "text-success" : "text-destructive"}>
              {formatCurrency(grossProfit)}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteCostId}
        onOpenChange={(open) => !open && setDeleteCostId(null)}
        onConfirm={handleDeleteCost}
        title="Excluir custo?"
        description="Esta ação não pode ser desfeita. O custo será removido do pedido."
        confirmText="Excluir"
        isLoading={isDeleting}
        variant="destructive"
      />
    </Card>
  );
};
