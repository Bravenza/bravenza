import { useState, useEffect } from "react";
import { Calculator, Copy, Send, Check, CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Fallback rates if DB fetch fails
const INSTALLMENT_RATES_DEFAULT: Record<number, number> = {
  1: 0,
  2: 0.0964,
  3: 0.1123,
  4: 0.1136,
  5: 0.1431,
  6: 0.1432,
  7: 0.1672,
  8: 0.1673,
  9: 0.1969,
  10: 0.2065,
  11: 0.2066,
  12: 0.2211,
};

interface InstallmentOption {
  installments: number;
  rate: number;
  totalAmount: number;
  installmentValue: number;
  interestAmount: number;
  isInterestFree: boolean;
}

const InstallmentCalculatorPage = () => {
  const [baseValue, setBaseValue] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const numericValue = parseFloat(baseValue.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

  const calculateInstallments = (): InstallmentOption[] => {
    if (numericValue <= 0) return [];

    return Object.entries(INSTALLMENT_RATES).map(([installments, rate]) => {
      const numInstallments = parseInt(installments);
      const isInterestFree = numInstallments === 1;
      const totalAmount = isInterestFree ? numericValue : numericValue * (1 + rate);
      const installmentValue = totalAmount / numInstallments;
      const interestAmount = totalAmount - numericValue;

      return {
        installments: numInstallments,
        rate: rate * 100,
        totalAmount,
        installmentValue,
        interestAmount,
        isInterestFree,
      };
    });
  };

  const installmentOptions = calculateInstallments();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const generateQuoteText = (option: InstallmentOption) => {
    const lines = [
      clientName ? `Olá ${clientName}!` : "Olá!",
      "",
      productName 
        ? `Segue a cotação do *valor total* para *${productName}*:` 
        : `Segue a cotação do *valor total*:`,
      "",
    ];

    if (option.isInterestFree) {
      lines.push(`💳 *1x de ${formatCurrency(option.totalAmount)}* (sem juros)`);
      lines.push(`✅ Mesmo valor do PIX!`);
    } else {
      lines.push(`💳 *${option.installments}x de ${formatCurrency(option.installmentValue)}*`);
      lines.push(`📊 Total: ${formatCurrency(option.totalAmount)}`);
      lines.push(`📈 Juros: ${option.rate.toFixed(2)}% (+${formatCurrency(option.interestAmount)})`);
    }

    lines.push("");
    lines.push("_Pagamento único de 100% do valor do pedido._");
    lines.push("");
    lines.push("Ficou alguma dúvida? Estou à disposição! 😊");

    return lines.join("\n");
  };

  const copyToClipboard = async (option: InstallmentOption, index: number) => {
    const text = generateQuoteText(option);
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Cotação copiada para a área de transferência!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sendViaWhatsApp = (option: InstallmentOption) => {
    const text = encodeURIComponent(generateQuoteText(option));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const generateFullQuoteText = () => {
    if (installmentOptions.length === 0) return "";

    const lines = [
      clientName ? `Olá ${clientName}!` : "Olá!",
      "",
      productName 
        ? `Segue as opções de pagamento do *valor total* para *${productName}*:` 
        : `Segue as opções de pagamento do *valor total*:`,
      "",
      `💰 *Valor à vista (PIX ou 1x cartão):* ${formatCurrency(numericValue)}`,
      "",
      "💳 *Opções de Parcelamento:*",
      "",
    ];

    installmentOptions.forEach((option) => {
      if (option.isInterestFree) {
        lines.push(`• *1x* de ${formatCurrency(option.totalAmount)} _(sem juros, igual ao PIX)_`);
      } else {
        lines.push(
          `• *${option.installments}x* de ${formatCurrency(option.installmentValue)} = ${formatCurrency(option.totalAmount)}`
        );
      }
    });

    lines.push("");
    lines.push("_Pagamento único de 100% do valor do pedido._");
    lines.push("_Juros aplicados a partir de 2x são da operadora do cartão._");
    lines.push("");
    lines.push("Ficou alguma dúvida? Estou à disposição! 😊");

    return lines.join("\n");
  };

  const copyFullQuote = async () => {
    const text = generateFullQuoteText();
    await navigator.clipboard.writeText(text);
    toast.success("Tabela completa copiada!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Calculadora de Parcelamento
        </h1>
        <p className="text-muted-foreground">
          Calcule o valor das parcelas com juros do Mercado Pago (1x sem juros para o cliente)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Cotação</CardTitle>
            <CardDescription>Informe o valor total do pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseValue">Valor Total (R$)</Label>
              <Input
                id="baseValue"
                type="text"
                placeholder="0,00"
                value={baseValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.,]/g, "");
                  setBaseValue(value);
                }}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Pagamento único de 100% do valor
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente (opcional)</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Ex: João"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Produto (opcional)</Label>
              <Input
                id="productName"
                type="text"
                placeholder="Ex: Nike Air Max 90"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {numericValue > 0 && (
              <Button onClick={copyFullQuote} variant="outline" className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Tabela Completa
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Opções de Parcelamento</CardTitle>
            <CardDescription>
              {numericValue > 0
                ? `Valor total: ${formatCurrency(numericValue)}`
                : "Digite o valor para ver as opções"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {installmentOptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Valor/Parcela</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Juros</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentOptions.map((option, index) => (
                    <TableRow 
                      key={option.installments}
                      className={option.isInterestFree ? "bg-success/5" : ""}
                    >
                      <TableCell className="font-medium">
                        {option.installments}x
                        {option.isInterestFree && (
                          <Badge variant="outline" className="ml-2 text-success border-success">
                            Sem juros
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(option.installmentValue)}
                      </TableCell>
                      <TableCell>{formatCurrency(option.totalAmount)}</TableCell>
                      <TableCell>
                        {option.isInterestFree ? (
                          <span className="text-success font-medium">0%</span>
                        ) : (
                          <>
                            <span className="text-muted-foreground">
                              {option.rate.toFixed(2)}%
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              (+{formatCurrency(option.interestAmount)})
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(option, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendViaWhatsApp(option)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Digite o valor para ver as opções de parcelamento
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-success/20">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-success">1x sem juros para o cliente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Pagamentos em 1x no cartão têm o mesmo valor do PIX. A taxa de 4,98% é absorvida pela empresa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-600">Juros a partir de 2x</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Para parcelamentos de 2x a 12x, os juros do Mercado Pago são repassados ao cliente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Taxas (2x a 12x)</CardTitle>
          <CardDescription>
            Taxas de juros do Mercado Pago repassadas ao cliente (1x é absorvido)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
            {Object.entries(INSTALLMENT_RATES)
              .filter(([installments]) => parseInt(installments) > 1)
              .map(([installments, rate]) => (
                <div
                  key={installments}
                  className="bg-secondary/50 rounded-lg p-3 text-center"
                >
                  <div className="text-lg font-bold text-primary">{installments}x</div>
                  <div className="text-xs text-muted-foreground">
                    {(rate * 100).toFixed(2)}%
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallmentCalculatorPage;