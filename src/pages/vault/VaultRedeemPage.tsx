import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export default function VaultRedeemPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"token" | "register" | "success">("token");
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [inviteData, setInviteData] = useState<{ id: string; inviter_name: string } | null>(null);
  
  const [token, setToken] = useState(searchParams.get("code") || "");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const validateToken = async () => {
    if (!token.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código do seu convite",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidating(true);
    
    try {
      const { data, error } = await supabase
        .rpc("validate_vault_invite", { p_code: token.toUpperCase() });
      
      if (error) throw error;
      
      if (!data || data.length === 0 || !data[0].is_valid) {
        const result = data?.[0];
        if (result?.status === "used") {
          toast({
            title: "Convite já utilizado",
            description: "Este convite já foi resgatado",
            variant: "destructive",
          });
        } else if (result?.status === "expired") {
          toast({
            title: "Convite expirado",
            description: "Este convite não é mais válido",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Convite não encontrado",
            description: "Verifique o código e tente novamente",
            variant: "destructive",
          });
        }
        return;
      }
      
      const result = data[0];
      const inviterName = result.inviter_name ? result.inviter_name.split(" ")[0] : "Membro do Vault";
      
      setInviteData({ id: result.invite_id, inviter_name: inviterName });
      setStep("register");
    } catch (error) {
      console.error("Validate token error:", error);
      toast({
        title: "Erro ao validar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.cpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, email e CPF",
        variant: "destructive",
      });
      return;
    }
    
    const cleanCpf = formData.cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Digite um CPF válido",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("vault-redeem-invite", {
        body: {
          invite_code: token,
          cpf: cleanCpf,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
        },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        toast({
          title: "Erro no cadastro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      
      setStep("success");
    } catch (error) {
      console.error("Register error:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Bem-vindo ao Vault Club!</h1>
          <p className="text-primary font-medium mb-4">Tier: Vault Access</p>
          <p className="text-muted-foreground mb-8">
            Sua conta foi criada com sucesso. Faça login para começar a usar o clube.
          </p>
          <Button asChild className="btn-gold">
            <Link to="/cliente/login">
              Fazer login
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <Link to="/vault" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link to="/vault" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-muted-foreground font-medium hidden sm:inline">Vault</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative py-16 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="max-w-md mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {step === "token" ? (
              <Card className="card-premium-gold">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-display text-2xl">Resgatar convite</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Digite o código do seu Vault Pass para entrar no clube
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Código do convite</Label>
                    <Input
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      className="bg-secondary/30 border-border/50 text-center text-lg tracking-wider uppercase"
                      placeholder="VLT-XXXXXXXX"
                    />
                  </div>
                  
                  <Button
                    onClick={validateToken}
                    disabled={isValidating}
                    className="w-full btn-gold"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      "Validar convite"
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Não tem um convite?{" "}
                    <Link to="/vault/waitlist" className="text-primary hover:underline">
                      Entre na lista de espera
                    </Link>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-premium-gold">
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-2xl">Complete seu cadastro</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {inviteData && `Convite de ${inviteData.inviter_name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6 bg-primary/10 border-primary/30">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      Convite válido! Preencha seus dados para ativar sua conta.
                    </AlertDescription>
                  </Alert>
                  
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-secondary/30 border-border/50"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-secondary/30 border-border/50"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                        className="bg-secondary/30 border-border/50"
                        placeholder="000.000.000-00"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Usado para login e identificação
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">WhatsApp</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-secondary/30 border-border/50"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full btn-gold"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Ativar minha conta"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
