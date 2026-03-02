import { TrendingDown, Percent, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const feeTable = [
  { plan: "Free", base: "14%", note: "Taxa fixa", accent: "bg-muted/60 text-muted-foreground" },
  { plan: "Pro", base: "12%", note: "Reduz até 8% com vendas", accent: "bg-primary/10 text-primary" },
  { plan: "Elite", base: "10%", note: "Reduz até 6% com vendas", accent: "bg-primary/15 text-primary" },
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
      {/* Fee Table */}
      <Card className="border-border/30 shadow-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Percent className="h-3.5 w-3.5 text-primary" />
            </div>
            Taxa de serviço progressiva
          </CardTitle>
          <CardDescription className="text-xs ml-9">A taxa depende do seu plano e volume de vendas</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2 mt-2">
            {feeTable.map((row) => (
              <div key={row.plan} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-black", row.accent)}>
                    {row.plan[0]}
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{row.plan}</span>
                    <p className="text-[10px] text-muted-foreground">{row.note}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30 font-bold text-xs">{row.base}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-primary/5 border border-primary/15 rounded-xl">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <TrendingDown className="h-3 w-3 inline mr-1 text-primary" />
              Nos planos Pro e Elite, a comissão diminui automaticamente conforme seu volume de vendas aumenta.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="border-border/30 shadow-sm overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/10 to-transparent" />
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-bold">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          {steps.map((item, i) => (
            <div key={item.step} className="flex gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
