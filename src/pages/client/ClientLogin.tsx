import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, Shield } from "lucide-react";
import { useClientAuth } from "@/hooks/useClientAuth";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Logo } from "@/components/Logo";

export default function ClientLogin() {
  const navigate = useNavigate();
  const { requestCode, verifyCode } = useClientAuth();
  
  const [step, setStep] = useState<"cpf" | "code">("cpf");
  const [cpf, setCpf] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      toast.error("CPF inválido");
      return;
    }

    setIsLoading(true);
    const result = await requestCode(cleanCPF);
    setIsLoading(false);

    if (result.success) {
      setMaskedEmail(result.message || "");
      setStep("code");
      toast.success("Código enviado!");
    } else {
      toast.error(result.error || "Erro ao enviar código");
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Digite o código completo");
      return;
    }

    setIsLoading(true);
    const result = await verifyCode(cpf, code);
    setIsLoading(false);

    if (result.success) {
      toast.success("Login realizado com sucesso!");
      navigate("/minha-conta");
    } else {
      toast.error(result.error || "Código inválido");
    }
  };

  return (
    <PublicLayout showHeader={false}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <Logo size="lg" className="mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Área do Cliente</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe seus pedidos e documentos
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === "cpf" ? (
                  <>
                    <Shield className="h-5 w-5 text-primary" />
                    Acesse sua conta
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 text-primary" />
                    Verificação
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {step === "cpf" 
                  ? "Digite seu CPF para receber um código de acesso por email"
                  : maskedEmail
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {step === "cpf" ? (
                  <motion.form
                    key="cpf-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleRequestCode}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCPFChange}
                        maxLength={14}
                        className="text-lg tracking-wider"
                        autoComplete="off"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar código"
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="code-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-center">
                      <InputOTP
                        value={code}
                        onChange={setCode}
                        maxLength={6}
                        onComplete={handleVerifyCode}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="text-xl" />
                          <InputOTPSlot index={1} className="text-xl" />
                          <InputOTPSlot index={2} className="text-xl" />
                          <InputOTPSlot index={3} className="text-xl" />
                          <InputOTPSlot index={4} className="text-xl" />
                          <InputOTPSlot index={5} className="text-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleVerifyCode}
                        disabled={isLoading || code.length !== 6}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="ghost" 
                        onClick={() => {
                          setStep("cpf");
                          setCode("");
                        }}
                        className="w-full"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem um pedido?{" "}
            <a href="/" className="text-primary hover:underline">
              Voltar ao início
            </a>
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
