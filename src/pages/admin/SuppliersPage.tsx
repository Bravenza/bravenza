import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  Globe,
  Phone,
  Mail,
  Star,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

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

const emptySupplier: Partial<Supplier> = {
  name: "",
  country: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  contact_whatsapp: "",
  website: "",
  specialties: [],
  payment_methods: [],
  average_shipping_days: null,
  rating: null,
  notes: "",
  is_active: true,
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [specialtiesInput, setSpecialtiesInput] = useState("");
  const [paymentMethodsInput, setPaymentMethodsInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fornecedores.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSpecialtiesInput(supplier.specialties?.join(", ") || "");
      setPaymentMethodsInput(supplier.payment_methods?.join(", ") || "");
    } else {
      setEditingSupplier({ ...emptySupplier });
      setSpecialtiesInput("");
      setPaymentMethodsInput("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingSupplier?.name || !editingSupplier?.country) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e país são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const specialtiesArray = specialtiesInput.split(",").map(s => s.trim()).filter(Boolean);
      const paymentMethodsArray = paymentMethodsInput.split(",").map(s => s.trim()).filter(Boolean);

      if (editingSupplier.id) {
        const { error } = await supabase
          .from("suppliers")
          .update({
            name: editingSupplier.name,
            country: editingSupplier.country,
            contact_name: editingSupplier.contact_name,
            contact_email: editingSupplier.contact_email,
            contact_phone: editingSupplier.contact_phone,
            contact_whatsapp: editingSupplier.contact_whatsapp,
            website: editingSupplier.website,
            specialties: specialtiesArray,
            payment_methods: paymentMethodsArray,
            average_shipping_days: editingSupplier.average_shipping_days,
            rating: editingSupplier.rating,
            notes: editingSupplier.notes,
            is_active: editingSupplier.is_active,
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
        toast({ title: "Fornecedor atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert([{
            name: editingSupplier.name!,
            country: editingSupplier.country!,
            contact_name: editingSupplier.contact_name,
            contact_email: editingSupplier.contact_email,
            contact_phone: editingSupplier.contact_phone,
            contact_whatsapp: editingSupplier.contact_whatsapp,
            website: editingSupplier.website,
            specialties: specialtiesArray,
            payment_methods: paymentMethodsArray,
            average_shipping_days: editingSupplier.average_shipping_days,
            rating: editingSupplier.rating,
            notes: editingSupplier.notes,
            is_active: editingSupplier.is_active ?? true,
          }]);

        if (error) throw error;
        toast({ title: "Fornecedor cadastrado com sucesso!" });
      }

      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fornecedor.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast({ title: "Fornecedor excluído com sucesso!" });
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fornecedor.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("suppliers")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      fetchSuppliers();
    } catch (error) {
      console.error("Error toggling supplier:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
          <p className="text-muted-foreground">
            Gerencie seus fornecedores internacionais
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="btn-gold">
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <Card className="card-premium">
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.website && (
                            <a 
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {supplier.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.country}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {supplier.contact_name && (
                          <p className="text-muted-foreground">{supplier.contact_name}</p>
                        )}
                        {supplier.contact_email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" />
                            {supplier.contact_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {supplier.specialties?.slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {(supplier.specialties?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(supplier.specialties?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.average_shipping_days ? (
                        <span>{supplier.average_shipping_days} dias</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span>{supplier.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={supplier.is_active}
                        onCheckedChange={() => handleToggleActive(supplier.id, supplier.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(supplier)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(supplier.id)}
                        >
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

      {/* Dialog for adding/editing supplier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier?.id ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={editingSupplier?.name || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Input
                  id="country"
                  value={editingSupplier?.country || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, country: e.target.value })}
                  placeholder="Ex: Estados Unidos"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  value={editingSupplier?.contact_name || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_name: e.target.value })}
                  placeholder="Nome da pessoa de contato"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={editingSupplier?.contact_email || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_email: e.target.value })}
                  placeholder="email@fornecedor.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  value={editingSupplier?.contact_phone || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_phone: e.target.value })}
                  placeholder="+1 555 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_whatsapp">WhatsApp</Label>
                <Input
                  id="contact_whatsapp"
                  value={editingSupplier?.contact_whatsapp || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_whatsapp: e.target.value })}
                  placeholder="+1 555 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={editingSupplier?.website || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, website: e.target.value })}
                placeholder="https://fornecedor.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
              <Input
                id="specialties"
                value={specialtiesInput}
                onChange={(e) => setSpecialtiesInput(e.target.value)}
                placeholder="Nike, Adidas, Jordan, New Balance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_methods">Métodos de Pagamento (separados por vírgula)</Label>
              <Input
                id="payment_methods"
                value={paymentMethodsInput}
                onChange={(e) => setPaymentMethodsInput(e.target.value)}
                placeholder="Wire Transfer, PayPal, Crypto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="average_shipping_days">Prazo Médio de Envio (dias)</Label>
                <Input
                  id="average_shipping_days"
                  type="number"
                  value={editingSupplier?.average_shipping_days || ""}
                  onChange={(e) => setEditingSupplier({ 
                    ...editingSupplier, 
                    average_shipping_days: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={editingSupplier?.rating || ""}
                  onChange={(e) => setEditingSupplier({ 
                    ...editingSupplier, 
                    rating: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="4.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editingSupplier?.notes || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                placeholder="Informações adicionais sobre o fornecedor..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={editingSupplier?.is_active ?? true}
                onCheckedChange={(checked) => setEditingSupplier({ ...editingSupplier, is_active: checked })}
              />
              <Label htmlFor="is_active">Fornecedor ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="btn-gold">
              {editingSupplier?.id ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
