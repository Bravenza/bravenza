import { DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/constants";
import { OrderCostsSection } from "@/components/admin/OrderCostsSection";
import { Order } from "./types";

interface CostsTabProps {
  order: Order;
  editData: Partial<Order>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Order>>>;
  isEditing: boolean;
}

export const CostsTab = ({
  order,
  editData,
  setEditData,
  isEditing,
}: CostsTabProps) => {
  const hasCost = (editData.product_cost || order.product_cost) != null && (editData.product_cost || order.product_cost)! > 0;
  const productCost = editData.product_cost ?? order.product_cost ?? 0;
  const productPrice = editData.product_price ?? order.product_price ?? 0;
  const shippingCost = editData.shipping_cost ?? order.shipping_cost ?? 0;

  const grossProfit = productPrice - productCost;
  const profitMargin = productPrice > 0 ? (grossProfit / productPrice) * 100 : 0;

  const handleUpdateField = (field: string, value: number | null) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Alert se não tiver custo definido */}
      {!hasCost && (
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            <strong>Atenção:</strong> Defina o custo do produto antes de enviar o orçamento ao cliente.
            Isso é essencial para calcular a margem de lucro.
          </AlertDescription>
        </Alert>
      )}

      {/* Preço de Venda */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Preço de Venda (Cliente)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.product_price || ""}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const halfPrice = price / 2;
                      setEditData((prev) => ({
                        ...prev,
                        product_price: price || null,
                        sinal_value: halfPrice || null,
                        balance_value: halfPrice || null,
                      }));
                    }}
                    placeholder="0,00"
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor que o cliente pagará
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Sinal (50%)</Label>
                  <div className="p-2.5 bg-muted rounded-md border">
                    <p className="font-medium">
                      {editData.sinal_value ? formatCurrency(editData.sinal_value) : "-"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                </div>
                <div className="space-y-2">
                  <Label>Saldo (50%)</Label>
                  <div className="p-2.5 bg-muted rounded-md border">
                    <p className="font-medium">
                      {editData.balance_value ? formatCurrency(editData.balance_value) : "-"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="font-bold text-2xl text-primary">
                  {order.product_price ? formatCurrency(order.product_price) : "-"}
                </p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Sinal (50%)</p>
                <p className="font-semibold text-lg">
                  {order.sinal_value ? formatCurrency(order.sinal_value) : "-"}
                </p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo (50%)</p>
                <p className="font-semibold text-lg">
                  {order.balance_value ? formatCurrency(order.balance_value) : "-"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custos Internos - Usando OrderCostsSection */}
      <OrderCostsSection
        orderId={order.order_id}
        productCost={editData.product_cost ?? order.product_cost}
        shippingCost={editData.shipping_cost ?? order.shipping_cost}
        otherCosts={editData.other_costs ?? order.other_costs}
        productPrice={editData.product_price ?? order.product_price}
        sinalValue={order.sinal_value}
        sinalPaid={order.sinal_paid}
        sinalPaymentMethod={order.sinal_payment_method}
        balanceValue={order.balance_value}
        balancePaid={order.balance_paid}
        balancePaymentMethod={order.balance_payment_method}
        isEditing={isEditing}
        onUpdateField={handleUpdateField}
      />
    </div>
  );
};
