import { DollarSign, AlertCircle, Calculator, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/constants";
import { calculateProductPrice, DEFAULT_MULTIPLIER, roundUpTo90 } from "@/lib/budget-calculator";
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

  // Calcula preço sugerido baseado no custo total com multiplicador
  const suggestedPrice = productCost > 0 ? calculateProductPrice(productCost, DEFAULT_MULTIPLIER) : 0;
  const rawPrice = productCost * DEFAULT_MULTIPLIER;

  const handleUpdateField = (field: string, value: number | null) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler para atualizar custo e recalcular preço automaticamente
  const handleCostChange = (newCost: number | null) => {
    const cost = newCost || 0;
    const calculatedPrice = cost > 0 ? calculateProductPrice(cost, DEFAULT_MULTIPLIER) : null;
    
    setEditData((prev) => ({
      ...prev,
      product_cost: newCost,
      product_price: calculatedPrice,
    }));
  };

  // Handler para permitir ajuste manual do preço (mantendo a regra do ,90)
  const handlePriceOverride = (newPrice: number | null) => {
    if (!newPrice) {
      setEditData((prev) => ({
        ...prev,
        product_price: null,
      }));
      return;
    }
    
    // Arredondar para ,90
    const roundedPrice = roundUpTo90(newPrice);
    
    setEditData((prev) => ({
      ...prev,
      product_price: roundedPrice,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Alert se não tiver custo definido */}
      {!hasCost && (
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            <strong>Atenção:</strong> Defina o custo total do produto (produto + frete + impostos) para calcular o preço de venda automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Preço de Venda - Calculado Automaticamente */}
      <Card className="card-premium border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Preço
            <Badge variant="secondary" className="ml-2">Multiplicador: {DEFAULT_MULTIPLIER}x</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-6">
              {/* Custo Total - Input principal */}
              <div className="p-4 bg-secondary/30 rounded-lg border-2 border-dashed border-primary/30">
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    Custo Total (Produto + Frete + Impostos)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Informe o custo total incluindo: valor do produto, frete internacional/nacional e impostos. O preço de venda será calculado automaticamente.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productCost || ""}
                    onChange={(e) => handleCostChange(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0,00"
                    className="bg-background text-lg font-medium"
                  />
                </div>
              </div>

              {/* Cálculo em tempo real */}
              {productCost > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Custo × {DEFAULT_MULTIPLIER}</p>
                      <p className="font-medium">{formatCurrency(rawPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Arredondado (↑,90)</p>
                      <p className="font-bold text-primary text-lg">{formatCurrency(suggestedPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-primary/20">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      Preço Final (Ajustável)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Você pode ajustar manualmente se necessário. O valor será arredondado para terminar em ,90.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.product_price || suggestedPrice || ""}
                      onChange={(e) => handlePriceOverride(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0,00"
                      className="bg-background mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visualização do cálculo quando não está editando */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Custo Total</p>
                  <p className="font-semibold text-lg">
                    {order.product_cost ? formatCurrency(order.product_cost) : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">× {DEFAULT_MULTIPLIER}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Preço de Venda (PIX)</p>
                  <p className="font-bold text-2xl text-primary">
                    {order.product_price ? formatCurrency(order.product_price) : "-"}
                  </p>
                </div>
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