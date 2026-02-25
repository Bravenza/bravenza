import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Mail, Lock, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function AppSecurityPage() {
  const navigate = useNavigate();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setCurrentEmail(data.user.email);
    });
  }, []);

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newEmail)) {
      toast.error("Informe um email válido.");
      return;
    }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("O novo email é igual ao atual.");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      toast.error(error.message || "Erro ao alterar email.");
    } else {
      setEmailSent(true);
      toast.success("Enviamos um link de confirmação para o novo email.");
    }
    setSavingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message || "Erro ao alterar senha.");
    } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Helmet><title>Segurança | BRAVENZA</title></Helmet>

      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <h1 className="text-xl font-bold mb-6">Segurança da conta</h1>

      <div className="space-y-6">
        {/* Change Email */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Alterar email
            </CardTitle>
            <CardDescription className="text-xs">
              Email atual: <strong>{currentEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailSent ? (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg">
                <Check className="h-4 w-4" />
                Link de confirmação enviado para <strong>{newEmail}</strong>. Verifique sua caixa de entrada.
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="new-email">Novo email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="novo@email.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleChangeEmail} disabled={savingEmail} size="sm" className="gap-2">
                  {savingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Alterar email
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Alterar senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword} size="sm" className="gap-2">
              {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              Alterar senha
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
