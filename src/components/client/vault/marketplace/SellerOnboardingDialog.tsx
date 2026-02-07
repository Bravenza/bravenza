import { useState } from "react";
import { UserCheck, Banknote, FileCheck, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SellerOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: SellerOnboardingData) => Promise<boolean>;
}

export interface SellerOnboardingData {
  full_name: string;
  cpf_cnpj: string;
  phone: string;
  seller_cep: string;
  pix_key_type: string;
  pix_key: string;
  bank_name: string;
  terms_accepted: boolean;
}

type Step = "kyc" | "payout" | "terms";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "kyc", label: "Dados pessoais", icon: <UserCheck className="h-4 w-4" /> },
  { key: "payout", label: "Dados de repasse", icon: <Banknote className="h-4 w-4" /> },
  { key: "terms", label: "Termos", icon: <FileCheck className="h-4 w-4" /> },
];

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
      [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
    );
  }
  return digits.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `/${d}` : "") + (e ? `-${e}` : "")
  );
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})?(\d{4})?/, (_, a, b, c) =>
      `(${a})${b ? ` ${b}` : ""}${c ? `-${c}` : ""}`
    );
  }
  return digits.replace(/(\d{2})(\d{5})?(\d{4})?/, (_, a, b, c) =>
    `(${a})${b ? ` ${b}` : ""}${c ? `-${c}` : ""}`
  );
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{3})?/, (_, a, b) => (b ? `${a}-${b}` : a));
}

export function SellerOnboardingDialog({ open, onOpenChange, onComplete }: SellerOnboardingDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("kyc");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [sellerCep, setSellerCep] = useState("");

  const [pixKeyType, setPixKeyType] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const isKycValid = fullName.trim().length >= 3 && cpfCnpj.replace(/\D/g, "").length >= 11 && phone.replace(/\D/g, "").length >= 10 && sellerCep.replace(/\D/g, "").length === 8;
  const isPayoutValid = pixKeyType.length > 0 && pixKey.trim().length >= 3;
  const isTermsValid = termsAccepted;

  const canAdvance = step === "kyc" ? isKycValid : step === "payout" ? isPayoutValid : isTermsValid;

  const handleNext = () => {
    if (step === "kyc") setStep("payout");
    else if (step === "payout") setStep("terms");
  };

  const handleBack = () => {
    if (step === "payout") setStep("kyc");
    else if (step === "terms") setStep("payout");
  };

  const handleSubmit = async () => {
    if (!canAdvance) return;
    setIsSubmitting(true);
    try {
      const success = await onComplete({
        full_name: fullName.trim(),
        cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
        seller_cep: sellerCep.replace(/\D/g, ""),
        pix_key_type: pixKeyType,
        pix_key: pixKey.trim(),
        bank_name: bankName.trim(),
        terms_accepted: true,
      });
      if (success) {
        onOpenChange(false);
      }
    } catch {
      toast({ title: "Erro ao completar cadastro", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Cadastro de Vendedor
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                i < stepIndex ? "bg-primary text-primary-foreground"
                : i === stepIndex ? "bg-primary/20 text-primary border-2 border-primary"
                : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className="text-xs hidden sm:block">{s.label}</span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* Step: KYC */}
        {step === "kyc" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Precisamos de algumas informações para validar seu perfil de vendedor.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName">Nome completo *</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
                <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(formatCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(51) 99999-9999" />
              </div>
              <div>
                <Label htmlFor="cep">CEP de envio *</Label>
                <Input id="cep" value={sellerCep} onChange={(e) => setSellerCep(formatCEP(e.target.value))} placeholder="00000-000" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Payout */}
        {step === "payout" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure como deseja receber os repasses das suas vendas.
            </p>
            <div className="space-y-3">
              <div>
                <Label>Tipo de chave PIX *</Label>
                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pixKey">Chave PIX *</Label>
                <Input id="pixKey" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Sua chave PIX" />
              </div>
              <div>
                <Label htmlFor="bankName">Banco (opcional)</Label>
                <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Nubank, Itaú..." />
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Segurança:</strong> Seus dados bancários são criptografados e utilizados exclusivamente para repasses de vendas.
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Terms */}
        {step === "terms" && (
          <div className="space-y-4">
            <Card className="card-premium">
              <CardContent className="p-4 space-y-3 text-sm">
                <h4 className="font-semibold">Termos do Vendedor Bravenza</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 text-xs text-muted-foreground pr-2">
                  <p><strong>1. Responsabilidade:</strong> O vendedor garante a autenticidade e veracidade das informações dos produtos anunciados.</p>
                  <p><strong>2. Prazos de envio:</strong> Após a confirmação de pagamento, o vendedor tem até 3 dias úteis para enviar o produto. O não cumprimento pode resultar em cancelamento e penalidades.</p>
                  <p><strong>3. Taxas:</strong> A Bravenza cobra uma taxa de serviço sobre cada venda, variando de 8% a 14% conforme o nível do vendedor.</p>
                  <p><strong>4. Repasses:</strong> Os valores são repassados via PIX após a confirmação de entrega e encerramento da janela de proteção (48h a 10 dias, conforme tier).</p>
                  <p><strong>5. Disputas:</strong> Em caso de disputa, a Bravenza atuará como mediadora. O vendedor deve fornecer evidências solicitadas em até 48h.</p>
                  <p><strong>6. PRO Hub:</strong> Itens enviados via PRO Hub passam por inspeção física. Reprovações resultam em devolução ao vendedor, sem custos para o comprador.</p>
                  <p><strong>7. Penalidades:</strong> Cancelamentos recorrentes, atrasos no envio ou anúncios falsos podem resultar em rebaixamento de tier ou suspensão.</p>
                  <p><strong>8. Dados bancários:</strong> O vendedor é responsável por manter seus dados de repasse atualizados.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(!!v)}
              />
              <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                Li e aceito os <strong>Termos do Vendedor Bravenza</strong> e me comprometo a seguir as regras da plataforma.
              </label>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <h5 className="text-xs font-semibold mb-1.5">Resumo do seu cadastro:</h5>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>Nome: <strong className="text-foreground">{fullName}</strong></span>
                <span>CPF/CNPJ: <strong className="text-foreground">{cpfCnpj}</strong></span>
                <span>PIX: <strong className="text-foreground">{pixKeyType.toUpperCase()}</strong></span>
                <span>Chave: <strong className="text-foreground">{pixKey}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          {stepIndex > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          ) : <div />}

          {step === "terms" ? (
            <Button onClick={handleSubmit} disabled={!canAdvance || isSubmitting} className="btn-gold">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
              Finalizar cadastro
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canAdvance}>
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
