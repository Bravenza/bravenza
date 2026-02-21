import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Plus, Eye, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Layers,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

type DecisionStatus = "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED";

interface MatchRoom {
  id: string;
  search_id: string;
  user_id: string;
  decision_deadline_at: string | null;
  decision_status: DecisionStatus | null;
  created_at: string | null;
  vault_members?: { client_name: string; tier: string; };
  vault_searches?: { status: string; vault_wishlists?: { title: string | null; product_name: string | null; }; };
}

interface PendingSearch {
  id: string;
  user_id: string;
  status: string;
  vault_members?: { client_name: string; tier: string; };
  vault_wishlists?: { title: string | null; product_name: string | null; };
}

const statusLabels: Record<DecisionStatus, string> = { PENDING: "Pendente", APPROVED: "Aprovada", DECLINED: "Recusada", EXPIRED: "Expirada" };
const statusColors: Record<DecisionStatus, string> = { PENDING: "bg-amber-500", APPROVED: "bg-emerald-600", DECLINED: "bg-red-500", EXPIRED: "bg-zinc-500" };

const VaultMatchRoomsPage = () => {
  const [matchRooms, setMatchRooms] = useState<MatchRoom[]>([]);
  const [pendingSearches, setPendingSearches] = useState<PendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ search_id: "", decision_hours: "24" });

  const fetchMatchRooms = async () => {
    setIsLoading(true);
    try {
      const { data: rooms, error: roomsError } = await supabase
        .from("vault_match_rooms")
        .select(`*, vault_members (client_name, tier), vault_searches!vault_match_rooms_search_id_fkey (status, vault_wishlists (title, product_name))`)
        .order("created_at", { ascending: false });
      if (roomsError) throw roomsError;
      setMatchRooms(rooms || []);

      const { data: searches, error: searchesError } = await supabase
        .from("vault_searches")
        .select(`id, user_id, status, vault_members (client_name, tier), vault_wishlists (title, product_name)`)
        .in("status", ["OPTIONS_IDENTIFIED", "VALIDATING"])
        .is("match_room_id", null);
      if (searchesError) throw searchesError;
      setPendingSearches(searches || []);
    } catch (error) {
      console.error("Error fetching match rooms:", error);
      toast.error("Erro ao carregar match rooms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMatchRooms(); }, []);

  const handleCreateMatchRoom = async () => {
    if (!createForm.search_id) { toast.error("Selecione uma busca"); return; }
    try {
      const search = pendingSearches.find(s => s.id === createForm.search_id);
      if (!search) return;
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + parseInt(createForm.decision_hours));

      const { data: newRoom, error: roomError } = await supabase
        .from("vault_match_rooms")
        .insert({ search_id: search.id, user_id: search.user_id, decision_deadline_at: deadline.toISOString(), decision_status: "PENDING" })
        .select().single();
      if (roomError) throw roomError;

      await supabase.from("vault_searches").update({ match_room_id: newRoom.id, status: "MATCH_SENT", last_update_at: new Date().toISOString() }).eq("id", search.id);

      toast.success("Match room criada");
      setIsCreateOpen(false);
      setCreateForm({ search_id: "", decision_hours: "24" });
      fetchMatchRooms();
    } catch (error) {
      console.error("Error creating match room:", error);
      toast.error("Erro ao criar match room");
    }
  };

  const filteredRooms = matchRooms.filter((room) => {
    const memberName = room.vault_members?.client_name?.toLowerCase() || "";
    const productTitle = room.vault_searches?.vault_wishlists?.title?.toLowerCase() || room.vault_searches?.vault_wishlists?.product_name?.toLowerCase() || "";
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || productTitle.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || room.decision_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: matchRooms.length,
    pending: matchRooms.filter(r => r.decision_status === "PENDING").length,
    approved: matchRooms.filter(r => r.decision_status === "APPROVED").length,
    declined: matchRooms.filter(r => r.decision_status === "DECLINED").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match Rooms</h1>
          <p className="text-muted-foreground">Gerencie as salas de decisão dos membros</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchMatchRooms} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm"><Plus className="h-4 w-4 mr-2" />Nova match room</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Layers className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /><div><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-muted-foreground">Aprovadas</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" /><div><p className="text-2xl font-bold">{stats.declined}</p><p className="text-xs text-muted-foreground">Recusadas</p></div></div></CardContent></Card>
      </div>

      {pendingSearches.length > 0 && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="font-medium">{pendingSearches.length} busca(s) com opções prontas para criar match room</p>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setIsCreateOpen(true)}>Criar match room</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por membro ou produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="APPROVED">Aprovadas</SelectItem>
            <SelectItem value="DECLINED">Recusadas</SelectItem>
            <SelectItem value="EXPIRED">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma match room encontrada</TableCell></TableRow>
              ) : (
                filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{room.vault_members?.client_name || "Desconhecido"}</p>
                        <Badge variant="outline" className="text-xs mt-1">{room.vault_members?.tier === "elite" ? "Black" : room.vault_members?.tier === "collector" ? "Privilege" : "Access"}</Badge>
                      </div>
                    </TableCell>
                    <TableCell><p className="font-medium">{room.vault_searches?.vault_wishlists?.title || room.vault_searches?.vault_wishlists?.product_name || "Não especificado"}</p></TableCell>
                    <TableCell><Badge className={statusColors[room.decision_status || "PENDING"]}>{statusLabels[room.decision_status || "PENDING"]}</Badge></TableCell>
                    <TableCell>{room.decision_deadline_at ? formatDate(room.decision_deadline_at) : "-"}</TableCell>
                    <TableCell>{room.created_at ? formatDate(room.created_at) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Link to={`/admin/vault/matchrooms/${room.id}`}>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </Link>
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
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground card-premium rounded-lg">Nenhuma match room encontrada</div>
        ) : (
          filteredRooms.map((room) => (
            <Link key={room.id} to={`/admin/vault/matchrooms/${room.id}`}>
              <Card className="card-premium active:scale-[0.98] transition-transform">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{room.vault_members?.client_name}</p>
                    <Badge className={statusColors[room.decision_status || "PENDING"]}>{statusLabels[room.decision_status || "PENDING"]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{room.vault_searches?.vault_wishlists?.title || room.vault_searches?.vault_wishlists?.product_name}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{room.decision_deadline_at ? formatDate(room.decision_deadline_at) : "-"}</span>
                    <span>{room.created_at ? formatDate(room.created_at) : "-"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Create Match Room Dialog - kept as modal (only 2 fields) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Criar match room</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Busca</label>
              <Select value={createForm.search_id} onValueChange={(value) => setCreateForm({ ...createForm, search_id: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma busca" /></SelectTrigger>
                <SelectContent>
                  {pendingSearches.map((search) => (
                    <SelectItem key={search.id} value={search.id}>
                      {search.vault_members?.client_name} - {search.vault_wishlists?.title || search.vault_wishlists?.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Janela de decisão (horas)</label>
              <Select value={createForm.decision_hours} onValueChange={(value) => setCreateForm({ ...createForm, decision_hours: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 horas (Access)</SelectItem>
                  <SelectItem value="12">12 horas (Privilege)</SelectItem>
                  <SelectItem value="24">24 horas (Black)</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateMatchRoom}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultMatchRoomsPage;
