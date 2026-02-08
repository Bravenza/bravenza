import { useState } from "react";
import { UserCheck, Banknote, FileCheck, ChevronRight, ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { KycStep } from "./seller-onboarding/KycStep";
import { PayoutStep } from "./seller-onboarding/PayoutStep";
import { IdVerificationStep, type IdDocuments } from "./seller-onboarding/IdVerificationStep";
import { TermsStep } from "./seller-onboarding/TermsStep";

interface SellerOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: SellerOnboardingData, documents: IdDocuments) => Promise<boolean>;
}

export interface SellerOnboardingData {
  full_name: string;
  cpf_cnpj: string;
  phone: string;
  seller_cep: string;
  pix_key_type: string;
  pix_key: string;
  pix_beneficiary: string;
  bank_name: string;
  account_type: string;
  terms_accepted: boolean;
}

type Step = "kyc" | "payout" | "docs" | "terms";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "kyc", label: "Dados pessoais", icon: <UserCheck className="h-4 w-4" /> },
  { key: "payout", label: "Repasse", icon: <Banknote className="h-4 w-4" /> },
  { key: "docs", label: "Identidade", icon: <ShieldCheck className="h-4 w-4" /> },
  { key: "terms", label: "Termos", icon: <FileCheck className="h-4 w-4" /> },
];

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
  const [pixBeneficiary, setPixBeneficiary] = useState("");
  const [bankName, setBankName] = useState("");

  const [documents, setDocuments] = useState<IdDocuments>({ front: null, back: null, selfie: null });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const isCnpj = cpfCnpj.replace(/\D/g, "").length > 11;
  const derivedAccountType = isCnpj ? "pj" : "pf";

  const isKycValid = fullName.trim().length >= 3 && cpfCnpj.replace(/\D/g, "").length >= 11 && phone.replace(/\D/g, "").length >= 10 && sellerCep.replace(/\D/g, "").length === 8;
  const isPayoutValid = pixKeyType.length > 0 && pixKey.trim().length >= 3 && pixBeneficiary.trim().length >= 3 && bankName.trim().length >= 2;
  const isDocsValid = !!documents.front && !!documents.back && !!documents.selfie;
  const isTermsValid = termsAccepted;

  const canAdvance = step === "kyc" ? isKycValid : step === "payout" ? isPayoutValid : step === "docs" ? isDocsValid : isTermsValid;

  const handleNext = () => {
    if (step === "kyc") setStep("payout");
    else if (step === "payout") setStep("docs");
    else if (step === "docs") setStep("terms");
  };

  const handleBack = () => {
    if (step === "payout") setStep("kyc");
    else if (step === "docs") setStep("payout");
    else if (step === "terms") setStep("docs");
  };

  const handleSubmit = async () => {
    if (!canAdvance) return;
    setIsSubmitting(true);
    try {
      const success = await onComplete(
        {
          full_name: fullName.trim(),
          cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
          seller_cep: sellerCep.replace(/\D/g, ""),
          pix_key_type: pixKeyType,
          pix_key: pixKey.trim(),
          pix_beneficiary: pixBeneficiary.trim(),
          bank_name: bankName.trim(),
          account_type: derivedAccountType,
          terms_accepted: true,
        },
        documents
      );
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

        {/* Steps */}
        {step === "kyc" && (
          <KycStep
            fullName={fullName} setFullName={setFullName}
            cpfCnpj={cpfCnpj} setCpfCnpj={setCpfCnpj}
            phone={phone} setPhone={setPhone}
            sellerCep={sellerCep} setSellerCep={setSellerCep}
          />
        )}
        {step === "payout" && (
          <PayoutStep
            isCnpj={isCnpj}
            pixKeyType={pixKeyType} setPixKeyType={setPixKeyType}
            pixKey={pixKey} setPixKey={setPixKey}
            pixBeneficiary={pixBeneficiary} setPixBeneficiary={setPixBeneficiary}
            bankName={bankName} setBankName={setBankName}
          />
        )}
        {step === "docs" && (
          <IdVerificationStep documents={documents} setDocuments={setDocuments} />
        )}
        {step === "terms" && (
          <TermsStep
            fullName={fullName} cpfCnpj={cpfCnpj}
            derivedAccountType={derivedAccountType} bankName={bankName}
            pixKeyType={pixKeyType} pixBeneficiary={pixBeneficiary}
            termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted}
          />
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
