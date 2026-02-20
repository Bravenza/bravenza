import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ReportPDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch current month data
      const [currentRes, lastRes, requestsRes, membersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("order_id, client_name, product_name, current_status, product_price, product_cost, shipping_cost, other_costs, sinal_paid, balance_paid, created_at")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase
          .from("orders")
          .select("product_price, product_cost, shipping_cost, other_costs, sinal_paid, balance_paid")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("order_requests")
          .select("id, status")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase
          .from("vault_members")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);

      const orders = currentRes.data || [];
      const lastOrders = lastRes.data || [];
      const requests = requestsRes.data || [];

      // Calculate metrics
      let revenue = 0, costs = 0;
      orders.forEach((o) => {
        if (o.sinal_paid || o.balance_paid) revenue += o.product_price || 0;
        costs += (o.product_cost || 0) + (o.shipping_cost || 0) + (o.other_costs || 0);
      });
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const ticket = orders.filter((o) => o.sinal_paid || o.balance_paid).length;
      const avgTicket = ticket > 0 ? revenue / ticket : 0;

      let lastRevenue = 0;
      lastOrders.forEach((o) => {
        if (o.sinal_paid || o.balance_paid) lastRevenue += o.product_price || 0;
      });
      const revenueChange = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;

      // Generate PDF
      const doc = new jsPDF();
      const monthName = format(now, "MMMM yyyy", { locale: ptBR });

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("BRAVENZA", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Relatório Mensal — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 27);
      doc.text(`Gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm")}`, 14, 33);
      doc.setTextColor(0);

      // Separator
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(14, 37, 196, 37);

      // KPIs section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores-Chave", 14, 47);

      const kpis = [
        ["Receita Total", formatCurrency(revenue), `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs mês anterior`],
        ["Custos Totais", formatCurrency(costs), ""],
        ["Lucro Bruto", formatCurrency(profit), `Margem: ${margin.toFixed(1)}%`],
        ["Ticket Médio", formatCurrency(avgTicket), `${ticket} pedidos pagos`],
        ["Novos Pedidos", String(orders.length), `${lastOrders.length} no mês anterior`],
        ["Solicitações", String(requests.length), `${requests.filter((r) => r.status === "pending").length} pendentes`],
        ["Membros Vault", String(membersRes.count || 0), "Ativos"],
      ];

      autoTable(doc, {
        startY: 52,
        head: [["Métrica", "Valor", "Observação"]],
        body: kpis,
        theme: "striped",
        headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: "bold" },
        styles: { fontSize: 10 },
      });

      // Orders table
      const tableY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Pedidos do Mês", 14, tableY);

      const orderRows = orders.slice(0, 20).map((o) => [
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
        columnStyles: {
          0: { cellWidth: 28 },
          4: { halign: "right" },
        },
      });

      // Status distribution
      const statusCounts: Record<string, number> = {};
      orders.forEach((o) => {
        const label = ORDER_STATUS_LABELS[o.current_status] || o.current_status;
        statusCounts[label] = (statusCounts[label] || 0) + 1;
      });

      const statusY = (doc as any).lastAutoTable.finalY + 15;
      if (statusY < 250) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Distribuição por Status", 14, statusY);

        autoTable(doc, {
          startY: statusY + 5,
          head: [["Status", "Quantidade", "% do Total"]],
          body: Object.entries(statusCounts).map(([status, count]) => [
            status,
            String(count),
            `${((count / orders.length) * 100).toFixed(1)}%`,
          ]),
          theme: "striped",
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: "bold" },
          styles: { fontSize: 9 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Bravenza — Relatório Confidencial — Página ${i} de ${pageCount}`,
          105,
          290,
          { align: "center" }
        );
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
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      Relatório PDF
    </Button>
  );
}
