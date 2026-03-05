import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, UserPlus, Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, Pencil, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const createAdminSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  tempPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  must_change_password: boolean;
  created_at: string;
}

export function AdminSettingsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins((data as AdminUser[]) || []);
    } catch (err) {
      console.error("Error fetching admins:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createAdminSchema.parse({ fullName, email, tempPassword });
    } catch (err) {
      const errors = JSON.parse(err instanceof Error ? err.message : "[]");
      toast.error(errors[0].message);
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: { email, fullName, tempPassword },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Admin ${fullName} criado com sucesso!`);
      setShowForm(false);
      setFullName("");
      setEmail("");
      setTempPassword("");
      fetchAdmins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar administrador");
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (admin: AdminUser) => {
    setEditingId(admin.id);
    setEditName(admin.full_name);
    setEditEmail(admin.email);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  };

  const handleSaveEdit = async (admin: AdminUser) => {
    if (!editName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setIsSavingEdit(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: {
          action: "update",
          userId: admin.user_id,
          fullName: editName,
          email: editEmail,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Administrador atualizado!");
      setEditingId(null);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: {
          action: "delete",
          userId: admin.user_id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Admin ${admin.full_name} removido.`);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover administrador");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administradores
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários administradores da plataforma.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="btn-gold" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Admin
        </Button>
      </div>

      {/* Create admin form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Criar Novo Administrador</CardTitle>
            <CardDescription>
              O novo administrador receberá uma senha temporária e será obrigado a alterá-la no primeiro login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Nome completo</Label>
                <Input
                  id="admin-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome do administrador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha temporária</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Informe esta senha ao novo admin. Ele será obrigado a trocar no primeiro acesso.
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={isCreating} className="btn-gold">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Criar Administrador
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admins list */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum administrador cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {editingId === admin.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-40"
                        />
                      ) : (
                        admin.full_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === admin.id ? (
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="h-8 w-48"
                        />
                      ) : (
                        admin.email
                      )}
                    </TableCell>
                    <TableCell>
                      {admin.must_change_password ? (
                        <Badge variant="secondary" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Senha temporária
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === admin.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(admin)}
                            disabled={isSavingEdit}
                          >
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => startEditing(admin)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O usuário <strong>{admin.full_name}</strong> perderá o acesso ao painel administrativo.
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(admin)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
