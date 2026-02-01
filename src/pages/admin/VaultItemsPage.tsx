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
  Plus,
  Eye,
  RefreshCw,
  Shield,
  Package,
  QrCode,
  FileText,
  CheckCircle,
  Clock,
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
  colorway: string | null;
  size: string | null;
  origin_city: string | null;
  origin_country: string | null;
  verified_status: VerifiedStatus | null;
  verified_at: string | null;
  certificate_pdf_url: string | null;
  qr_private_url: string | null;
  inspection_photos: string[] | null;
  purchase_value: number | null;
  purchase_date: string | null;
  created_at: string | null;
  vault_members?: {
    client_name: string;
    client_email: string | null;
    tier: string;
  };
}

interface VaultMember {
  id: string;
  client_name: string;
  client_email: string | null;
}

const statusLabels: Record<VerifiedStatus, string> = {
  VERIFIED: "Verificado",
  PENDING: "Pendente",
  REVOKED: "Revogado",
};

const statusColors: Record<VerifiedStatus, string> = {
  VERIFIED: "bg-emerald-600",
  PENDING: "bg-amber-500",
  REVOKED: "bg-red-500",
};

const VaultItemsPage = () => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    user_id: "",
    title: "",
    brand: "",
    model: "",
    colorway: "",
    size: "",
    origin_city: "",
    origin_country: "",
    purchase_value: "",
    verified_status: "PENDING" as VerifiedStatus,
  });

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from("vault_items")
        .select(`
          *,
          vault_members (
            client_name,
            client_email,
            tier
          )
        `)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      const { data: membersData, error: membersError } = await supabase
        .from("vault_members")
        .select("id, client_name, client_email")
        .eq("is_active", true);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar vault items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const generateVaultId = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("vault_items")
      .select("*", { count: "exact", head: true });
    
    const seq = (count || 0) + 1;
    return `BRVZ-${year}-${String(seq).padStart(6, "0")}`;
  };

  const handleCreateItem = async () => {
    if (!createForm.user_id || !createForm.title) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const vaultId = await generateVaultId();
      const qrUrl = `${window.location.origin}/vault/verify/${vaultId}`;

      const { error } = await supabase.from("vault_items").insert({
        user_id: createForm.user_id,
        vault_id: vaultId,
        title: createForm.title,
        brand: createForm.brand || null,
        model: createForm.model || null,
        colorway: createForm.colorway || null,
        size: createForm.size || null,
        origin_city: createForm.origin_city || null,
        origin_country: createForm.origin_country || null,
        purchase_value: createForm.purchase_value
          ? parseFloat(createForm.purchase_value)
          : null,
        purchase_date: new Date().toISOString(),
        verified_status: createForm.verified_status,
        verified_at:
          createForm.verified_status === "VERIFIED"
            ? new Date().toISOString()
            : null,
        qr_private_url: qrUrl,
      });

      if (error) throw error;

      // Update member purchase count
      const { data: memberData } = await supabase
        .from("vault_members")
        .select("total_purchases, total_spent")
        .eq("id", createForm.user_id)
        .single();

      if (memberData) {
        await supabase
          .from("vault_members")
          .update({
            total_purchases: (memberData.total_purchases || 0) + 1,
            total_spent: (memberData.total_spent || 0) + (parseFloat(createForm.purchase_value) || 0),
          })
          .eq("id", createForm.user_id);
      }

      toast.success(`Vault item criado: ${vaultId}`);
      setIsCreateOpen(false);
      setCreateForm({
        user_id: "",
        title: "",
        brand: "",
        model: "",
        colorway: "",
        size: "",
        origin_city: "",
        origin_country: "",
        purchase_value: "",
        verified_status: "PENDING",
      });
      fetchItems();
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Erro ao criar vault item");
    }
  };

  const handleUpdateStatus = async (item: VaultItem, newStatus: VerifiedStatus) => {
    try {
      const { error } = await supabase
        .from("vault_items")
        .update({
          verified_status: newStatus,
          verified_at: newStatus === "VERIFIED" ? new Date().toISOString() : null,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Status atualizado");
      fetchItems();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vault_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vault_members?.client_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.verified_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: items.length,
    verified: items.filter((i) => i.verified_status === "VERIFIED").length,
    pending: items.filter((i) => i.verified_status === "PENDING").length,
    totalValue: items.reduce((sum, i) => sum + (i.purchase_value || 0), 0),
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
          <h1 className="text-2xl font-bold">Vault items</h1>
          <p className="text-muted-foreground">
            Gerencie os itens certificados dos membros
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchItems} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
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
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-xs text-muted-foreground">Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(stats.totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">Valor total</p>
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
            placeholder="Buscar por título, Vault ID ou membro..."
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
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="VERIFIED">Verificados</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="REVOKED">Revogados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card>
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
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum item encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                        {item.vault_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.brand, item.model, item.size]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {item.vault_members?.client_name || "Desconhecido"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.verified_status || "PENDING"}
                        onValueChange={(value) =>
                          handleUpdateStatus(item, value as VerifiedStatus)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <Badge
                            className={
                              statusColors[item.verified_status || "PENDING"]
                            }
                          >
                            {statusLabels[item.verified_status || "PENDING"]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VERIFIED">Verificado</SelectItem>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="REVOKED">Revogado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.purchase_value
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.purchase_value)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.qr_private_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              window.open(item.qr_private_url!, "_blank")
                            }
                          >
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

      {/* Create Item Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar vault item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Membro *</label>
              <Select
                value={createForm.user_id}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, user_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.client_name} - {member.client_email || "sem email"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                placeholder="Ex: Air Jordan 1 Retro High OG 'Chicago'"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Marca</label>
                <Input
                  value={createForm.brand}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, brand: e.target.value })
                  }
                  placeholder="Nike"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo</label>
                <Input
                  value={createForm.model}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, model: e.target.value })
                  }
                  placeholder="Air Jordan 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Colorway</label>
                <Input
                  value={createForm.colorway}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, colorway: e.target.value })
                  }
                  placeholder="Chicago"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tamanho</label>
                <Input
                  value={createForm.size}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, size: e.target.value })
                  }
                  placeholder="42"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade de origem</label>
                <Input
                  value={createForm.origin_city}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, origin_city: e.target.value })
                  }
                  placeholder="Nova York"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">País de origem</label>
                <Input
                  value={createForm.origin_country}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      origin_country: e.target.value,
                    })
                  }
                  placeholder="EUA"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da compra</label>
                <Input
                  type="number"
                  value={createForm.purchase_value}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      purchase_value: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={createForm.verified_status}
                  onValueChange={(value) =>
                    setCreateForm({
                      ...createForm,
                      verified_status: value as VerifiedStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERIFIED">Verificado</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateItem}>Criar item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do vault item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <code className="text-lg font-mono font-bold">
                  {selectedItem.vault_id}
                </code>
                <Badge
                  className={`ml-2 ${
                    statusColors[selectedItem.verified_status || "PENDING"]
                  }`}
                >
                  {statusLabels[selectedItem.verified_status || "PENDING"]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Título</p>
                  <p className="font-medium">{selectedItem.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membro</p>
                  <p className="font-medium">
                    {selectedItem.vault_members?.client_name}
                  </p>
                </div>
                {selectedItem.brand && (
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{selectedItem.brand}</p>
                  </div>
                )}
                {selectedItem.model && (
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{selectedItem.model}</p>
                  </div>
                )}
                {selectedItem.colorway && (
                  <div>
                    <p className="text-sm text-muted-foreground">Colorway</p>
                    <p className="font-medium">{selectedItem.colorway}</p>
                  </div>
                )}
                {selectedItem.size && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tamanho</p>
                    <p className="font-medium">{selectedItem.size}</p>
                  </div>
                )}
                {selectedItem.origin_country && (
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-medium">
                      {selectedItem.origin_city
                        ? `${selectedItem.origin_city}, `
                        : ""}
                      {selectedItem.origin_country}
                    </p>
                  </div>
                )}
                {selectedItem.purchase_value && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(selectedItem.purchase_value)}
                    </p>
                  </div>
                )}
                {selectedItem.purchase_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data compra</p>
                    <p className="font-medium">
                      {formatDate(selectedItem.purchase_date)}
                    </p>
                  </div>
                )}
                {selectedItem.verified_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Verificado em</p>
                    <p className="font-medium">
                      {formatDate(selectedItem.verified_at)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
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

export default VaultItemsPage;
