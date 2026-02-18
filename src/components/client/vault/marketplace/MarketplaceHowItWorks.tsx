import { TrendingDown, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const feeTable = [
  { plan: "Free", base: "14%", note: "Taxa fixa" },
  { plan: "Pro", base: "12%", note: "Reduz até 8% com vendas" },
  { plan: "Elite", base: "10%", note: "Reduz até 6% com vendas" },
];

const steps = [
  { step: "1", title: "Crie seu anúncio", desc: "Descreva o produto, defina o preço e adicione fotos." },
  { step: "2", title: "Comprador finaliza a compra", desc: "O comprador paga via PIX ou cartão pelo Mercado Pago." },
  { step: "3", title: "Envie o produto", desc: "Envie direto ao comprador ou via Bravenza para autenticação." },
  { step: "4", title: "Período de proteção", desc: "O comprador tem 7 dias úteis para reportar problemas." },
  { step: "5", title: "Receba o pagamento", desc: "O valor é liberado em até 8 dias úteis via PIX, descontada a taxa de serviço." },
];

export function MarketplaceHowItWorks() {
  return (
    <div className="space-y-4">
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Taxa de serviço progressiva
          </CardTitle>
          <CardDescription>A taxa depende do seu plano e volume de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feeTable.map((row) => (
              <div key={row.plan} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">
                <div>
                  <span className="text-sm font-medium">{row.plan}</span>
                  <span className="text-xs text-muted-foreground ml-2">{row.note}</span>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30">{row.base}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1 text-primary" />
              Nos planos Pro e Elite, a comissão diminui automaticamente conforme seu volume de vendas aumenta.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                {item.step}
              </div>
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
