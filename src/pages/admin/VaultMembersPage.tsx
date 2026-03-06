import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Search,
  Crown,
  Star,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  Edit,
  RefreshCw,
  TrendingUp,
  Download,
  Ban,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

type VaultTier = "member" | "collector" | "elite";
type VaultMemberStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

interface VaultMember {
  id: string;
  client_cpf: string;
  client_name: string;
  client_email: string | null;
  tier: VaultTier;
  status: VaultMemberStatus | null;
  total_purchases: number | null;
  total_spent: number | null;
  active_hunts: number | null;
  max_active_hunts: number | null;
  invites_remaining: number | null;
  stats_decision_rate: number | null;
  flags_eligible_for_black: boolean | null;
  flags_review_mode_until: string | null;
  notes_internal: string | null;
  created_at: string | null;
}

const tierLabels: Record<VaultTier, string> = {
  member: "Vault Access",
  collector: "Vault Privilege",
  elite: "Vault Black",
};

const tierColors: Record<VaultTier, string> = {
  member: "bg-muted-foreground",
  collector: "bg-primary",
  elite: "bg-foreground border border-primary",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  BANNED: "Banido",
};

const PAGE_SIZE = 20;

const VaultMembersPage = () => {
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMember, setSelectedMember] = useState<VaultMember | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    tier: "" as VaultTier,
    status: "" as VaultMemberStatus,
    notes_internal: "",
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTierOpen, setBulkTierOpen] = useState(false);
  const [bulkTier, setBulkTier] = useState<VaultTier>("member");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("vault_members")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,client_cpf.ilike.%${searchTerm}%`);
      }

      if (tierFilter !== "all") {
        query = query.eq("tier", tierFilter as VaultTier);
      }

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setMembers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Erro ao carregar membros");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, tierFilter, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => { setPage(0); }, [searchTerm, tierFilter]);

  const handleEditMember = (member: VaultMember) => {
    setSelectedMember(member);
    setEditForm({
      tier: member.tier,
      status: member.status || "ACTIVE",
      notes_internal: member.notes_internal || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;
    try {
      const { error } = await supabase
        .from("vault_members")
        .update({
          tier: editForm.tier,
          status: editForm.status,
          notes_internal: editForm.notes_internal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMember.id);
      if (error) throw error;
      toast.success("Membro atualizado com sucesso");
      setIsEditOpen(false);
      fetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Erro ao atualizar membro");
    }
  };

  const handleUpgradeToBlack = async (member: VaultMember) => {
    try {
      const { error } = await supabase
        .from("vault_members")
        .update({
          tier: "elite" as VaultTier,
          tier_upgraded_at: new Date().toISOString(),
          flags_eligible_for_black: false,
        })
        .eq("id", member.id);
      if (error) throw error;
      toast.success(`${member.client_name} promovido para Vault Black!`);
      fetchMembers();
    } catch (error) {
      console.error("Error upgrading member:", error);
      toast.error("Erro ao promover membro");
    }
  };

  const handleRemoveReviewMode = async (member: VaultMember) => {
    try {
      const { error } = await supabase
        .from("vault_members")
        .update({
          flags_review_mode_until: null,
          flags_consecutive_declines: 0,
        })
        .eq("id", member.id);
      if (error) throw error;
      toast.success("Modo revisão removido");
      fetchMembers();
    } catch (error) {
      console.error("Error removing review mode:", error);
      toast.error("Erro ao remover modo revisão");
    }
  };

  // Bulk helpers
  const allSelected = members.length > 0 && members.every(m => selectedIds.has(m.id));

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id)));
    }
  };

  const handleBulkChangeTier = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("vault_members")
        .update({ tier: bulkTier, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} membros atualizados para ${tierLabels[bulkTier]}`);
      setSelectedIds(new Set());
      setBulkTierOpen(false);
      fetchMembers();
    } catch (error) {
      console.error("Bulk tier change error:", error);
      toast.error("Erro ao alterar tier em lote");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("vault_members")
        .update({ status: "SUSPENDED" as VaultMemberStatus, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} membros desativados com sucesso`);
      setSelectedIds(new Set());
      fetchMembers();
    } catch (error) {
      console.error("Bulk deactivate error:", error);
      toast.error("Erro ao desativar em lote");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExport = () => {
    const selected = members.filter(m => selectedIds.has(m.id));
    if (selected.length === 0) return;
    const headers = ["Nome", "CPF", "Email", "Tier", "Status", "Compras", "Gasto Total"];
    const rows = selected.map(m => [
      m.client_name,
      m.client_cpf,
      m.client_email || "",
      tierLabels[m.tier],
      statusLabels[m.status || "ACTIVE"],
      String(m.total_purchases || 0),
      String(m.total_spent || 0),
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vault-membros-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} membros exportados`);
    setSelectedIds(new Set());
  };

  const stats = {
    total: totalCount,
    access: members.filter((m) => m.tier === "member").length,
    privilege: members.filter((m) => m.tier === "collector").length,
    black: members.filter((m) => m.tier === "elite").length,
    eligibleForBlack: members.filter((m) => m.flags_eligible_for_black).length,
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando membros…</span>
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membros Vault Club</h1>
          <p className="text-muted-foreground">
            Gerencie os membros do clube exclusivo
          </p>
        </div>
        <Button onClick={fetchMembers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.access}</p>
                <p className="text-xs text-muted-foreground">Access</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.privilege}</p>
                <p className="text-xs text-muted-foreground">Privilege</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.black}</p>
                <p className="text-xs text-muted-foreground">Black</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.eligibleForBlack}</p>
                <p className="text-xs text-muted-foreground">Elegíveis Black</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tiers</SelectItem>
            <SelectItem value="member">Vault Access</SelectItem>
            <SelectItem value="collector">Vault Privilege</SelectItem>
            <SelectItem value="elite">Vault Black</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} selecionados</span>
          <Button size="sm" variant="outline" onClick={() => setBulkTierOpen(true)} disabled={bulkActionLoading}>
            <Crown className="h-4 w-4 mr-1" /> Mudar tier
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkDeactivate} disabled={bulkActionLoading}>
            <Ban className="h-4 w-4 mr-1" /> Desativar
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Limpar</Button>
        </div>
      )}

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Membro</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead className="text-right">Gasto Total</TableHead>
                <TableHead className="text-right">Taxa Decisão</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum membro encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(member.id)}
                        onCheckedChange={() => toggleSelection(member.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.client_name}</p>
                          {member.client_email || member.client_cpf}
                        </p>
                        {member.flags_review_mode_until && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Em revisão
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={tierColors[member.tier]}>
                        {tierLabels[member.tier]}
                      </Badge>
                      {member.flags_eligible_for_black && member.tier !== "elite" && (
                        <Badge variant="outline" className="ml-2 text-xs border-primary text-primary">
                          Elegível Black
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.status === "ACTIVE"
                            ? "default"
                            : member.status === "SUSPENDED"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {statusLabels[member.status || "ACTIVE"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.total_purchases || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(member.total_spent || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.stats_decision_rate
                        ? `${(member.stats_decision_rate * 100).toFixed(0)}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {member.flags_eligible_for_black && member.tier !== "elite" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpgradeToBlack(member)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                        )}
                        {member.flags_review_mode_until && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveReviewMode(member)}
                            className="text-success hover:text-success/80"
                          >
                            <RefreshCw className="h-4 w-4" />
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

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {rangeStart}-{rangeEnd} de {totalCount} membros
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />Anterior
            </Button>
            <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              Próxima<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedMember.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMember.client_email || selectedMember.client_cpf}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tier</label>
                <Select
                  value={editForm.tier}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, tier: value as VaultTier })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Vault Access</SelectItem>
                    <SelectItem value="collector">Vault Privilege</SelectItem>
                    <SelectItem value="elite">Vault Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value as VaultMemberStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                    <SelectItem value="BANNED">Banido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas internas</label>
                <Textarea
                  value={editForm.notes_internal}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes_internal: e.target.value })
                  }
                  placeholder="Observações administrativas..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveMember}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultMembersPage;
