import { useState } from "react";
import { Calculator, Copy, Send, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// Mercado Pago interest rates by installment count
const INSTALLMENT_RATES: Record<number, number> = {
  1: 0.0498,   // 4.98%
  2: 0.0964,   // 9.64%
  3: 0.1123,   // 11.23%
  4: 0.1136,   // 11.36%
  5: 0.1431,   // 14.31%
  6: 0.1432,   // 14.32%
  7: 0.1672,   // 16.72%
  8: 0.1673,   // 16.73%
  9: 0.1969,   // 19.69%
  10: 0.2065,  // 20.65%
  11: 0.2066,  // 20.66%
  12: 0.2211,  // 22.11%
};

interface InstallmentOption {
  installments: number;
  rate: number;
  totalAmount: number;
  installmentValue: number;
  interestAmount: number;
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
      const totalAmount = numericValue * (1 + rate);
      const installmentValue = totalAmount / numInstallments;
      const interestAmount = totalAmount - numericValue;

      return {
        installments: numInstallments,
        rate: rate * 100,
        totalAmount,
        installmentValue,
        interestAmount,
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
      productName ? `Segue a cotação para *${productName}*:` : "Segue a cotação:",
      "",
      `💳 *${option.installments}x de ${formatCurrency(option.installmentValue)}*`,
      `📊 Total: ${formatCurrency(option.totalAmount)}`,
      `📈 Juros: ${option.rate.toFixed(2)}% (${formatCurrency(option.interestAmount)})`,
      "",
      "Ficou alguma dúvida? Estou à disposição! 😊",
    ];
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
      productName ? `Segue as opções de parcelamento para *${productName}*:` : "Segue as opções de parcelamento:",
      "",
      `💰 Valor à vista: ${formatCurrency(numericValue)}`,
      "",
      "💳 *Opções de Parcelamento:*",
      "",
    ];

    installmentOptions.forEach((option) => {
      lines.push(
        `• *${option.installments}x* de ${formatCurrency(option.installmentValue)} = ${formatCurrency(option.totalAmount)}`
      );
    });

    lines.push("");
    lines.push("_Os juros são aplicados pela operadora do cartão._");
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
          Calcule o valor das parcelas com juros do Mercado Pago e envie cotações para clientes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Cotação</CardTitle>
            <CardDescription>Preencha os dados para calcular</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseValue">Valor Base (R$)</Label>
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
                ? `Valor base: ${formatCurrency(numericValue)}`
                : "Digite um valor para ver as opções"}
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
                    <TableRow key={option.installments}>
                      <TableCell className="font-medium">
                        {option.installments}x
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(option.installmentValue)}
                      </TableCell>
                      <TableCell>{formatCurrency(option.totalAmount)}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {option.rate.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          (+{formatCurrency(option.interestAmount)})
                        </span>
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
                Digite um valor para ver as opções de parcelamento
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Taxas</CardTitle>
          <CardDescription>
            Taxas de juros do Mercado Pago por número de parcelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {Object.entries(INSTALLMENT_RATES).map(([installments, rate]) => (
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
