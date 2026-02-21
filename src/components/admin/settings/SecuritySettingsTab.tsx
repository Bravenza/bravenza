import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MFAEnroll } from "@/components/admin/mfa/MFAEnroll";
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

export function SecuritySettingsTab() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const checkMFA = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = data?.totp?.find((f) => f.status === "verified");
      setMfaEnabled(!!verifiedFactor);
      setFactorId(verifiedFactor?.id || null);
    } catch (err) {
      console.error("Error checking MFA:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkMFA();
  }, []);

  const handleUnenroll = async () => {
    if (!factorId) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setMfaEnabled(false);
      setFactorId(null);
      toast.success("MFA desativado. Você precisará configurá-lo novamente no próximo login.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar MFA");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showEnroll) {
    return (
      <Card>
        <CardContent className="pt-6">
          <MFAEnroll
            onEnrolled={() => {
              setShowEnroll(false);
              checkMFA();
            }}
            onCancelled={() => setShowEnroll(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Autenticação em Duas Etapas (MFA)
          </CardTitle>
          <CardDescription>
            A verificação em duas etapas é <strong>obrigatória</strong> para acessar o painel administrativo.
            Use um app autenticador como Google Authenticator ou Authy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                {mfaEnabled ? (
                  <ShieldCheck className="h-6 w-6 text-primary" />
                ) : (
                  <ShieldOff className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Authenticator (TOTP)</span>
                  <Badge variant={mfaEnabled ? "default" : "destructive"}>
                    {mfaEnabled ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {mfaEnabled
                    ? "Sua conta está protegida com autenticação em duas etapas."
                    : "Configure agora para proteger sua conta."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {mfaEnabled ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isRemoving}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Desativar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar MFA?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao desativar, você precisará configurar novamente no próximo login.
                        A segurança da sua conta será reduzida temporariamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUnenroll}>
                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Confirmar desativação
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button onClick={() => setShowEnroll(true)} className="btn-gold">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Configurar MFA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
