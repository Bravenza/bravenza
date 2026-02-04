import { useState, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Edit,
  RefreshCw,
  TrendingUp,
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

const VaultMembersPage = () => {
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<VaultMember | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    tier: "" as VaultTier,
    status: "" as VaultMemberStatus,
    notes_internal: "",
  });

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Erro ao carregar membros");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

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

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.client_cpf.includes(searchTerm) ||
      member.client_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === "all" || member.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  const stats = {
    total: members.length,
    access: members.filter((m) => m.tier === "member").length,
    privilege: members.filter((m) => m.tier === "collector").length,
    black: members.filter((m) => m.tier === "elite").length,
    eligibleForBlack: members.filter((m) => m.flags_eligible_for_black).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum membro encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.client_name}</p>
                        <p className="text-xs text-muted-foreground">
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
