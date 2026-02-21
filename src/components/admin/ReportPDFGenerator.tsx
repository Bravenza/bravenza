import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/constants";

export function ReportPDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import – jsPDF (~200KB) only loads when user clicks
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Single RPC call replaces 4 parallel queries
      const { data, error } = await supabase.rpc("get_admin_report_pdf_data", {
        p_month_start: monthStart.toISOString(),
        p_month_end: monthEnd.toISOString(),
        p_last_month_start: lastMonthStart.toISOString(),
        p_last_month_end: lastMonthEnd.toISOString(),
      });

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

      // Generate PDF
      const doc = new jsPDF();
      const monthName = format(now, "MMMM yyyy", { locale: ptBR });

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("BRAVENZA", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Relatório Mensal — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 27);
      doc.text(`Gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm")}`, 14, 33);
      doc.setTextColor(0);

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(14, 37, 196, 37);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores-Chave", 14, 47);

      const kpis = [
        ["Receita Total", formatCurrency(revenue), `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs mês anterior`],
        ["Custos Totais", formatCurrency(costs), ""],
        ["Lucro Bruto", formatCurrency(profit), `Margem: ${margin.toFixed(1)}%`],
        ["Ticket Médio", formatCurrency(avgTicket), `${paidCount} pedidos pagos`],
        ["Novos Pedidos", String(d.order_count || 0), `${d.last_order_count || 0} no mês anterior`],
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

      const tableY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Pedidos do Mês", 14, tableY);

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

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Bravenza — Relatório Confidencial — Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
      }

      doc.save(`bravenza-relatorio-${format(now, "yyyy-MM")}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" onClick={generateReport} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
      Relatório PDF
    </Button>
  );
}