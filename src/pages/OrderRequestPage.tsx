import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, User, MapPin, Package, ClipboardCheck } from "lucide-react";
import { Footer } from "@/components/home/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { RequestStepper } from "@/components/order-request/RequestStepper";
import { 
  PersonalDataStep, 
  AddressStep, 
  ProductStep, 
  ReviewStep 
} from "@/components/order-request/steps";
import { motion, AnimatePresence } from "framer-motion";

const WIZARD_STEPS = [
  { id: 1, label: "Dados Pessoais", icon: <User className="h-5 w-5" /> },
  { id: 2, label: "Endereço", icon: <MapPin className="h-5 w-5" /> },
  { id: 3, label: "Produto", icon: <Package className="h-5 w-5" /> },
  { id: 4, label: "Revisão", icon: <ClipboardCheck className="h-5 w-5" /> },
];

export default function OrderRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [referralInfo, setReferralInfo] = useState<{ code: string; referrerName: string; discount: number } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    client_name: "",
    client_cpf: "",
    client_email: "",
    client_phone: "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    shoe_size: "",
    product_brand: "",
    product_model: "",
    product_color: "",
    product_link: "",
    additional_notes: "",
    referral_code: "",
    custom_model: "",
  });

  const [selectedBrand, setSelectedBrand] = useState("");

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  const validateReferralCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("referral_code, referrer_name, discount_percentage, status, expires_at")
        .eq("referral_code", code.toUpperCase())
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          toast.error("Código de indicação expirado");
          return;
        }

        setReferralInfo({
          code: data.referral_code,
          referrerName: data.referrer_name,
          discount: data.discount_percentage || 5,
        });
        setFormData(prev => ({ ...prev, referral_code: data.referral_code }));
        toast.success(`Código de indicação válido! Indicado por ${data.referrer_name}`);
      } else {
        toast.error("Código de indicação inválido ou já utilizado");
      }
    } catch (err) {
      console.error("Error validating referral code:", err);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format CPF
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Format phone
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

  // Format CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, "$1-$2");
  };

  // Fetch address from CEP
  const fetchAddressFromCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        address_street: data.logradouro || "",
        address_neighborhood: data.bairro || "",
        address_city: data.localidade || "",
        address_state: data.uf || "",
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Handle brand change
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    updateField("product_brand", brand);
    updateField("product_model", "");
  };

  // Validate step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: {
        if (!formData.client_name || !formData.client_cpf || !formData.client_email || !formData.client_phone) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        const cpfClean = formData.client_cpf.replace(/\D/g, "");
        if (cpfClean.length !== 11) {
          toast.error("CPF inválido");
          return false;
        }
        if (!formData.client_email.includes("@")) {
          toast.error("E-mail inválido");
          return false;
        }
        return true;
      }
      case 2: {
        if (!formData.address_cep || !formData.address_street || !formData.address_number || 
            !formData.address_neighborhood || !formData.address_city || !formData.address_state) {
          toast.error("Preencha todos os campos obrigatórios do endereço");
          return false;
        }
        return true;
      }
      case 3: {
        if (!formData.shoe_size) {
          toast.error("Selecione o tamanho do tênis");
          return false;
        }
        // Validate brand - either selected brand or custom brand when "other"
        const hasBrand = selectedBrand === "other" 
          ? formData.product_brand && formData.product_brand !== "other"
          : selectedBrand;
        if (!hasBrand) {
          toast.error("Selecione a marca do tênis");
          return false;
        }
        // Validate model - either selected model or custom model when "other"
        const hasModel = formData.product_model === "other" || selectedBrand === "other"
          ? formData.custom_model
          : formData.product_model;
        if (!hasModel) {
          toast.error("Selecione ou informe o modelo do tênis");
          return false;
        }
        if (!formData.product_color) {
          toast.error("Informe a cor do tênis");
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  // Navigate between steps
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("sneaker-references")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("sneaker-references")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Prepare form data - use custom_model if "other" was selected
      const finalBrand = selectedBrand === "other" ? formData.product_brand : selectedBrand;
      const finalModel = formData.product_model === "other" || selectedBrand === "other" 
        ? formData.custom_model 
        : formData.product_model;

      // Insert request with referral_code
      const { data: requestData, error } = await supabase
        .from("order_requests")
        .insert({
          client_name: formData.client_name,
          client_cpf: formData.client_cpf,
          client_email: formData.client_email,
          client_phone: formData.client_phone,
          address_cep: formData.address_cep,
          address_street: formData.address_street,
          address_number: formData.address_number,
          address_complement: formData.address_complement,
          address_neighborhood: formData.address_neighborhood,
          address_city: formData.address_city,
          address_state: formData.address_state,
          shoe_size: formData.shoe_size,
          product_brand: finalBrand,
          product_model: finalModel,
          product_color: formData.product_color,
          product_link: formData.product_link,
          additional_notes: formData.additional_notes,
          referral_code: referralInfo?.code || formData.referral_code || null,
          reference_image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // If referral code was used, update the referral status to converted
      if (referralInfo?.code && requestData) {
        await supabase
          .from("referrals")
          .update({
            status: "converted",
            referred_cpf: formData.client_cpf.replace(/\D/g, ""),
            referred_name: formData.client_name,
          })
          .eq("referral_code", referralInfo.code)
          .eq("status", "pending");
      }

      // Create notification for admins
      try {
        await supabase.functions.invoke("create-notification", {
          body: {
            target: "admin",
            type: "new_order_request",
            title: "Nova Solicitação de Pedido",
            message: `${formData.client_name} solicitou um orçamento para ${finalBrand || "tênis"} ${finalModel || ""} tamanho ${formData.shoe_size}`,
            reference_type: "order_request",
          },
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }

      setIsSuccess(true);
      toast.success("Solicitação enviada com sucesso!");

    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="h-10 w-10 text-success" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Solicitação Enviada!</h2>
              <p className="text-muted-foreground mb-6">
                Recebemos sua solicitação e entraremos em contato em breve com o orçamento.
              </p>
              <Button onClick={() => navigate("/")} className="w-full btn-gold">
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-2xl flex-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Solicitar Orçamento</h1>
          <p className="text-muted-foreground">
            Preencha o formulário em 4 etapas simples
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <RequestStepper 
            steps={WIZARD_STEPS} 
            currentStep={currentStep} 
            onStepClick={goToStep}
          />
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <PersonalDataStep
                      formData={formData}
                      updateField={updateField}
                      formatCpf={formatCpf}
                      formatPhone={formatPhone}
                    />
                  )}
                  
                  {currentStep === 2 && (
                    <AddressStep
                      formData={formData}
                      updateField={updateField}
                      formatCep={formatCep}
                      onCepChange={fetchAddressFromCep}
                      isLoadingCep={isLoadingCep}
                    />
                  )}
                  
                  {currentStep === 3 && (
                    <ProductStep
                      formData={formData}
                      selectedBrand={selectedBrand}
                      updateField={updateField}
                      onBrandChange={handleBrandChange}
                      imagePreview={imagePreview}
                      onImageChange={handleImageChange}
                      onRemoveImage={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    />
                  )}
                  
                  {currentStep === 4 && (
                    <ReviewStep
                      formData={formData}
                      updateField={updateField}
                      referralInfo={referralInfo}
                      validateReferralCode={validateReferralCode}
                      imagePreview={imagePreview}
                      onStepClick={goToStep}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
                
                {currentStep < WIZARD_STEPS.length ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="flex-1 btn-gold"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-gold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
