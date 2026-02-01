import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { formatDate } from "@/lib/constants";

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
  vault_members?: {
    client_name: string;
    client_email: string | null;
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

const statusLabels: Record<SearchStatus, string> = {
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

const statusColors: Record<SearchStatus, string> = {
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

const VaultSearchesPage = () => {
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
          vault_members (
            client_name,
            client_email,
            tier
          ),
          vault_wishlists (
            title,
            product_name,
            product_brand,
            product_model,
            product_size
          )
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

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleUpdateStatus = async (search: VaultSearch, newStatus: SearchStatus) => {
    try {
      const { error } = await supabase
        .from("vault_searches")
        .update({
          status: newStatus,
          last_update_at: new Date().toISOString(),
          is_active: !["CLOSED_APPROVED", "CLOSED_NOT_FOUND", "CLOSED_CANCELLED"].includes(newStatus),
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

      // Update last_update_at
      await supabase
        .from("vault_searches")
        .update({ last_update_at: new Date().toISOString() })
        .eq("id", selectedSearch.id);

      toast.success("Atualização enviada");
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
    const productTitle = search.vault_wishlists?.title?.toLowerCase() || 
                         search.vault_wishlists?.product_name?.toLowerCase() || "";

    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      productTitle.includes(searchTerm.toLowerCase());

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
          <h1 className="text-2xl font-bold">Buscas ativas</h1>
          <p className="text-muted-foreground">
            Gerencie as buscas dos membros Vault
          </p>
        </div>
        <Button onClick={fetchSearches} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
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
                <p className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-500" : ""}`}>
                  {stats.overdue}
                </p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por membro ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

      {/* Searches Table */}
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
                    <p className="text-muted-foreground">
                      Nenhuma busca encontrada
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSearches.map((search) => (
                  <TableRow key={search.id} className={isOverdue(search) ? "bg-red-500/10" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {search.vault_members?.client_name || "Membro desconhecido"}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {search.vault_members?.tier === "elite"
                            ? "Black"
                            : search.vault_members?.tier === "collector"
                            ? "Privilege"
                            : "Access"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {search.vault_wishlists?.title || 
                         search.vault_wishlists?.product_name || 
                         "Produto não especificado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          search.vault_wishlists?.product_brand,
                          search.vault_wishlists?.product_model,
                          search.vault_wishlists?.product_size,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={search.status}
                        onValueChange={(value) =>
                          handleUpdateStatus(search, value as SearchStatus)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <Badge className={statusColors[search.status]}>
                            {statusLabels[search.status]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECEIVED">Recebida</SelectItem>
                          <SelectItem value="IN_CURATION">Em curadoria</SelectItem>
                          <SelectItem value="OPTIONS_IDENTIFIED">Opções identificadas</SelectItem>
                          <SelectItem value="VALIDATING">Validando</SelectItem>
                          <SelectItem value="MATCH_SENT">Match enviado</SelectItem>
                          <SelectItem value="AWAITING_DECISION">Aguardando decisão</SelectItem>
                          <SelectItem value="CLOSED_APPROVED">Aprovada</SelectItem>
                          <SelectItem value="CLOSED_NOT_FOUND">Não encontrado</SelectItem>
                          <SelectItem value="CLOSED_CANCELLED">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {search.last_update_at
                        ? formatDate(search.last_update_at)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {search.sla_next_update_due_at ? (
                        <div className={isOverdue(search) ? "text-red-500 font-medium" : ""}>
                          {formatDate(search.sla_next_update_due_at)}
                          {isOverdue(search) && (
                            <AlertTriangle className="h-4 w-4 inline ml-1" />
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSearch(search);
                            setIsUpdateOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSearch(search);
                            setIsDetailOpen(true);
                          }}
                        >
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
          <DialogHeader>
            <DialogTitle>Enviar atualização</DialogTitle>
          </DialogHeader>
          {selectedSearch && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">
                  {selectedSearch.vault_wishlists?.title ||
                    selectedSearch.vault_wishlists?.product_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Para: {selectedSearch.vault_members?.client_name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Descreva o progresso da busca..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handlePostUpdate} disabled={!updateMessage.trim()}>
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da busca</DialogTitle>
          </DialogHeader>
          {selectedSearch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Membro</p>
                  <p className="font-medium">
                    {selectedSearch.vault_members?.client_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <p className="font-medium capitalize">
                    {selectedSearch.vault_members?.tier === "elite"
                      ? "Vault Black"
                      : selectedSearch.vault_members?.tier === "collector"
                      ? "Vault Privilege"
                      : "Vault Access"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">
                    {selectedSearch.vault_wishlists?.title ||
                      selectedSearch.vault_wishlists?.product_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedSearch.status]}>
                    {statusLabels[selectedSearch.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Iniciada em</p>
                  <p className="font-medium">
                    {selectedSearch.started_at
                      ? formatDate(selectedSearch.started_at)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">
                    {selectedSearch.last_update_at
                      ? formatDate(selectedSearch.last_update_at)
                      : "-"}
                  </p>
                </div>
              </div>

              {selectedSearch.internal_notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas internas</p>
                  <p className="text-sm mt-1 p-2 bg-secondary rounded">
                    {selectedSearch.internal_notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultSearchesPage;
