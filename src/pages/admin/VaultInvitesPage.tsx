import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Search, Plus, RefreshCw, Ticket, CheckCircle, Clock, XCircle, Copy,
  CalendarIcon, Download, Package,
} from "lucide-react";
import { formatDate } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────
interface VaultInvite {
  id: string;
  invite_code: string;
  inviter_id: string;
  status: string | null;
  created_at: string | null;
  expires_at: string | null;
  used_at: string | null;
  used_by_member_id: string | null;
  reward_granted: boolean | null;
  vault_members?: { client_name: string; tier: string };
}

interface VaultMember {
  id: string;
  client_name: string;
  tier: string;
  invites_remaining: number | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente", used: "Usado", expired: "Expirado", invalidated: "Invalidado",
};
const statusColors: Record<string, string> = {
  pending: "bg-amber-500", used: "bg-emerald-600", expired: "bg-zinc-500", invalidated: "bg-red-500",
};

const VaultInvitesPage = () => {
  const [invites, setInvites] = useState<VaultInvite[]>([]);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [allMembers, setAllMembers] = useState<VaultMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Batch state
  const [batchQty, setBatchQty] = useState(10);
  const [batchMemberId, setBatchMemberId] = useState("");
  const [batchExpiry, setBatchExpiry] = useState<Date | undefined>(undefined);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const [invitesRes, membersRes, allMembersRes] = await Promise.all([
        supabase.from("vault_invites")
          .select(`*, vault_members!vault_invites_inviter_id_fkey (client_name, tier)`)
          .order("created_at", { ascending: false }),
        supabase.from("vault_members")
          .select("id, client_name, tier, invites_remaining")
          .eq("is_active", true)
          .gt("invites_remaining", 0),
        supabase.from("vault_members")
          .select("id, client_name, tier, invites_remaining")
          .eq("is_active", true)
          .order("client_name"),
      ]);

      if (invitesRes.error) throw invitesRes.error;
      setInvites(invitesRes.data || []);
      if (!membersRes.error) setMembers(membersRes.data || []);
      if (!allMembersRes.error) setAllMembers(allMembersRes.data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("Erro ao carregar convites");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvites(); }, []);

  const generateInviteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "VLT-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // ── Single invite creation (existing logic) ──
  const handleCreateInvite = async () => {
    if (!selectedMemberId) { toast.error("Selecione um membro"); return; }
    try {
      const member = members.find((m) => m.id === selectedMemberId);
      if (!member) return;
      const inviteCode = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const tierMap: Record<string, "member" | "collector" | "elite"> = {
        member: "member", collector: "collector", elite: "elite",
      };
      const { error: inviteError } = await supabase.from("vault_invites").insert({
        invite_code: inviteCode,
        inviter_id: selectedMemberId,
        created_by_tier_at_time: tierMap[member.tier] || "member",
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });
      if (inviteError) throw inviteError;
      await supabase.from("vault_members")
        .update({ invites_remaining: (member.invites_remaining || 0) - 1 })
        .eq("id", selectedMemberId);
      toast.success(`Convite criado: ${inviteCode}`);
      setIsCreateOpen(false);
      setSelectedMemberId("");
      fetchInvites();
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Erro ao criar convite");
    }
  };

  // ── Batch invite creation ──
  const handleBatchGenerate = async () => {
    if (batchQty < 1 || batchQty > 100) {
      toast.error("Quantidade deve ser entre 1 e 100");
      return;
    }
    if (!batchMemberId) {
      toast.error("Selecione um membro vinculado");
      return;
    }

    setIsBatchGenerating(true);
    try {
      const member = allMembers.find((m) => m.id === batchMemberId);
      const tierMap: Record<string, "member" | "collector" | "elite"> = {
        member: "member", collector: "collector", elite: "elite",
      };
      const codes = Array.from({ length: batchQty }, () => generateInviteCode());
      const rows = codes.map((code) => ({
        invite_code: code,
        inviter_id: batchMemberId,
        created_by_tier_at_time: member ? (tierMap[member.tier] || "member") : "member" as const,
        status: "pending",
        expires_at: batchExpiry ? batchExpiry.toISOString() : null,
      }));

      const { error } = await supabase.from("vault_invites").insert(rows);
      if (error) throw error;

      setGeneratedCodes(codes);
      setIsResultDialogOpen(true);
      toast.success(`${codes.length} convites gerados!`);
      fetchInvites();
    } catch (error) {
      console.error("Error generating batch invites:", error);
      toast.error("Erro ao gerar convites em lote");
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    toast.success("Códigos copiados!");
  };

  const handleDownloadCsv = () => {
    const now = new Date().toISOString();
    const header = "invite_code,expires_at,created_at";
    const csvRows = generatedCodes.map(
      (code) => `${code},${batchExpiry ? batchExpiry.toISOString() : ""},${now}`
    );
    const blob = new Blob([header + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `convites-lote-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInvalidateInvite = async (invite: VaultInvite) => {
    try {
      const { error } = await supabase.from("vault_invites")
        .update({ status: "invalidated" }).eq("id", invite.id);
      if (error) throw error;
      await supabase.from("vault_members")
        .update({ invites_remaining: supabase.rpc ? 1 : 1 })
        .eq("id", invite.inviter_id);
      toast.success("Convite invalidado");
      fetchInvites();
    } catch (error) {
      console.error("Error invalidating invite:", error);
      toast.error("Erro ao invalidar convite");
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      invite.invite_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.vault_members?.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invite.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invites.length,
    pending: invites.filter((i) => i.status === "pending").length,
    used: invites.filter((i) => i.status === "used").length,
    expired: invites.filter((i) => i.status === "expired").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vault Pass (Convites)</h1>
          <p className="text-muted-foreground">Gerencie os convites do clube</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInvites} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />Novo convite
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Ticket className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /><div><p className="text-2xl font-bold">{stats.used}</p><p className="text-xs text-muted-foreground">Usados</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-zinc-500" /><div><p className="text-2xl font-bold">{stats.expired}</p><p className="text-xs text-muted-foreground">Expirados</p></div></div></CardContent></Card>
      </div>

      {/* Batch Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Gerar Convites em Lote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Quantidade (1–100)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={batchQty}
                onChange={(e) => setBatchQty(Math.max(1, Math.min(100, Number(e.target.value))))}
              />
            </div>

            <div className="space-y-2">
              <Label>Vinculado a membro</Label>
              <Select value={batchMemberId} onValueChange={setBatchMemberId}>
                <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                <SelectContent>
                  {allMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expiração (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !batchExpiry && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {batchExpiry ? format(batchExpiry, "dd/MM/yyyy") : "Sem expiração"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={batchExpiry}
                    onSelect={setBatchExpiry}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleBatchGenerate} disabled={isBatchGenerating || !batchMemberId} className="w-full">
              {isBatchGenerating ? "Gerando..." : `Gerar ${batchQty} convites`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código ou membro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="used">Usados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
            <SelectItem value="invalidated">Invalidados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invites Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum convite encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">{invite.invite_code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyInviteCode(invite.invite_code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invite.vault_members?.client_name || "Desconhecido"}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {invite.vault_members?.tier === "elite" ? "Black" : invite.vault_members?.tier === "collector" ? "Privilege" : "Access"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invite.status || "pending"]}>{statusLabels[invite.status || "pending"]}</Badge>
                    </TableCell>
                    <TableCell>{invite.created_at ? formatDate(invite.created_at) : "-"}</TableCell>
                    <TableCell>{invite.expires_at ? formatDate(invite.expires_at) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {invite.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => handleInvalidateInvite(invite)} className="text-destructive hover:text-destructive">
                            Invalidar
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

      {/* Create Single Invite Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Criar convite</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Membro</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                <SelectContent>
                  {members.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum membro com convites disponíveis</SelectItem>
                  ) : (
                    members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.client_name} ({member.invites_remaining} restantes)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Apenas membros com convites disponíveis são listados</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateInvite} disabled={!selectedMemberId}>Criar convite</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Result Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convites gerados ({generatedCodes.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-3 bg-secondary/50">
              {generatedCodes.map((code, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <code className="text-sm font-mono">{code}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyInviteCode(code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCopyAll}>
                <Copy className="h-4 w-4 mr-2" />Copiar todos
              </Button>
              <Button onClick={handleDownloadCsv}>
                <Download className="h-4 w-4 mr-2" />Baixar CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultInvitesPage;
