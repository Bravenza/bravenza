import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, CreditCard, ArrowLeft, Crown, ShieldCheck, Truck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useClientSession } from "@/hooks/useClientSession";
import { supabase } from "@/integrations/supabase/client";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo } from "@/components/Logo";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const benefits = [
  { icon: ShieldCheck, text: "Autenticidade garantida" },
  { icon: Crown, text: "Acesso ao Vault Club" },
  { icon: Truck, text: "Rastreio em tempo real" },
];

export default function ClientAuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: sessionLoading, signIn, signUp } = useClientSession();
  
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(() => {
    return window.location.hash.includes('type=recovery');
  });

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setShowResetPassword(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const isRecovery = showResetPassword || window.location.hash.includes('type=recovery');
    if (!sessionLoading && user && !isRecovery) navigate("/minha-conta");
  }, [user, sessionLoading, navigate, showResetPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Erro de validação", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) {
      toast({
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
    localStorage.removeItem("bvz_dashboard_tab");
    navigate("/minha-conta");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast({ title: "Informe seu email", variant: "destructive" }); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/entrar` });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao enviar email de recuperação.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, "");
    try {
      signupSchema.parse({ fullName, cpf: cleanCpf, email: signupEmail, phone: phone.replace(/\D/g, "") || undefined, password: signupPassword, confirmPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Erro de validação", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, cleanCpf, fullName, phone.replace(/\D/g, ""));
    setIsLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Conta criada com sucesso!", description: "Verifique seu email para confirmar o cadastro." });
    setActiveTab("login");
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center theme-light">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass = "pl-10 bg-muted/30 border-border/50 h-11 focus-visible:border-primary/40";

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row theme-light">
      {/* Left panel — branding / hero (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden theme-dark flex-col justify-between p-10">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-display font-bold tracking-tight leading-tight">
              Sua experiência<br />
              <span className="text-gradient-gold">exclusiva</span> começa aqui.
            </h1>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-sm">
              Acompanhe seus pedidos, acesse o Vault Club e aproveite benefícios exclusivos na palma da sua mão.
            </p>
          </div>

          <div className="space-y-3">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/80">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[11px] text-muted-foreground/50 tracking-widest uppercase">
            © {new Date().getFullYear()} BRAVENZA
          </p>
        </div>

        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden relative border-b border-border/30 bg-card/80 backdrop-blur-xl theme-dark">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-xs tracking-widest uppercase text-muted-foreground">
                Voltar
              </Button>
            </Link>
          </div>
        </header>

        {/* Desktop back link */}
        <div className="hidden lg:flex px-8 pt-6">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>

        {/* Form container */}
        <main className="flex-1 flex items-center justify-center px-5 py-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px]"
          >
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-6">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Área do Cliente
              </p>
            </div>

            {/* Card */}
            <div className="bg-card border border-border/50 rounded-xl p-6 sm:p-7 shadow-[var(--shadow-md)]">
              {showResetPassword ? (
                <ResetPasswordForm
                  onComplete={() => {
                    setShowResetPassword(false);
                    supabase.auth.signOut();
                    toast({ title: "Senha atualizada!", description: "Faça login com sua nova senha." });
                  }}
                />
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-display font-bold">Bem-vindo à BRAVENZA</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acesse seus pedidos e benefícios exclusivos
                    </p>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">Entrar</TabsTrigger>
                      <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                    </TabsList>

                    {/* Login Tab */}
                    <TabsContent value="login">
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
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Email enviado para <strong className="text-foreground">{resetEmail}</strong>.
                              </p>
                            </div>
                          ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Informe seu email para redefinir a senha.
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input id="reset-email" type="email" placeholder="seu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={inputClass} />
                                </div>
                              </div>
                              <Button type="submit" className="w-full btn-gold h-11" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
                              </Button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                                className={inputClass}
                                required
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password">Senha</Label>
                              <button
                                type="button"
                                onClick={() => { setShowForgotPassword(true); setResetEmail(loginEmail); }}
                                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                              >
                                Esqueceu a senha?
                              </button>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className={`${inputClass} pr-10`}
                                required
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

                          <Button type="submit" className="w-full btn-gold h-11" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                          </Button>
                        </form>
                      )}
                    </TabsContent>

                    {/* Signup Tab */}
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="full-name">Nome Completo</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="full-name" type="text" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpf">CPF</Label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="cpf" type="text" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} className={inputClass} required />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Use o mesmo CPF dos seus pedidos para vincular automaticamente
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="signup-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" placeholder="seu@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={inputClass} required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone (opcional)</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phone" type="text" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className={inputClass} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className={`${inputClass} pr-10`} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} pr-10`} required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button type="submit" className="w-full btn-gold h-11" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  {/* Trust footer */}
                  <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-center gap-4">
                    {benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <b.icon className="h-3 w-3 text-primary/60" />
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">{b.text}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-5">
              Ao criar uma conta, você concorda com nossos{" "}
              <Link to="/termos" className="text-primary hover:underline">termos</Link>{" "}e{" "}
              <Link to="/privacidade" className="text-primary hover:underline">política de privacidade</Link>.
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
