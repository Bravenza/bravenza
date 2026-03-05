import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface MFAEnrollProps {
  onEnrolled: () => void;
  onCancelled?: () => void;
}

export function MFAEnroll({ onEnrolled, onCancelled }: MFAEnrollProps) {
  const [factorId, setFactorId] = useState("");
  const [qr, setQR] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function enroll() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Bravenza Admin TOTP",
        });
        if (error) throw error;
        setFactorId(data.id);
        setQR(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao iniciar configuração MFA");
      } finally {
        setIsLoading(false);
      }
    }
    enroll();
  }, []);

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }
    setIsVerifying(true);
    setError("");
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast.success("MFA ativado com sucesso!");
      onEnrolled();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg === "Invalid TOTP code" ? "Código inválido. Tente novamente." : msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Configurar Autenticação em Duas Etapas</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc.)
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <img src={qr} alt="QR Code MFA" className="w-48 h-48" />
        </div>
      </div>

      {/* Secret key fallback */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ou insira o código manualmente:</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted/50 border border-border/50 rounded-md px-3 py-2 font-mono break-all select-all">
            {secret}
          </code>
          <Button variant="outline" size="sm" onClick={copySecret} className="shrink-0">
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Verification */}
      <div className="space-y-3">
        <Label htmlFor="mfa-code" className="text-sm font-medium">
          Digite o código de 6 dígitos do app:
        </Label>
        <Input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={verifyCode}
          onChange={(e) => {
            setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-secondary/30 border-border/40"
        />
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </div>

      <div className="flex gap-3">
        {onCancelled && (
          <Button variant="outline" className="flex-1" onClick={onCancelled}>
            Cancelar
          </Button>
        )}
        <Button
          className="flex-1 btn-gold"
          onClick={handleVerify}
          disabled={isVerifying || verifyCode.length !== 6}
        >
          {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Ativar MFA
        </Button>
      </div>
    </div>
  );
}
