import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Mail, Lock, Loader2, Check, ShieldCheck, ShieldAlert, Smartphone, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AppSecurityPage() {
  const navigate = useNavigate();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ id: string; qr: string; secret: string; uri: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentEmail(user.email || "");

      // Check MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find(f => f.status === "verified");
      if (verified) {
        setMfaEnabled(true);
        setFactorId(verified.id);
      }

      // Check if user is a seller
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("cpf")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.cpf) {
        const { data: seller } = await supabase
          .from("vault_seller_profiles" as any)
          .select("id, kyc_status")
          .eq("cpf", profile.cpf)
          .maybeSingle();
        if (seller && (seller as any).kyc_status === "approved") {
          setIsSeller(true);
        }
      }
      setMfaLoading(false);
    };
    init();
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
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const handleEnrollMfa = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Bravenza App" });
    if (error) {
      toast.error(error.message || "Erro ao iniciar configuração 2FA.");
      setEnrolling(false);
      return;
    }
    setEnrollData({
      id: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
    setEnrolling(false);
  };

  const handleVerifyMfa = async () => {
    if (!enrollData || verifyCode.length !== 6) {
      toast.error("Informe o código de 6 dígitos.");
      return;
    }
    setVerifyingCode(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
    if (challengeError) {
      toast.error(challengeError.message);
      setVerifyingCode(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: enrollData.id, challengeId: challenge.id, code: verifyCode });
    if (verifyError) {
      toast.error("Código inválido. Tente novamente.");
      setVerifyingCode(false);
      return;
    }
    toast.success("Autenticação de dois fatores ativada!");
    setMfaEnabled(true);
    setFactorId(enrollData.id);
    setEnrollData(null);
    setVerifyCode("");
    setVerifyingCode(false);
  };

  const handleUnenrollMfa = async () => {
    if (!factorId) return;
    setUnenrolling(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error(error.message || "Erro ao desativar 2FA.");
    } else {
      toast.success("Autenticação de dois fatores desativada.");
      setMfaEnabled(false);
      setFactorId(null);
    }
    setUnenrolling(false);
  };

  const copySecret = () => {
    if (enrollData?.secret) {
      navigator.clipboard.writeText(enrollData.secret);
      toast.success("Chave copiada!");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">
      <Helmet><title>Segurança | BRAVENZA</title></Helmet>

      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/app")}>
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <h1 className="text-xl font-bold mb-6">Segurança da conta</h1>

      <div className="space-y-6">
        {/* 2FA Section */}
        <Card className={cn(isSeller && !mfaEnabled && !mfaLoading && "border-destructive/40")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Autenticação de dois fatores
              </CardTitle>
              {!mfaLoading && (
                <Badge variant={mfaEnabled ? "default" : "outline"} className={cn(
                  mfaEnabled ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground"
                )}>
                  {mfaEnabled ? "Ativa" : "Inativa"}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Adicione uma camada extra de segurança usando um aplicativo autenticador (Google Authenticator, Authy, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mfaLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : mfaEnabled ? (
              <>
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Sua conta está protegida com autenticação de dois fatores.
                </div>
                {!isSeller && (
                  <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleUnenrollMfa} disabled={unenrolling}>
                    {unenrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    Desativar 2FA
                  </Button>
                )}
                {isSeller && (
                  <p className="text-[10px] text-muted-foreground">
                    Como vendedor, a autenticação de dois fatores é obrigatória e não pode ser desativada.
                  </p>
                )}
              </>
            ) : enrollData ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code abaixo com seu aplicativo autenticador:
                </p>
                <div className="flex justify-center p-4 bg-background rounded-xl border border-border">
                  <img src={enrollData.qr} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ou insira a chave manualmente:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{enrollData.secret}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySecret}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="verify-code">Código de verificação</Label>
                  <Input
                    id="verify-code"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 text-center text-lg tracking-widest font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVerifyMfa} disabled={verifyingCode || verifyCode.length !== 6} size="sm" className="gap-2 flex-1">
                    {verifyingCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Verificar e ativar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEnrollData(null); setVerifyCode(""); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {isSeller && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Obrigatório para vendedores</p>
                      <p className="text-xs mt-0.5 text-destructive/80">
                        Por segurança, vendedores precisam ativar a autenticação de dois fatores.
                      </p>
                    </div>
                  </div>
                )}
                <Button onClick={handleEnrollMfa} disabled={enrolling} size="sm" className="gap-2">
                  {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
                  Configurar app autenticador
                </Button>
              </>
            )}
          </CardContent>
        </Card>

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
