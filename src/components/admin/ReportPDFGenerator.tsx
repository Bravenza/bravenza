import { useState } from "react";
import { FileDown, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PeriodOption = "current" | "previous" | "last3" | "custom";

export function ReportPDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodOption>("current");
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [includeOrders, setIncludeOrders] = useState(true);
  const [includeMarketplace, setIncludeMarketplace] = useState(true);
  const [includeFinancial, setIncludeFinancial] = useState(true);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "current":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "previous":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last3":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "custom":
        return { start: customStart || startOfMonth(now), end: customEnd || endOfMonth(now) };
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const now = new Date();
      const { start, end } = getDateRange();
      const lastMonthStart = startOfMonth(subMonths(start, 1));
      const lastMonthEnd = endOfMonth(subMonths(start, 1));

      // Fetch regular data + marketplace in parallel
      const promises: Promise<any>[] = [
        supabase.rpc("get_admin_report_pdf_data", {
          p_month_start: start.toISOString(),
          p_month_end: end.toISOString(),
          p_last_month_start: lastMonthStart.toISOString(),
          p_last_month_end: lastMonthEnd.toISOString(),
        }),
      ];

      if (includeMarketplace) {
        promises.push(
          supabase
            .from("vault_marketplace_orders")
            .select("id, order_code, sale_price, fee_amount, seller_payout, payout_status, status, created_at")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString())
            .in("status", ["completed", "delivered"])
        );
      }

      const results = await Promise.all(promises);
      const { data, error } = results[0];
      if (error) throw error;
      const d = data as any;

      const orders = d.orders || [];
      const statusDist = d.status_distribution || {};
      const revenue = d.revenue || 0;
      const lastRevenue = d.last_revenue || 0;
      const revenueChange = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;
      const costs = d.costs || 0;
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const paidCount = d.paid_count || 0;
      const avgTicket = paidCount > 0 ? revenue / paidCount : 0;

      // Marketplace data
      let mpOrders: any[] = [];
      if (includeMarketplace && results[1]) {
        if (results[1].error) console.error("Marketplace fetch error:", results[1].error);
        mpOrders = results[1].data || [];
      }

      const periodLabel = format(start, "dd/MM/yyyy") + " a " + format(end, "dd/MM/yyyy");

      // Generate PDF
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("BRAVENZA", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Relatório — ${periodLabel}`, 14, 27);
      doc.text(`Gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm")}`, 14, 33);
      doc.setTextColor(0);

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(14, 37, 196, 37);

      // KPIs
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores-Chave", 14, 47);

      const kpis = [
        ["Receita Total", formatCurrency(revenue), `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs período anterior`],
        ["Custos Totais", formatCurrency(costs), ""],
        ["Lucro Bruto", formatCurrency(profit), `Margem: ${margin.toFixed(1)}%`],
        ["Ticket Médio", formatCurrency(avgTicket), `${paidCount} pedidos pagos`],
        ["Novos Pedidos", String(d.order_count || 0), `${d.last_order_count || 0} no período anterior`],
        ["Solicitações", String(d.requests_total || 0), `${d.requests_pending || 0} pendentes`],
        ["Membros Vault", String(d.members_count || 0), "Ativos"],
      ];

      autoTable(doc, {
        startY: 52,
        head: [["Métrica", "Valor", "Observação"]],
        body: kpis,
        theme: "striped",
        headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: "bold" },
        styles: { fontSize: 10 },
      });

      // Orders section
      if (includeOrders) {
        const tableY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Pedidos Regulares", 14, tableY);

        const orderRows = orders.slice(0, 20).map((o: any) => [
          o.order_id,
          o.client_name,
          o.product_name || "-",
          ORDER_STATUS_LABELS[o.current_status] || o.current_status,
          formatCurrency(o.product_price || 0),
          format(new Date(o.created_at), "dd/MM"),
        ]);

        autoTable(doc, {
          startY: tableY + 5,
          head: [["ID", "Cliente", "Produto", "Status", "Valor", "Data"]],
          body: orderRows,
          theme: "striped",
          headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
          styles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 28 }, 4: { halign: "right" } },
        });

        const statusY = (doc as any).lastAutoTable.finalY + 15;
        if (statusY < 250) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Distribuição por Status", 14, statusY);

          const totalOrders = d.order_count || 1;
          autoTable(doc, {
            startY: statusY + 5,
            head: [["Status", "Quantidade", "% do Total"]],
            body: Object.entries(statusDist).map(([status, count]) => [
              ORDER_STATUS_LABELS[status] || status,
              String(count),
              `${(((count as number) / totalOrders) * 100).toFixed(1)}%`,
            ]),
            theme: "striped",
            headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: "bold" },
            styles: { fontSize: 9 },
          });
        }
      }

      // Marketplace section
      if (includeMarketplace && mpOrders.length > 0) {
        const mpY = (doc as any).lastAutoTable.finalY + 15;
        if (mpY > 240) doc.addPage();
        const startMpY = mpY > 240 ? 20 : mpY;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Marketplace", 14, startMpY);

        const gmv = mpOrders.reduce((s, o) => s + (o.sale_price || 0), 0);
        const totalFees = mpOrders.reduce((s, o) => s + (o.fee_amount || 0), 0);
        const releasedPayouts = mpOrders
          .filter((o) => o.payout_status === "released")
          .reduce((s, o) => s + (o.seller_payout || 0), 0);
        const pendingPayouts = mpOrders
          .filter((o) => o.payout_status !== "released")
          .reduce((s, o) => s + (o.seller_payout || 0), 0);

        const mpKpis = [
          ["Pedidos Marketplace", String(mpOrders.length), "Completados/Entregues"],
          ["GMV Total", formatCurrency(gmv), "Gross Merchandise Value"],
          ["Comissões Geradas", formatCurrency(totalFees), ""],
          ["Repasses Realizados", formatCurrency(releasedPayouts), "Payout released"],
          ["Repasses Pendentes", formatCurrency(pendingPayouts), "Aguardando liberação"],
        ];

        autoTable(doc, {
          startY: startMpY + 5,
          head: [["Métrica", "Valor", "Observação"]],
          body: mpKpis,
          theme: "striped",
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: "bold" },
          styles: { fontSize: 10 },
        });
      }

      // Financial consolidated
      if (includeFinancial) {
        const finY = (doc as any).lastAutoTable.finalY + 15;
        if (finY > 240) doc.addPage();
        const startFinY = finY > 240 ? 20 : finY;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Financeiro Consolidado", 14, startFinY);

        const mpGmv = includeMarketplace ? mpOrders.reduce((s, o) => s + (o.sale_price || 0), 0) : 0;
        const mpFees = includeMarketplace ? mpOrders.reduce((s, o) => s + (o.fee_amount || 0), 0) : 0;

        const finRows = [
          ["Receita Pedidos Regulares", formatCurrency(revenue)],
          ["Custos Pedidos Regulares", formatCurrency(costs)],
          ["Lucro Pedidos Regulares", formatCurrency(profit)],
          ...(includeMarketplace
            ? [
                ["GMV Marketplace", formatCurrency(mpGmv)],
                ["Comissões Marketplace", formatCurrency(mpFees)],
              ]
            : []),
          ["Receita Total Consolidada", formatCurrency(revenue + mpFees)],
        ];

        autoTable(doc, {
          startY: startFinY + 5,
          head: [["Item", "Valor"]],
          body: finRows,
          theme: "striped",
          headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
          styles: { fontSize: 10 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Bravenza — Relatório Confidencial — Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
      }

      const fileStart = format(start, "yyyy-MM-dd");
      const fileEnd = format(end, "yyyy-MM-dd");
      doc.save(`bravenza-relatorio-${fileStart}-${fileEnd}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setDialogOpen(true)}
        className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileDown className="h-4 w-4" />
        <span className="text-sm">Relatório PDF</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Relatório</DialogTitle>
            <DialogDescription>Escolha o período e as seções do relatório PDF.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Period */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês atual</SelectItem>
                  <SelectItem value="previous">Mês anterior</SelectItem>
                  <SelectItem value="last3">Últimos 3 meses</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {period === "custom" && (
                <div className="flex gap-2 pt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("flex-1 justify-start text-left font-normal", !customStart && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStart ? format(customStart, "dd/MM/yyyy") : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStart}
                        onSelect={setCustomStart}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("flex-1 justify-start text-left font-normal", !customEnd && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEnd ? format(customEnd, "dd/MM/yyyy") : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEnd}
                        onSelect={setCustomEnd}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Seções a incluir</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includeOrders} onCheckedChange={(v) => setIncludeOrders(!!v)} />
                  <span className="text-sm">Pedidos Regulares</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includeMarketplace} onCheckedChange={(v) => setIncludeMarketplace(!!v)} />
                  <span className="text-sm">Marketplace (GMV, comissões, repasses)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includeFinancial} onCheckedChange={(v) => setIncludeFinancial(!!v)} />
                  <span className="text-sm">Financeiro Consolidado</span>
                </label>
              </div>
            </div>

            <Button onClick={generateReport} disabled={isGenerating} className="w-full">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
              Gerar Relatório
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
