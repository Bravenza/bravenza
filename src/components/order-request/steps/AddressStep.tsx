import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileSelect } from "@/components/ui/mobile-select";
import { MapPin, Loader2 } from "lucide-react";

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

interface AddressStepProps {
  formData: {
    address_cep: string;
    address_street: string;
    address_number: string;
    address_complement: string;
    address_neighborhood: string;
    address_city: string;
    address_state: string;
  };
  updateField: (field: string, value: string) => void;
  formatCep: (value: string) => string;
  onCepChange: (cep: string) => void;
  isLoadingCep: boolean;
}

export const AddressStep = ({
  formData,
  updateField,
  formatCep,
  onCepChange,
  isLoadingCep,
}: AddressStepProps) => {
  const stateOptions = BR_STATES.map(state => ({ value: state, label: state }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Endereço de Entrega</h2>
          <p className="text-sm text-muted-foreground">Onde você deseja receber o produto</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address_cep">CEP *</Label>
          <div className="relative">
            <Input
              id="address_cep"
              value={formData.address_cep}
              onChange={(e) => {
                const formatted = formatCep(e.target.value);
                updateField("address_cep", formatted);
                if (formatted.replace(/\D/g, "").length === 8) {
                  onCepChange(formatted);
                }
              }}
              placeholder="00000-000"
              className="h-12"
              inputMode="numeric"
              autoFocus
            />
            {isLoadingCep && (
              <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address_street">Rua *</Label>
          <Input
            id="address_street"
            value={formData.address_street}
            onChange={(e) => updateField("address_street", e.target.value)}
            placeholder="Nome da rua"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_number">Número *</Label>
          <Input
            id="address_number"
            value={formData.address_number}
            onChange={(e) => updateField("address_number", e.target.value)}
            placeholder="123"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_complement">Complemento</Label>
          <Input
            id="address_complement"
            value={formData.address_complement}
            onChange={(e) => updateField("address_complement", e.target.value)}
            placeholder="Apto, bloco..."
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_neighborhood">Bairro *</Label>
          <Input
            id="address_neighborhood"
            value={formData.address_neighborhood}
            onChange={(e) => updateField("address_neighborhood", e.target.value)}
            placeholder="Bairro"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_city">Cidade *</Label>
          <Input
            id="address_city"
            value={formData.address_city}
            onChange={(e) => updateField("address_city", e.target.value)}
            placeholder="Cidade"
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_state">Estado *</Label>
          <MobileSelect
            value={formData.address_state}
            onValueChange={(value) => updateField("address_state", value)}
            options={stateOptions}
            placeholder="Selecione o estado"
            className="h-12"
          />
        </div>
      </div>
    </div>
  );
};
