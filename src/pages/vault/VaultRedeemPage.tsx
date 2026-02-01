import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Gift, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      // Use RPC function to validate invite
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
      // Use edge function for redemption
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao Vault Club!</h1>
          <p className="text-amber-400 font-medium mb-4">Tier: Vault Access</p>
          <p className="text-zinc-400 mb-8">
            Sua conta foi criada com sucesso. Faça login para começar a usar o clube.
          </p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <Link to="/cliente/login">
              Fazer login
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/vault" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link to="/vault" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Vault Club</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {step === "token" ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-amber-500" />
                  </div>
                  <CardTitle className="text-2xl">Resgatar convite</CardTitle>
                  <CardDescription className="text-zinc-400">
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
                      className="bg-zinc-800 border-zinc-700 text-center text-lg tracking-wider uppercase"
                      placeholder="VLT-XXXXXXXX"
                    />
                  </div>
                  
                  <Button
                    onClick={validateToken}
                    disabled={isValidating}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
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
                  
                  <p className="text-xs text-center text-zinc-500">
                    Não tem um convite?{" "}
                    <Link to="/vault/waitlist" className="text-amber-500 hover:underline">
                      Entre na lista de espera
                    </Link>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Complete seu cadastro</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {inviteData && `Convite de ${inviteData.inviter_name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6 bg-amber-500/10 border-amber-500/30">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-200">
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
                        className="bg-zinc-800 border-zinc-700"
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
                        className="bg-zinc-800 border-zinc-700"
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
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="000.000.000-00"
                        required
                      />
                      <p className="text-xs text-zinc-500">
                        Usado para login e identificação
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">WhatsApp</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
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