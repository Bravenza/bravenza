import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, UserPlus, Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const createAdminSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  tempPassword: z.string()
    .min(12, "Senha deve ter no mínimo 12 caracteres")
    .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter ao menos um número")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter ao menos um caractere especial"),
});

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Fraca", color: "bg-destructive", width: "w-1/4" };
  if (score <= 2) return { label: "Média", color: "bg-warning", width: "w-2/4" };
  if (score <= 3) return { label: "Boa", color: "bg-primary", width: "w-3/4" };
  return { label: "Forte", color: "bg-success", width: "w-full" };
};

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  must_change_password: boolean;
  created_at: string;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Administradores
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os usuários administradores da plataforma.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="btn-gold">
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
                    placeholder="Mín. 12 caracteres, maiúscula, número e símbolo"
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
                {tempPassword && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${getPasswordStrength(tempPassword).color} ${getPasswordStrength(tempPassword).width}`} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{getPasswordStrength(tempPassword).label}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Mínimo 12 caracteres, com maiúscula, número e símbolo. Informe esta senha ao novo admin.
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.full_name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
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
