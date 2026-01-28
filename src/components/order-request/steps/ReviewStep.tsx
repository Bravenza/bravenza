import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, CheckCircle2, User, MapPin, Package, Edit2 } from "lucide-react";

interface ReferralInfo {
  code: string;
  referrerName: string;
  discount: number;
}

interface ReviewStepProps {
  formData: {
    client_name: string;
    client_cpf: string;
    client_email: string;
    client_phone: string;
    address_cep: string;
    address_street: string;
    address_number: string;
    address_complement: string;
    address_neighborhood: string;
    address_city: string;
    address_state: string;
    shoe_size: string;
    product_brand: string;
    product_model: string;
    product_color: string;
    product_link: string;
    additional_notes: string;
    referral_code: string;
  };
  updateField: (field: string, value: string) => void;
  referralInfo: ReferralInfo | null;
  validateReferralCode: (code: string) => void;
  imagePreview: string | null;
  onStepClick: (step: number) => void;
}

export const ReviewStep = ({
  formData,
  updateField,
  referralInfo,
  validateReferralCode,
  imagePreview,
  onStepClick,
}: ReviewStepProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Revisão Final</h2>
          <p className="text-sm text-muted-foreground">Confira seus dados antes de enviar</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="space-y-4">
        {/* Personal Data Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Dados Pessoais</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStepClick(1)}
                className="h-8 px-2 text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
            <div className="grid gap-1 text-sm">
              <p><span className="text-muted-foreground">Nome:</span> {formData.client_name}</p>
              <p><span className="text-muted-foreground">CPF:</span> {formData.client_cpf}</p>
              <p><span className="text-muted-foreground">E-mail:</span> {formData.client_email}</p>
              <p><span className="text-muted-foreground">Telefone:</span> {formData.client_phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Address Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Endereço de Entrega</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStepClick(2)}
                className="h-8 px-2 text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
            <p className="text-sm">
              {formData.address_street}, {formData.address_number}
              {formData.address_complement && ` - ${formData.address_complement}`}
              <br />
              {formData.address_neighborhood}, {formData.address_city} - {formData.address_state}
              <br />
              CEP: {formData.address_cep}
            </p>
          </CardContent>
        </Card>

        {/* Product Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Produto</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStepClick(3)}
                className="h-8 px-2 text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
            <div className="flex gap-4">
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-20 h-20 object-contain rounded-lg border border-border bg-background"
                />
              )}
              <div className="grid gap-1 text-sm flex-1">
                <p><span className="text-muted-foreground">Tamanho:</span> {formData.shoe_size}</p>
                {formData.product_brand && (
                  <p><span className="text-muted-foreground">Marca:</span> {formData.product_brand}</p>
                )}
                {formData.product_model && (
                  <p><span className="text-muted-foreground">Modelo:</span> {formData.product_model}</p>
                )}
                {formData.product_color && (
                  <p><span className="text-muted-foreground">Cor:</span> {formData.product_color}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <div className={`p-4 rounded-lg border ${referralInfo ? "border-primary/50 bg-primary/5" : "border-border"}`}>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-primary" />
          <span className="font-medium">Código de Indicação</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {referralInfo 
            ? `Você foi indicado por ${referralInfo.referrerName}! O indicador receberá ${referralInfo.discount}% de desconto.`
            : "Tem um código de indicação? Insira aqui para beneficiar quem te indicou."}
        </p>
        <div className="flex gap-2">
          <Input
            value={formData.referral_code}
            onChange={(e) => updateField("referral_code", e.target.value.toUpperCase())}
            placeholder="Ex: BRVZABC123"
            disabled={!!referralInfo}
            className={`h-10 ${referralInfo ? "border-primary/50" : ""}`}
          />
          {!referralInfo && formData.referral_code.length >= 4 && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => validateReferralCode(formData.referral_code)}
              className="h-10"
            >
              Validar
            </Button>
          )}
        </div>
        {referralInfo && (
          <div className="mt-2 flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Código válido!
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additional_notes">Observações Adicionais</Label>
        <Textarea
          id="additional_notes"
          value={formData.additional_notes}
          onChange={(e) => updateField("additional_notes", e.target.value)}
          placeholder="Algo mais que devemos saber sobre o pedido?"
          rows={3}
        />
      </div>
    </div>
  );
};
