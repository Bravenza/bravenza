import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Gift, Users, Search, Copy, Check, Clock, Plus, Percent,
  TrendingUp, Download, DollarSign, BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Referral {
  id: string;
  referrer_cpf: string;
  referrer_name: string;
  referrer_email: string | null;
  referral_code: string;
  referred_cpf: string | null;
  referred_name: string | null;
  referred_order_id: string | null;
  discount_percentage: number;
  discount_used: boolean;
  discount_used_at: string | null;
  discount_order_id: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  converted: "bg-info/20 text-info border-info/30",
  rewarded: "bg-success/20 text-success border-success/30",
  expired: "bg-muted text-muted-foreground border-muted",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  converted: "Convertido",
  rewarded: "Recompensado",
  expired: "Expirado",
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReferral, setNewReferral] = useState({
    referrer_cpf: "",
    referrer_name: "",
    referrer_email: "",
    discount_percentage: 5,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const fetchReferrals = async () => {
    try {
      let query = supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast({ title: "Erro", description: "Não foi possível carregar as indicações.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── KPIs ──
  const kpis = useMemo(() => {
    const total = referrals.length;
    const converted = referrals.filter(
      (r) => r.status === "converted" || r.status === "rewarded" || r.referred_order_id
    ).length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";
    const pendingCount = referrals.filter((r) => r.status === "pending").length;
    const rewardedCount = referrals.filter((r) => r.status === "rewarded").length;
    return { total, converted, conversionRate, pendingCount, rewardedCount };
  }, [referrals]);

  // ── Monthly chart data (last 6 months) ──
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { label: string; start: Date; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      months.push({
        label: format(start, "MMM/yy", { locale: ptBR }),
        start,
        count: 0,
      });
    }
    referrals.forEach((r) => {
      const created = new Date(r.created_at);
      for (let i = 0; i < months.length; i++) {
        const nextStart = i < months.length - 1 ? months[i + 1].start : subMonths(now, -1);
        if (
          (isAfter(created, months[i].start) || created.getTime() === months[i].start.getTime()) &&
          !isAfter(created, nextStart)
        ) {
          months[i].count++;
          break;
        }
      }
    });
    return months.map((m) => ({ name: m.label, indicações: m.count }));
  }, [referrals]);

  // ── CSV export ──
  const handleExportCSV = () => {
    const header = "referrer_name,referrer_email,referred_name,referred_email,referral_code,status,discount_percentage,created_at,discount_used_at";
    const rows = referrals.map((r) =>
      [
        `"${r.referrer_name}"`,
        r.referrer_email || "",
        r.referred_name || "",
        "",
        r.referral_code,
        r.status,
        r.discount_percentage,
        r.created_at,
        r.discount_used_at || "",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `indicacoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${referrals.length} indicações exportadas` });
  };

  // ── Bulk mark as rewarded ──
  const pendingReferrals = referrals.filter((r) => r.status === "converted");
  const selectedPendingIds = [...selectedIds].filter((id) =>
    pendingReferrals.some((r) => r.id === id)
  );

  const handleBulkReward = async () => {
    if (selectedPendingIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("referrals")
        .update({
          status: "rewarded",
          discount_used: true,
          discount_used_at: new Date().toISOString(),
        })
        .in("id", selectedPendingIds);

      if (error) throw error;
      toast({ title: `${selectedPendingIds.length} indicações marcadas como recompensadas` });
      setSelectedIds(new Set());
      fetchReferrals();
    } catch (error) {
      console.error("Error bulk rewarding:", error);
      toast({ title: "Erro", description: "Falha ao processar em lote.", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPendingIds.length === pendingReferrals.length && pendingReferrals.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReferrals.map((r) => r.id)));
    }
  };

  // ── Existing handlers (unchanged) ──
  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "BRVZ";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateReferral = async () => {
    if (!newReferral.referrer_cpf || !newReferral.referrer_name) {
      toast({ title: "Campos obrigatórios", description: "CPF e nome do indicador são obrigatórios.", variant: "destructive" });
      return;
    }
    try {
      const referralCode = generateReferralCode();
      const { error } = await supabase.from("referrals").insert([{
        referrer_cpf: newReferral.referrer_cpf.replace(/\D/g, ""),
        referrer_name: newReferral.referrer_name,
        referrer_email: newReferral.referrer_email || null,
        referral_code: referralCode,
        discount_percentage: newReferral.discount_percentage,
        status: "pending",
      }]);
      if (error) throw error;
      toast({ title: "Código de indicação criado com sucesso!" });
      setIsDialogOpen(false);
      setNewReferral({ referrer_cpf: "", referrer_name: "", referrer_email: "", discount_percentage: 5 });
      fetchReferrals();
    } catch (error) {
      console.error("Error creating referral:", error);
      const msg = error instanceof Error ? error.message : "";
      toast({
        title: "Erro",
        description: msg.includes("duplicate") ? "Este código de indicação já existe." : "Não foi possível criar a indicação.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Código copiado!" });
  };

  const handleMarkAsRewarded = async (id: string) => {
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ status: "rewarded", discount_used: true, discount_used_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Recompensa aplicada!" });
      fetchReferrals();
    } catch (error) {
      console.error("Error updating referral:", error);
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      referral.referrer_name.toLowerCase().includes(search) ||
      referral.referral_code.toLowerCase().includes(search) ||
      referral.referred_name?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando indicações…</span>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programa de Indicação</h1>
          <p className="text-muted-foreground">Gerencie os códigos de indicação e recompensas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="btn-gold">
            <Plus className="mr-2 h-4 w-4" />
            Nova Indicação
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{kpis.total}</p>
              </div>
              <Gift className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Convertidas</p>
                <p className="text-2xl font-bold text-info">{kpis.converted}</p>
              </div>
              <Users className="h-7 w-7 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversão</p>
                <p className="text-2xl font-bold text-primary">{kpis.conversionRate}%</p>
              </div>
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{kpis.pendingCount}</p>
              </div>
              <Clock className="h-7 w-7 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Recompensadas</p>
                <p className="text-2xl font-bold text-success">{kpis.rewardedCount}</p>
              </div>
              <Check className="h-7 w-7 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Indicações por Mês (últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="indicações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPendingIds.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedPendingIds.length} selecionada(s)
            </span>
            <Button
              size="sm"
              onClick={handleBulkReward}
              disabled={isBulkProcessing}
              className="btn-gold"
            >
              <Check className="mr-2 h-4 w-4" />
              {isBulkProcessing ? "Processando..." : `Marcar ${selectedPendingIds.length} como recompensadas`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
                <SelectItem value="rewarded">Recompensados</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="card-premium hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={pendingReferrals.length > 0 && selectedPendingIds.length === pendingReferrals.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todas convertidas"
                  />
                </TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Indicado</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma indicação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      {referral.status === "converted" && (
                        <Checkbox
                          checked={selectedIds.has(referral.id)}
                          onCheckedChange={() => toggleSelect(referral.id)}
                          aria-label={`Selecionar ${referral.referrer_name}`}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{referral.referrer_name}</p>
                        <p className="text-xs text-muted-foreground">{referral.referrer_email || "Sem email"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-secondary px-2 py-1 rounded text-sm font-mono">{referral.referral_code}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyCode(referral.referral_code)}>
                          {copiedCode === referral.referral_code ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {referral.referred_name ? (
                        <div>
                          <p className="font-medium">{referral.referred_name}</p>
                          {referral.referred_order_id && <p className="text-xs text-muted-foreground">Pedido: {referral.referred_order_id}</p>}
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1"><Percent className="h-3 w-3" />{referral.discount_percentage}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[referral.status] || STATUS_COLORS.pending}>{STATUS_LABELS[referral.status] || referral.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {referral.status === "converted" && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsRewarded(referral.id)}>Aplicar Recompensa</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground card-premium rounded-lg">
            <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma indicação encontrada
          </div>
        ) : (
          filteredReferrals.map((referral) => (
            <Card key={referral.id} className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {referral.status === "converted" && (
                      <Checkbox
                        checked={selectedIds.has(referral.id)}
                        onCheckedChange={() => toggleSelect(referral.id)}
                      />
                    )}
                    <div>
                      <p className="font-medium">{referral.referrer_name}</p>
                      <p className="text-xs text-muted-foreground">{referral.referrer_email || "Sem email"}</p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[referral.status] || STATUS_COLORS.pending}>
                    {STATUS_LABELS[referral.status] || referral.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <code className="bg-secondary px-2 py-1 rounded text-sm font-mono">{referral.referral_code}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyCode(referral.referral_code)}>
                    {copiedCode === referral.referral_code ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Badge variant="outline" className="gap-1 ml-auto"><Percent className="h-3 w-3" />{referral.discount_percentage}%</Badge>
                </div>
                {referral.referred_name && (
                  <div className="text-sm mb-2">
                    <span className="text-muted-foreground">Indicado: </span>
                    <span className="font-medium">{referral.referred_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  {referral.status === "converted" && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleMarkAsRewarded(referral.id)}>
                      Recompensa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Referral Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Indicação</DialogTitle>
            <DialogDescription>Crie um código de indicação para um cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="referrer_name">Nome do Indicador *</Label>
              <Input id="referrer_name" value={newReferral.referrer_name} onChange={(e) => setNewReferral({ ...newReferral, referrer_name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referrer_cpf">CPF do Indicador *</Label>
              <Input id="referrer_cpf" value={newReferral.referrer_cpf} onChange={(e) => setNewReferral({ ...newReferral, referrer_cpf: e.target.value })} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referrer_email">Email</Label>
              <Input id="referrer_email" type="email" value={newReferral.referrer_email} onChange={(e) => setNewReferral({ ...newReferral, referrer_email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Desconto (%)</Label>
              <Input id="discount_percentage" type="number" min="1" max="50" value={newReferral.discount_percentage} onChange={(e) => setNewReferral({ ...newReferral, discount_percentage: parseInt(e.target.value) || 5 })} />
              <p className="text-xs text-muted-foreground">Desconto que o indicador receberá quando alguém usar seu código</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateReferral} className="btn-gold">Gerar Código</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
