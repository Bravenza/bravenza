import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Gift,
  Users,
  Search,
  Copy,
  Check,
  Clock,
  Plus,
  Percent,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  converted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rewarded: "bg-green-500/20 text-green-400 border-green-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar as indicações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      toast({
        title: "Campos obrigatórios",
        description: "CPF e nome do indicador são obrigatórios.",
        variant: "destructive",
      });
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
      setNewReferral({
        referrer_cpf: "",
        referrer_name: "",
        referrer_email: "",
        discount_percentage: 5,
      });
      fetchReferrals();
    } catch (error: any) {
      console.error("Error creating referral:", error);
      toast({
        title: "Erro",
        description: error.message?.includes("duplicate") 
          ? "Este código de indicação já existe." 
          : "Não foi possível criar a indicação.",
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

  const handleMarkAsConverted = async (id: string, referredCpf: string, referredName: string) => {
    try {
      const { error } = await supabase
        .from("referrals")
        .update({
          status: "converted",
          referred_cpf: referredCpf,
          referred_name: referredName,
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Indicação marcada como convertida!" });
      fetchReferrals();
    } catch (error) {
      console.error("Error updating referral:", error);
    }
  };

  const handleMarkAsRewarded = async (id: string) => {
    try {
      const { error } = await supabase
        .from("referrals")
        .update({
          status: "rewarded",
          discount_used: true,
          discount_used_at: new Date().toISOString(),
        })
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const stats = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === "pending").length,
    converted: referrals.filter((r) => r.status === "converted").length,
    rewarded: referrals.filter((r) => r.status === "rewarded").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programa de Indicação</h1>
          <p className="text-muted-foreground">
            Gerencie os códigos de indicação e recompensas
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="btn-gold">
          <Plus className="mr-2 h-4 w-4" />
          Nova Indicação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold text-blue-500">{stats.converted}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recompensados</p>
                <p className="text-2xl font-bold text-green-500">{stats.rewarded}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Referrals Table */}
      <Card className="card-premium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhuma indicação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{referral.referrer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {referral.referrer_email || "Sem email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-secondary px-2 py-1 rounded text-sm font-mono">
                          {referral.referral_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyCode(referral.referral_code)}
                        >
                          {copiedCode === referral.referral_code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {referral.referred_name ? (
                        <div>
                          <p className="font-medium">{referral.referred_name}</p>
                          {referral.referred_order_id && (
                            <p className="text-xs text-muted-foreground">
                              Pedido: {referral.referred_order_id}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Percent className="h-3 w-3" />
                        {referral.discount_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[referral.status] || STATUS_COLORS.pending}>
                        {STATUS_LABELS[referral.status] || referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {referral.status === "converted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRewarded(referral.id)}
                          >
                            Aplicar Recompensa
                          </Button>
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

      {/* Create Referral Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Indicação</DialogTitle>
            <DialogDescription>
              Crie um código de indicação para um cliente
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="referrer_name">Nome do Indicador *</Label>
              <Input
                id="referrer_name"
                value={newReferral.referrer_name}
                onChange={(e) => setNewReferral({ ...newReferral, referrer_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer_cpf">CPF do Indicador *</Label>
              <Input
                id="referrer_cpf"
                value={newReferral.referrer_cpf}
                onChange={(e) => setNewReferral({ ...newReferral, referrer_cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer_email">Email</Label>
              <Input
                id="referrer_email"
                type="email"
                value={newReferral.referrer_email}
                onChange={(e) => setNewReferral({ ...newReferral, referrer_email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Desconto (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                min="1"
                max="50"
                value={newReferral.discount_percentage}
                onChange={(e) => setNewReferral({ ...newReferral, discount_percentage: parseInt(e.target.value) || 5 })}
              />
              <p className="text-xs text-muted-foreground">
                Desconto que o indicador receberá quando alguém usar seu código
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateReferral} className="btn-gold">
              Gerar Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
