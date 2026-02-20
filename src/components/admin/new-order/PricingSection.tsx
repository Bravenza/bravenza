import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { calculateProductPrice, DEFAULT_MULTIPLIER, roundUpTo90 } from "@/lib/budget-calculator";

interface PricingSectionProps {
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function PricingSection({ formData, setFormData }: PricingSectionProps) {
  const handleCostChange = (value: string) => {
    const cost = parseFloat(value) || 0;
    if (cost > 0) {
      const calculatedPrice = calculateProductPrice(cost, DEFAULT_MULTIPLIER);
      const halfPrice = calculatedPrice / 2;
      setFormData(prev => ({
        ...prev,
        product_cost: value,
        product_price: calculatedPrice.toFixed(2),
        sinal_value: halfPrice.toFixed(2),
        balance_value: halfPrice.toFixed(2),
      }));
    } else {
      setFormData(prev => ({ ...prev, product_cost: value, product_price: "", sinal_value: "", balance_value: "" }));
    }
  };

  const handlePriceOverride = (value: string) => {
    const price = parseFloat(value) || 0;
    if (price > 0) {
      const roundedPrice = roundUpTo90(price);
      const halfPrice = roundedPrice / 2;
      setFormData(prev => ({
        ...prev,
        product_price: roundedPrice.toFixed(2),
        sinal_value: halfPrice.toFixed(2),
        balance_value: halfPrice.toFixed(2),
      }));
    } else {
      setFormData(prev => ({ ...prev, product_price: value, sinal_value: "", balance_value: "" }));
    }
  };

  return (
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
            <p className="text-xs text-muted-foreground">O preço de venda será calculado automaticamente</p>
          </div>
        </div>

        {parseFloat(formData.product_cost) > 0 && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Custo × {DEFAULT_MULTIPLIER}</p>
                <p className="font-medium">{formatCurrency(parseFloat(formData.product_cost) * DEFAULT_MULTIPLIER)}</p>
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
                    : "-"}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-primary/20">
              <Label className="text-sm text-muted-foreground">Preço Final (Ajustável - arredonda para ,90)</Label>
              <Input type="number" step="0.01" value={formData.product_price} onChange={(e) => handlePriceOverride(e.target.value)} placeholder="0,00" className="bg-background mt-1" />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sinal (50%)</Label>
            <div className="p-2.5 bg-muted rounded-md border">
              <p className="font-medium">{formData.sinal_value ? formatCurrency(parseFloat(formData.sinal_value)) : "-"}</p>
            </div>
            <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
          </div>
          <div className="space-y-2">
            <Label>Saldo (50%)</Label>
            <div className="p-2.5 bg-muted rounded-md border">
              <p className="font-medium">{formData.balance_value ? formatCurrency(parseFloat(formData.balance_value)) : "-"}</p>
            </div>
            <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
