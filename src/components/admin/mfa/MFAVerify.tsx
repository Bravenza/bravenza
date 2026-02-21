import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

interface MFAVerifyProps {
  onVerified: () => void;
  onSignOut: () => void;
}

export function MFAVerify({ onVerified, onSignOut }: MFAVerifyProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }
    setIsVerifying(true);
    setError("");
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (!totpFactor) {
        setError("Fator MFA não encontrado");
        return;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      onVerified();
    } catch (err: any) {
      setError(
        err.message === "Invalid TOTP code"
          ? "Código inválido. Tente novamente."
          : err.message || "Erro na verificação"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 md:opacity-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-4">
          <Logo size="lg" className="mx-auto" />
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Verificação em Duas Etapas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Abra seu app autenticador e digite o código de 6 dígitos
            </p>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl p-7 space-y-5">
          <div className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="text-center text-3xl tracking-[0.5em] font-mono h-16 bg-secondary/30 border-border/40"
              autoFocus
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>

          <Button
            className="w-full btn-gold h-12 text-sm tracking-wide"
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verificar
          </Button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair e usar outra conta
          </button>
        </div>
      </div>
    </div>
  );
}
