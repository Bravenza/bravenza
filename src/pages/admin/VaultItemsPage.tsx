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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Plus, Eye, RefreshCw, Shield, Package, QrCode, CheckCircle, Clock,
} from "lucide-react";
import { formatDate } from "@/lib/constants";

type VerifiedStatus = "VERIFIED" | "PENDING" | "REVOKED";

interface VaultItem {
  id: string;
  user_id: string;
  vault_id: string;
  title: string;
  brand: string | null;
  model: string | null;
  size: string | null;
  verified_status: VerifiedStatus | null;
  purchase_value: number | null;
  qr_private_url: string | null;
  created_at: string | null;
  vault_members?: { client_name: string; };
}

const statusLabels: Record<VerifiedStatus, string> = { VERIFIED: "Verificado", PENDING: "Pendente", REVOKED: "Revogado" };
const statusColors: Record<VerifiedStatus, string> = { VERIFIED: "bg-success", PENDING: "bg-warning", REVOKED: "bg-destructive" };

const VaultItemsPage = () => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_items")
        .select(`*, vault_members (client_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar vault items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleUpdateStatus = async (item: VaultItem, newStatus: VerifiedStatus) => {
    try {
      const { error } = await supabase.from("vault_items").update({
        verified_status: newStatus,
        verified_at: newStatus === "VERIFIED" ? new Date().toISOString() : null,
      }).eq("id", item.id);
      if (error) throw error;
      toast.success("Status atualizado");
      fetchItems();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vault_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vault_members?.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.verified_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: items.length,
    verified: items.filter(i => i.verified_status === "VERIFIED").length,
    pending: items.filter(i => i.verified_status === "PENDING").length,
    totalValue: items.reduce((sum, i) => sum + (i.purchase_value || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando vault items…</span>
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
          <h1 className="text-2xl font-bold">Vault Items</h1>
          <p className="text-muted-foreground">Gerencie os itens certificados dos membros</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchItems} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
          <Link to="/admin/vault/items/novo">
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo item</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">{stats.verified}</p><p className="text-xs text-muted-foreground">Verificados</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(stats.totalValue)}</p><p className="text-xs text-muted-foreground">Valor total</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título, Vault ID ou membro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="VERIFIED">Verificados</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="REVOKED">Revogados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vault ID</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Membro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum item encontrado</TableCell></TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><code className="text-sm font-mono bg-secondary px-2 py-1 rounded">{item.vault_id}</code></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{[item.brand, item.model, item.size].filter(Boolean).join(" • ")}</p>
                      </div>
                    </TableCell>
                    <TableCell><p className="font-medium">{item.vault_members?.client_name || "Desconhecido"}</p></TableCell>
                    <TableCell>
                      <Select value={item.verified_status || "PENDING"} onValueChange={(value) => handleUpdateStatus(item, value as VerifiedStatus)}>
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[item.verified_status || "PENDING"]}>{statusLabels[item.verified_status || "PENDING"]}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VERIFIED">Verificado</SelectItem>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="REVOKED">Revogado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.purchase_value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.purchase_value) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/admin/vault/items/${item.id}`}>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {item.qr_private_url && (
                          <Button variant="ghost" size="icon" onClick={() => window.open(item.qr_private_url!, "_blank")}>
                            <QrCode className="h-4 w-4" />
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground card-premium rounded-lg">Nenhum item encontrado</div>
        ) : (
          filteredItems.map((item) => (
            <Link key={item.id} to={`/admin/vault/items/${item.id}`}>
              <Card className="card-premium active:scale-[0.98] transition-transform">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">{item.vault_id}</code>
                    <Badge className={statusColors[item.verified_status || "PENDING"]}>{statusLabels[item.verified_status || "PENDING"]}</Badge>
                  </div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{item.vault_members?.client_name}</span>
                    <span>{item.purchase_value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.purchase_value) : "-"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default VaultItemsPage;
