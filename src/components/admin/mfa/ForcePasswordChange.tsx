import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

interface ForcePasswordChangeProps {
  onComplete: () => void;
  onSignOut: () => void;
}

export function ForcePasswordChange({ onComplete, onSignOut }: ForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      // Mark password as changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("admin_profiles")
          .update({ must_change_password: false })
          .eq("user_id", user.id);
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4">
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
            <h2 className="text-xl font-semibold">Altere sua Senha</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Por segurança, você precisa definir uma nova senha pessoal antes de acessar o painel.
            </p>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-xs tracking-wide uppercase text-muted-foreground">
              Nova senha
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-secondary/30 border-border/40 h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs tracking-wide uppercase text-muted-foreground">
              Confirmar nova senha
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Repita a nova senha"
              className="bg-secondary/30 border-border/40 h-11"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            className="w-full btn-gold h-12 text-sm tracking-wide"
            onClick={handleSubmit}
            disabled={isSubmitting || !newPassword || !confirmPassword}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Definir Nova Senha
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
