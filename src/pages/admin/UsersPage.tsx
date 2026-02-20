import { useEffect, useState } from "react";
import {
  Users,
  Shield,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/constants";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
}

const UsersPage = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newUserId, setNewUserId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all admin roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: userRole?.role || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newUserId.trim()) {
      toast({
        title: "Erro",
        description: "Informe o ID do usuário.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: newUserId.trim(),
        role: "admin",
      });

      if (error) throw error;

      toast({
        title: "Admin adicionado!",
        description: "O usuário agora é um administrador.",
      });

      setShowAddModal(false);
      setNewUserId("");
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar admin.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!deleteUserId) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", deleteUserId)
        .eq("role", "admin");

      if (error) throw error;

      toast({
        title: "Admin removido",
        description: "O usuário não é mais um administrador.",
      });

      setDeleteUserId(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover admin.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários e permissões
          </p>
        </div>
        <Button className="btn-gold" onClick={() => setShowAddModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Admin
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="card-premium overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>ID (UUID)</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{user.full_name || "Sem nome"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">{user.id}</code>
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                        <Shield className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Usuário</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(user.created_at)}</TableCell>
                  <TableCell>
                    {user.role === "admin" && user.id !== currentUser?.id && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUserId(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground card-premium rounded-lg">
            Nenhum usuário encontrado
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="card-premium p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {user.role === "admin" ? (
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary">Usuário</Badge>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{formatDateTime(user.created_at)}</span>
                {user.role === "admin" && user.id !== currentUser?.id && (
                  <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => setDeleteUserId(user.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add admin modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Selecione um usuário para torná-lo administrador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecionar Usuário</Label>
              <select
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Escolha um usuário...</option>
                {users
                  .filter((u) => u.role !== "admin")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.email})
                    </option>
                  ))}
              </select>
              {users.filter((u) => u.role !== "admin").length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todos os usuários já são administradores.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button
              className="btn-gold"
              onClick={handleAddAdmin}
              disabled={isSaving || !newUserId}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove admin confirmation */}
      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={() => setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá acesso ao painel administrativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersPage;
