import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Eye,
  MessageSquare,
  Clock,
  AlertTriangle,
  RefreshCw,
  Target,
  CheckCircle,
  XCircle,
  Plus,
  Layers,
  BarChart3,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

// ─── Searches Types ───
type SearchStatus =
  | "RECEIVED"
  | "IN_CURATION"
  | "OPTIONS_IDENTIFIED"
  | "VALIDATING"
  | "MATCH_SENT"
  | "AWAITING_DECISION"
  | "CLOSED_APPROVED"
  | "CLOSED_NOT_FOUND"
  | "CLOSED_CANCELLED";

interface VaultSearch {
  id: string;
  user_id: string;
  wishlist_item_id: string | null;
  status: SearchStatus;
  is_active: boolean | null;
  started_at: string | null;
  last_update_at: string | null;
  sla_next_update_due_at: string | null;
  internal_notes: string | null;
  created_at: string | null;
  match_room_id: string | null;
  vault_members?: {
    client_name: string;
    client_email?: string | null;
    tier: string;
  };
  vault_wishlists?: {
    title: string | null;
    product_name: string | null;
    product_brand: string | null;
    product_model: string | null;
    product_size: string | null;
  };
}

const searchStatusLabels: Record<SearchStatus, string> = {
  RECEIVED: "Recebida",
  IN_CURATION: "Em curadoria",
  OPTIONS_IDENTIFIED: "Opções identificadas",
  VALIDATING: "Validando",
  MATCH_SENT: "Match enviado",
  AWAITING_DECISION: "Aguardando decisão",
  CLOSED_APPROVED: "Aprovada",
  CLOSED_NOT_FOUND: "Não encontrado",
  CLOSED_CANCELLED: "Cancelada",
};

const searchStatusColors: Record<SearchStatus, string> = {
  RECEIVED: "bg-blue-500",
  IN_CURATION: "bg-yellow-500",
  OPTIONS_IDENTIFIED: "bg-purple-500",
  VALIDATING: "bg-orange-500",
  MATCH_SENT: "bg-green-500",
  AWAITING_DECISION: "bg-amber-500",
  CLOSED_APPROVED: "bg-emerald-600",
  CLOSED_NOT_FOUND: "bg-zinc-500",
  CLOSED_CANCELLED: "bg-red-500",
};

// ─── Match Room Types ───
type DecisionStatus = "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED";

interface MatchRoom {
  id: string;
  search_id: string;
  user_id: string;
  decision_deadline_at: string | null;
  decision_status: DecisionStatus | null;
  decision_at: string | null;
  decision_notes_from_customer: string | null;
  rejection_category: string | null;
  rejection_reason: string | null;
  auto_research_search_id: string | null;
  created_at: string | null;
}

interface MatchOption {
  id: string;
  match_room_id: string;
  option_title: string;
  region: string | null;
  condition: string | null;
  price_estimate: number | null;
  currency: string | null;
  pros: string | null;
  risks: string | null;
  evidence_urls: string[] | null;
}

const decisionLabels: Record<DecisionStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  DECLINED: "Recusada",
  EXPIRED: "Expirada",
};

const decisionColors: Record<DecisionStatus, string> = {
  PENDING: "bg-amber-500",
  APPROVED: "bg-emerald-600",
  DECLINED: "bg-red-500",
  EXPIRED: "bg-zinc-500",
};

// ─── Main Page ───
const VaultSearchesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Curadoria Vault</h1>
        <p className="text-muted-foreground">
          Gerencie buscas ativas e match rooms dos membros
        </p>
      </div>

      <Tabs defaultValue="buscas" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="buscas" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscas
          </TabsTrigger>
          <TabsTrigger value="match-rooms" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Match Rooms
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buscas">
          <SearchesTab />
        </TabsContent>
        <TabsContent value="match-rooms">
          <MatchRoomsTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Searches Tab ───
function SearchesTab() {
  const [searches, setSearches] = useState<VaultSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedSearch, setSelectedSearch] = useState<VaultSearch | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  const fetchSearches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_searches")
        .select(`
          *,
          vault_members (client_name, client_email, tier),
          vault_wishlists (title, product_name, product_brand, product_model, product_size)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error("Error fetching searches:", error);
      toast.error("Erro ao carregar buscas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSearches(); }, []);

  const progressMap: Record<string, number> = {
    RECEIVED: 10, IN_CURATION: 35, OPTIONS_IDENTIFIED: 55,
    VALIDATING: 70, MATCH_SENT: 85, AWAITING_DECISION: 90,
    CLOSED_APPROVED: 100, CLOSED_NOT_FOUND: 100, CLOSED_CANCELLED: 100,
  };

  const handleUpdateStatus = async (search: VaultSearch, newStatus: SearchStatus) => {
    try {
      const { error } = await supabase
        .from("vault_searches")
        .update({
          status: newStatus,
          last_update_at: new Date().toISOString(),
          is_active: !["CLOSED_APPROVED", "CLOSED_NOT_FOUND", "CLOSED_CANCELLED"].includes(newStatus),
          progress_percentage: progressMap[newStatus] || 0,
        })
        .eq("id", search.id);

      if (error) throw error;
      toast.success("Status atualizado");
      fetchSearches();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handlePostUpdate = async () => {
    if (!selectedSearch || !updateMessage.trim()) return;
    try {
      const { error } = await supabase.from("vault_search_updates").insert({
        search_id: selectedSearch.id,
        update_type: "UPDATE",
        message: updateMessage,
        visible_to_customer: true,
      });
      if (error) throw error;
      // Update the progress message visible to client
      await supabase
        .from("vault_searches")
        .update({ 
          last_update_at: new Date().toISOString(),
          progress_message: updateMessage,
        })
        .eq("id", selectedSearch.id);
      toast.success("Atualização enviada ao cliente");
      setUpdateMessage("");
      setIsUpdateOpen(false);
      fetchSearches();
    } catch (error) {
      console.error("Error posting update:", error);
      toast.error("Erro ao enviar atualização");
    }
  };

  const filteredSearches = searches.filter((search) => {
    const memberName = search.vault_members?.client_name?.toLowerCase() || "";
    const productTitle = search.vault_wishlists?.title?.toLowerCase() || search.vault_wishlists?.product_name?.toLowerCase() || "";
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || productTitle.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && search.is_active) ||
      (statusFilter === "closed" && !search.is_active) ||
      search.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isOverdue = (search: VaultSearch) => {
    if (!search.sla_next_update_due_at) return false;
    return new Date(search.sla_next_update_due_at) < new Date();
  };

  const stats = {
    total: searches.length,
    active: searches.filter((s) => s.is_active).length,
    overdue: searches.filter((s) => s.is_active && isOverdue(s)).length,
    awaitingDecision: searches.filter((s) => s.status === "AWAITING_DECISION").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={fetchSearches} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
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
              <Search className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? "border-red-500" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${stats.overdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-500" : ""}`}>{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">SLA atrasado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.awaitingDecision}</p>
                <p className="text-xs text-muted-foreground">Aguardando decisão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por membro ou produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="closed">Finalizadas</SelectItem>
            <SelectItem value="RECEIVED">Recebidas</SelectItem>
            <SelectItem value="IN_CURATION">Em curadoria</SelectItem>
            <SelectItem value="OPTIONS_IDENTIFIED">Opções identificadas</SelectItem>
            <SelectItem value="AWAITING_DECISION">Aguardando decisão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última atualização</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSearches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma busca encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSearches.map((search) => (
                  <TableRow key={search.id} className={isOverdue(search) ? "bg-red-500/10" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{search.vault_members?.client_name || "Membro desconhecido"}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {search.vault_members?.tier === "elite" ? "Black" : search.vault_members?.tier === "collector" ? "Privilege" : "Access"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{search.vault_wishlists?.title || search.vault_wishlists?.product_name || "Produto não especificado"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[search.vault_wishlists?.product_brand, search.vault_wishlists?.product_model, search.vault_wishlists?.product_size].filter(Boolean).join(" • ")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select value={search.status} onValueChange={(value) => handleUpdateStatus(search, value as SearchStatus)}>
                        <SelectTrigger className="w-40">
                          <Badge className={searchStatusColors[search.status]}>{searchStatusLabels[search.status]}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(searchStatusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{search.last_update_at ? formatDate(search.last_update_at) : "-"}</TableCell>
                    <TableCell>
                      {search.sla_next_update_due_at ? (
                        <div className={isOverdue(search) ? "text-red-500 font-medium" : ""}>
                          {formatDate(search.sla_next_update_due_at)}
                          {isOverdue(search) && <AlertTriangle className="h-4 w-4 inline ml-1" />}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedSearch(search); setIsUpdateOpen(true); }}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedSearch(search); setIsDetailOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enviar atualização</DialogTitle></DialogHeader>
          {selectedSearch && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedSearch.vault_wishlists?.title || selectedSearch.vault_wishlists?.product_name}</p>
                <p className="text-sm text-muted-foreground">Para: {selectedSearch.vault_members?.client_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} placeholder="Descreva o progresso da busca..." rows={4} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Cancelar</Button>
                <Button onClick={handlePostUpdate} disabled={!updateMessage.trim()}>Enviar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da busca</DialogTitle></DialogHeader>
          {selectedSearch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Membro</p>
                  <p className="font-medium">{selectedSearch.vault_members?.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <p className="font-medium capitalize">
                    {selectedSearch.vault_members?.tier === "elite" ? "Vault Black" : selectedSearch.vault_members?.tier === "collector" ? "Vault Privilege" : "Vault Access"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedSearch.vault_wishlists?.title || selectedSearch.vault_wishlists?.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={searchStatusColors[selectedSearch.status]}>{searchStatusLabels[selectedSearch.status]}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Iniciada em</p>
                  <p className="font-medium">{selectedSearch.started_at ? formatDate(selectedSearch.started_at) : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{selectedSearch.last_update_at ? formatDate(selectedSearch.last_update_at) : "-"}</p>
                </div>
              </div>
              {selectedSearch.internal_notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas internas</p>
                  <p className="text-sm mt-1 p-2 bg-secondary rounded">{selectedSearch.internal_notes}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Match Rooms Tab ───
function MatchRoomsTab() {
  const [matchRooms, setMatchRooms] = useState<(MatchRoom & { member_name?: string; member_tier?: string; product_title?: string })[]>([]);
  const [pendingSearches, setPendingSearches] = useState<VaultSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<(MatchRoom & { member_name?: string }) | null>(null);
  const [roomOptions, setRoomOptions] = useState<MatchOption[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ search_id: "", decision_hours: "24" });
  const [optionForm, setOptionForm] = useState({
    option_title: "", region: "", condition: "DS", price_estimate: "", currency: "BRL", pros: "", risks: "",
  });

  const fetchMatchRooms = async () => {
    setIsLoading(true);
    try {
      // Fetch match rooms with search info via vault_searches FK
      const { data: rooms, error: roomsError } = await supabase
        .from("vault_match_rooms")
        .select(`
          *,
          vault_searches!vault_match_rooms_search_id_fkey (
            status,
            vault_wishlists ( title, product_name ),
            vault_members ( client_name, tier )
          )
        `)
        .order("created_at", { ascending: false });

      if (roomsError) throw roomsError;

      const enriched = (rooms || []).map((room: any) => ({
        ...room,
        member_name: room.vault_searches?.vault_members?.client_name,
        member_tier: room.vault_searches?.vault_members?.tier,
        product_title: room.vault_searches?.vault_wishlists?.title || room.vault_searches?.vault_wishlists?.product_name,
      }));
      setMatchRooms(enriched);

      // Fetch pending searches
      const { data: searches, error: searchesError } = await supabase
        .from("vault_searches")
        .select(`
          *, vault_members (client_name, tier), vault_wishlists (title, product_name, product_brand, product_model, product_size)
        `)
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

  const fetchRoomOptions = async (roomId: string) => {
    try {
      const { data, error } = await supabase.from("vault_match_options").select("*").eq("match_room_id", roomId);
      if (error) throw error;
      setRoomOptions(data || []);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => { fetchMatchRooms(); }, []);

  const handleOpenDetail = async (room: any) => {
    setSelectedRoom(room);
    await fetchRoomOptions(room.id);
    setIsDetailOpen(true);
  };

  const handleCreateMatchRoom = async () => {
    if (!createForm.search_id) { toast.error("Selecione uma busca"); return; }
    try {
      const search = pendingSearches.find((s) => s.id === createForm.search_id);
      if (!search) return;
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + parseInt(createForm.decision_hours));

      const { data: newRoom, error: roomError } = await supabase
        .from("vault_match_rooms")
        .insert({ search_id: search.id, user_id: search.user_id, decision_deadline_at: deadline.toISOString(), decision_status: "PENDING" })
        .select().single();

      if (roomError) throw roomError;

      await supabase.from("vault_searches")
        .update({ match_room_id: newRoom.id, status: "MATCH_SENT", last_update_at: new Date().toISOString() })
        .eq("id", search.id);

      toast.success("Match room criada");
      setIsCreateOpen(false);
      setCreateForm({ search_id: "", decision_hours: "24" });
      fetchMatchRooms();
    } catch (error) {
      console.error("Error creating match room:", error);
      toast.error("Erro ao criar match room");
    }
  };

  const handleAddOption = async () => {
    if (!selectedRoom || !optionForm.option_title) { toast.error("Preencha o título da opção"); return; }
    try {
      const { error } = await supabase.from("vault_match_options").insert({
        match_room_id: selectedRoom.id,
        option_title: optionForm.option_title,
        region: optionForm.region || null,
        condition: optionForm.condition,
        price_estimate: optionForm.price_estimate ? parseFloat(optionForm.price_estimate) : null,
        currency: optionForm.currency,
        pros: optionForm.pros || null,
        risks: optionForm.risks || null,
      });
      if (error) throw error;
      toast.success("Opção adicionada");
      setIsAddOptionOpen(false);
      setOptionForm({ option_title: "", region: "", condition: "DS", price_estimate: "", currency: "BRL", pros: "", risks: "" });
      await fetchRoomOptions(selectedRoom.id);
    } catch (error) {
      console.error("Error adding option:", error);
      toast.error("Erro ao adicionar opção");
    }
  };

  const filteredRooms = matchRooms.filter((room) => {
    const memberName = room.member_name?.toLowerCase() || "";
    const productTitle = room.product_title?.toLowerCase() || "";
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || productTitle.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || room.decision_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: matchRooms.length,
    pending: matchRooms.filter((r) => r.decision_status === "PENDING").length,
    approved: matchRooms.filter((r) => r.decision_status === "APPROVED").length,
    declined: matchRooms.filter((r) => r.decision_status === "DECLINED").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button onClick={fetchMatchRooms} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova match room
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-muted-foreground">Aprovadas</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div><p className="text-2xl font-bold">{stats.declined}</p><p className="text-xs text-muted-foreground">Recusadas</p></div>
            </div>
          </CardContent>
        </Card>
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

      <Card>
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
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma match room encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{room.member_name || "Membro desconhecido"}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {room.member_tier === "elite" ? "Black" : room.member_tier === "collector" ? "Privilege" : "Access"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell><p className="font-medium">{room.product_title || "Produto não especificado"}</p></TableCell>
                    <TableCell>
                      <Badge className={decisionColors[room.decision_status || "PENDING"]}>{decisionLabels[room.decision_status || "PENDING"]}</Badge>
                    </TableCell>
                    <TableCell>{room.decision_deadline_at ? formatDate(room.decision_deadline_at) : "-"}</TableCell>
                    <TableCell>{room.created_at ? formatDate(room.created_at) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(room)}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Match Room Dialog */}
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

      {/* Room Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes da match room</DialogTitle></DialogHeader>
          {selectedRoom && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Membro</p><p className="font-medium">{selectedRoom.member_name}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={decisionColors[selectedRoom.decision_status || "PENDING"]}>{decisionLabels[selectedRoom.decision_status || "PENDING"]}</Badge>
                </div>
                <div><p className="text-sm text-muted-foreground">Deadline</p><p className="font-medium">{selectedRoom.decision_deadline_at ? formatDate(selectedRoom.decision_deadline_at) : "-"}</p></div>
                {selectedRoom.decision_notes_from_customer && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Notas do cliente</p>
                    <p className="text-sm mt-1 p-2 bg-secondary rounded">{selectedRoom.decision_notes_from_customer}</p>
                  </div>
                )}
                {(selectedRoom as any).rejection_category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motivo da recusa</p>
                    <Badge variant="outline" className="mt-1 border-red-500/50 text-red-500">
                      {(selectedRoom as any).rejection_category === "price_high" ? "Preço alto" :
                       (selectedRoom as any).rejection_category === "wrong_condition" ? "Condição diferente" :
                       (selectedRoom as any).rejection_category === "wrong_color" ? "Cor diferente" :
                       (selectedRoom as any).rejection_category === "wrong_size" ? "Tamanho indisponível" :
                       (selectedRoom as any).rejection_category === "supplier_trust" ? "Fornecedor" :
                       (selectedRoom as any).rejection_category === "found_elsewhere" ? "Encontrou em outro lugar" :
                       (selectedRoom as any).rejection_category || "Outro"}
                    </Badge>
                  </div>
                )}
                {(selectedRoom as any).rejection_reason && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Detalhes da recusa</p>
                    <p className="text-sm mt-1 p-2 bg-red-500/10 rounded border border-red-500/20">{(selectedRoom as any).rejection_reason}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Opções ({roomOptions.length})</h3>
                  <Button size="sm" variant="outline" onClick={() => setIsAddOptionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Adicionar opção
                  </Button>
                </div>
                {roomOptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma opção adicionada</p>
                ) : (
                  <div className="space-y-3">
                    {roomOptions.map((option) => (
                      <Card key={option.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{option.option_title}</p>
                              <div className="flex gap-2 mt-1">
                                {option.region && <Badge variant="outline">{option.region}</Badge>}
                                {option.condition && <Badge variant="outline">{option.condition}</Badge>}
                              </div>
                            </div>
                            <p className="font-bold">
                              {option.price_estimate ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: option.currency || "BRL" }).format(option.price_estimate) : "-"}
                            </p>
                          </div>
                          {(option.pros || option.risks) && (
                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                              {option.pros && <div><p className="text-green-500 font-medium">Prós</p><p className="text-muted-foreground">{option.pros}</p></div>}
                              {option.risks && <div><p className="text-red-500 font-medium">Riscos</p><p className="text-muted-foreground">{option.risks}</p></div>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto Re-search Button for declined rooms */}
              {selectedRoom.decision_status === "DECLINED" && !selectedRoom.auto_research_search_id && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Re-busca automática</p>
                        <p className="text-xs text-muted-foreground">
                          Reabrir busca com feedback do cliente ({(selectedRoom as any).rejection_category || "sem motivo"})
                        </p>
                      </div>
                      <Button size="sm" onClick={async () => {
                        try {
                          // Create new search linked to original
                          const originalSearch = pendingSearches.find(s => s.id === selectedRoom.search_id) || 
                            { user_id: selectedRoom.user_id };
                          
                          // Get the original search's wishlist_item_id
                          const { data: origSearch } = await supabase
                            .from("vault_searches")
                            .select("wishlist_item_id, user_id, decline_count")
                            .eq("id", selectedRoom.search_id)
                            .single();

                          if (!origSearch) { toast.error("Busca original não encontrada"); return; }

                          const { data: newSearch, error } = await supabase
                            .from("vault_searches")
                            .insert({
                              user_id: origSearch.user_id,
                              wishlist_item_id: origSearch.wishlist_item_id,
                              status: "IN_CURATION",
                              is_active: true,
                              started_at: new Date().toISOString(),
                              last_update_at: new Date().toISOString(),
                              original_search_id: selectedRoom.search_id,
                              decline_count: (origSearch.decline_count || 0) + 1,
                              last_decline_category: (selectedRoom as any).rejection_category,
                              last_decline_reason: (selectedRoom as any).rejection_reason,
                              progress_message: "Nova busca iniciada com base no seu feedback",
                            })
                            .select().single();

                          if (error) throw error;

                          // Link back
                          await supabase
                            .from("vault_match_rooms")
                            .update({ auto_research_search_id: newSearch.id })
                            .eq("id", selectedRoom.id);

                          toast.success("Re-busca criada automaticamente");
                          fetchMatchRooms();
                          setIsDetailOpen(false);
                        } catch (err) {
                          console.error("Error creating re-search:", err);
                          toast.error("Erro ao criar re-busca");
                        }
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reabrir busca
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedRoom.auto_research_search_id && (
                <p className="text-xs text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Re-busca já criada
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Option Dialog */}
      <Dialog open={isAddOptionOpen} onOpenChange={setIsAddOptionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar opção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input value={optionForm.option_title} onChange={(e) => setOptionForm({ ...optionForm, option_title: e.target.value })} placeholder="Ex: StockX - Nova York" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Região</label>
                <Input value={optionForm.region} onChange={(e) => setOptionForm({ ...optionForm, region: e.target.value })} placeholder="Ex: EUA" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Condição</label>
                <Select value={optionForm.condition} onValueChange={(value) => setOptionForm({ ...optionForm, condition: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DS">Deadstock (DS)</SelectItem>
                    <SelectItem value="VNDS">Very Near DS (VNDS)</SelectItem>
                    <SelectItem value="USED">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço estimado</label>
                <Input type="number" value={optionForm.price_estimate} onChange={(e) => setOptionForm({ ...optionForm, price_estimate: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moeda</label>
                <Select value={optionForm.currency} onValueChange={(value) => setOptionForm({ ...optionForm, currency: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prós</label>
              <Textarea value={optionForm.pros} onChange={(e) => setOptionForm({ ...optionForm, pros: e.target.value })} placeholder="Vantagens desta opção..." rows={2} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Riscos</label>
              <Textarea value={optionForm.risks} onChange={(e) => setOptionForm({ ...optionForm, risks: e.target.value })} placeholder="Possíveis riscos..." rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddOptionOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddOption}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics Tab ───
function AnalyticsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSearches: 0,
    totalMatchRooms: 0,
    approvedCount: 0,
    declinedCount: 0,
    expiredCount: 0,
    avgSearchDays: 0,
    acceptanceRate: 0,
    rejectionReasons: [] as { category: string; count: number }[],
    reSearchCount: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [searchesRes, matchRoomsRes] = await Promise.all([
        supabase.from("vault_searches").select("id, status, started_at, created_at, decline_count, last_decline_category"),
        supabase.from("vault_match_rooms").select("id, decision_status, rejection_category, created_at, decision_at"),
      ]);

      const searches = searchesRes.data || [];
      const matchRooms = matchRoomsRes.data || [];

      const approved = matchRooms.filter((r) => r.decision_status === "APPROVED");
      const declined = matchRooms.filter((r) => r.decision_status === "DECLINED");
      const expired = matchRooms.filter((r) => r.decision_status === "EXPIRED");
      const totalDecided = approved.length + declined.length + expired.length;

      // Avg search time (from created to decision)
      const completedSearches = searches.filter((s) => 
        ["CLOSED_APPROVED", "CLOSED_NOT_FOUND", "CLOSED_CANCELLED"].includes(s.status) && s.started_at
      );
      const avgDays = completedSearches.length > 0
        ? completedSearches.reduce((sum, s) => {
            const start = new Date(s.started_at || s.created_at!);
            const end = new Date(); // approximate
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedSearches.length
        : 0;

      // Rejection reasons breakdown
      const reasonCounts: Record<string, number> = {};
      declined.forEach((r) => {
        const cat = r.rejection_category || "não informado";
        reasonCounts[cat] = (reasonCounts[cat] || 0) + 1;
      });

      const rejectionReasons = Object.entries(reasonCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      const reSearchCount = searches.filter((s) => (s.decline_count ?? 0) > 0).length;

      setStats({
        totalSearches: searches.length,
        totalMatchRooms: matchRooms.length,
        approvedCount: approved.length,
        declinedCount: declined.length,
        expiredCount: expired.length,
        avgSearchDays: Math.round(avgDays),
        acceptanceRate: totalDecided > 0 ? Math.round((approved.length / totalDecided) * 100) : 0,
        rejectionReasons,
        reSearchCount,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Erro ao carregar analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    price_high: "Preço alto",
    wrong_condition: "Condição diferente",
    wrong_color: "Cor diferente",
    wrong_size: "Tamanho indisponível",
    supplier_trust: "Fornecedor",
    found_elsewhere: "Encontrou em outro lugar",
    other: "Outro",
    "não informado": "Não informado",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa de aceite</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgSearchDays}d</p>
                <p className="text-xs text-muted-foreground">Tempo médio de busca</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.reSearchCount}</p>
                <p className="text-xs text-muted-foreground">Re-buscas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMatchRooms}</p>
                <p className="text-xs text-muted-foreground">Match rooms criadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Decisões dos clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Aprovadas</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(stats.approvedCount / Math.max(stats.totalMatchRooms, 1)) * 100}px`, minWidth: "4px" }} />
                  <span className="font-semibold text-emerald-500">{stats.approvedCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recusadas</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${(stats.declinedCount / Math.max(stats.totalMatchRooms, 1)) * 100}px`, minWidth: "4px" }} />
                  <span className="font-semibold text-red-500">{stats.declinedCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expiradas</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-zinc-500" style={{ width: `${(stats.expiredCount / Math.max(stats.totalMatchRooms, 1)) * 100}px`, minWidth: "4px" }} />
                  <span className="font-semibold text-zinc-500">{stats.expiredCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-500">{stats.totalMatchRooms - stats.approvedCount - stats.declinedCount - stats.expiredCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Motivos de recusa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.rejectionReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma recusa registrada</p>
            ) : (
              <div className="space-y-3">
                {stats.rejectionReasons.map((reason) => (
                  <div key={reason.category} className="flex items-center justify-between">
                    <span className="text-sm">{categoryLabels[reason.category] || reason.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-red-500/50" style={{ width: `${(reason.count / Math.max(stats.declinedCount, 1)) * 80}px`, minWidth: "4px" }} />
                      <span className="text-sm font-medium">{reason.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VaultSearchesPage;
