import { useState, useEffect, forwardRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn, ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo } from "@/components/Logo";
import { MFAVerify } from "@/components/admin/mfa/MFAVerify";
import { MFAEnroll } from "@/components/admin/mfa/MFAEnroll";
import { ForcePasswordChange } from "@/components/admin/mfa/ForcePasswordChange";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const Login = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, signIn, signOut, isLoading: authLoading, isPasswordRecovery, clearPasswordRecovery } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [mfaStep, setMfaStep] = useState<"none" | "verify" | "enroll" | "change_password">("none");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (isPasswordRecovery) setShowResetPassword(true);
  }, [isPasswordRecovery]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setShowResetPassword(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAdmin && !showResetPassword && !isPasswordRecovery && mfaStep === "none") {
      (async () => {
        // Check if must change password first
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("must_change_password")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminProfile?.must_change_password) {
          setMfaStep("change_password");
          return;
        }

        // Check MFA status
        const { data } = await supabase.auth.mfa.listFactors();
        const verifiedFactor = data?.totp?.find((f) => f.status === "verified");
        if (verifiedFactor) {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData?.currentLevel === "aal2") {
            navigate("/admin");
          } else {
            setMfaStep("verify");
          }
        } else {
          setMfaStep("enroll");
        }
      })();
    }
  }, [user, isAdmin, navigate, showResetPassword, isPasswordRecovery, mfaStep]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      const errors = JSON.parse(err.message);
      toast({ title: "Erro de validação", description: errors[0].message, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        toast({
          title: "Erro ao entrar",
          description: error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro ao fazer login.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Informe seu email", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao enviar email de recuperação.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Force password change screen
  if (mfaStep === "change_password") {
    return (
      <ForcePasswordChange
        onComplete={() => setMfaStep("none")}
        onSignOut={async () => {
          await signOut();
          setMfaStep("none");
        }}
      />
    );
  }

  // MFA Verify screen
  if (mfaStep === "verify") {
    return (
      <MFAVerify
        onVerified={() => navigate("/admin")}
        onSignOut={async () => {
          await signOut();
          setMfaStep("none");
        }}
      />
    );
  }

  // MFA Enrollment screen (mandatory for admins)
  if (mfaStep === "enroll") {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 md:opacity-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-[440px]">
          <div className="text-center mb-6">
            <Logo size="lg" className="mx-auto mb-4" />
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
              Configuração Obrigatória de Segurança
            </p>
          </div>
          <div className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl p-7">
            <MFAEnroll onEnrolled={() => navigate("/admin")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 md:opacity-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>

      {/* Minimal header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}>
        <Link to="/" className="opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs tracking-widest uppercase">
            Voltar ao site
          </Button>
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Logo & branding */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex justify-center mb-5"
            >
              <Logo size="lg" />
            </motion.div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
              <Shield className="h-4 w-4 text-primary/70" />
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
            </div>
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Painel Administrativo
            </p>
          </div>

          {/* Card */}
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-xl p-7">
              {showResetPassword ? (
                <ResetPasswordForm
                  onComplete={() => {
                    setShowResetPassword(false);
                    clearPasswordRecovery();
                    supabase.auth.signOut();
                    toast({ title: "Senha atualizada!", description: "Faça login com sua nova senha." });
                  }}
                />
              ) : (
                <>
                  {showForgotPassword ? (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
                      </button>
                      {resetSent ? (
                        <div className="text-center py-6 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Email de recuperação enviado para <strong className="text-foreground">{resetEmail}</strong>.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Informe seu email para receber o link de redefinição.
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="bg-secondary/30 border-border/40 focus-visible:border-primary/40"
                            />
                          </div>
                          <Button type="submit" className="w-full btn-gold h-11" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link"}
                          </Button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-xs tracking-wide uppercase text-muted-foreground">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          inputMode="email"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="seu@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="bg-secondary/30 border-border/40 h-11 focus-visible:border-primary/40"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-xs tracking-wide uppercase text-muted-foreground">Senha</Label>
                          <button
                            type="button"
                            onClick={() => { setShowForgotPassword(true); setResetEmail(loginEmail); }}
                            className="text-[11px] text-primary/80 hover:text-primary transition-colors"
                          >
                            Esqueceu a senha?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="bg-secondary/30 border-border/40 h-11 pr-10 focus-visible:border-primary/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full btn-gold h-11 text-sm tracking-wide" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="mr-2 h-4 w-4" />
                        )}
                        Entrar
                      </Button>
                    </form>
                  )}

                  {/* Bottom accent */}
                  <div className="mt-6 pt-5 border-t border-border/20">
                    <p className="text-[11px] text-muted-foreground/60 text-center tracking-wide">
                      Acesso restrito a usuários autorizados
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
});

Login.displayName = "Login";

export default Login;
