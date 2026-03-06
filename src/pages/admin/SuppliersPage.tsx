import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Edit2, Trash2, Building2, Mail, Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SupplierDetailSheet } from "@/components/admin/SupplierDetailSheet";

interface Supplier {
  id: string;
  name: string;
  country: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  website: string | null;
  specialties: string[] | null;
  payment_methods: string[] | null;
  average_shipping_days: number | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os fornecedores.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Fornecedor excluído com sucesso!" });
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o fornecedor.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("suppliers").update({ is_active: !isActive }).eq("id", id);
      if (error) throw error;
      fetchSuppliers();
    } catch (error) {
      console.error("Error toggling supplier:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Carregando fornecedores…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores internacionais</p>
        </div>
        <Link to="/admin/fornecedores/novo">
          <Button className="btn-gold">
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </Link>
      </div>

      {/* Desktop Table */}
      <Card className="card-premium hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Prazo Médio</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum fornecedor cadastrado</TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => setDetailSupplier(supplier)}>{supplier.name}</p>
                          {supplier.website && (
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{supplier.website}</a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{supplier.country}</Badge></TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {supplier.contact_name && <p className="text-muted-foreground">{supplier.contact_name}</p>}
                        {supplier.contact_email && (
                          <div className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{supplier.contact_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {supplier.specialties?.slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{spec}</Badge>
                        ))}
                        {(supplier.specialties?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">+{(supplier.specialties?.length || 0) - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.average_shipping_days ? <span>{supplier.average_shipping_days} dias</span> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      {supplier.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                          <span>{supplier.rating.toFixed(1)}</span>
                          <span className="sr-only">de 5 estrelas</span>
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Switch checked={supplier.is_active} onCheckedChange={() => handleToggleActive(supplier.id, supplier.is_active)} aria-label={`${supplier.is_active ? "Desativar" : "Ativar"} fornecedor ${supplier.name}`} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/fornecedores/${supplier.id}/editar`}>
                          <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(supplier.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {suppliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground card-premium rounded-lg">Nenhum fornecedor cadastrado</div>
        ) : (
          suppliers.map((supplier) => (
            <Card key={supplier.id} className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => setDetailSupplier(supplier)}>{supplier.name}</p>
                      <Badge variant="outline" className="mt-1">{supplier.country}</Badge>
                    </div>
                  </div>
                  <Switch checked={supplier.is_active} onCheckedChange={() => handleToggleActive(supplier.id, supplier.is_active)} aria-label={`${supplier.is_active ? "Desativar" : "Ativar"} fornecedor ${supplier.name}`} />
                </div>
                {supplier.contact_name && <p className="text-sm text-muted-foreground mb-1">{supplier.contact_name}</p>}
                {supplier.specialties && supplier.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {supplier.specialties.slice(0, 4).map((spec, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{spec}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {supplier.average_shipping_days && <span>{supplier.average_shipping_days} dias</span>}
                    {supplier.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" aria-hidden="true" />
                        {supplier.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/admin/fornecedores/${supplier.id}/editar`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(supplier.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir fornecedor?"
        description="Esta ação não pode ser desfeita. O fornecedor será removido permanentemente do sistema."
        confirmText="Excluir"
        isLoading={isDeleting}
        variant="destructive"
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir fornecedor?"
        description="Esta ação não pode ser desfeita. O fornecedor será removido permanentemente do sistema."
        confirmText="Excluir"
        isLoading={isDeleting}
        variant="destructive"
      />

      <SupplierDetailSheet
        supplier={detailSupplier}
        open={!!detailSupplier}
        onOpenChange={(open) => !open && setDetailSupplier(null)}
      />
    </div>
  );
}
