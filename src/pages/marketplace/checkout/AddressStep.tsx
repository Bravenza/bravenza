import { useCallback } from "react";
import { MapPin, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MobileSelect } from "@/components/ui/mobile-select";
import { cn } from "@/lib/utils";
import { BR_STATES, formatCep, type CheckoutFormData } from "./types";
import { useViaCep } from "@/hooks/useViaCep";

interface AddressStepProps {
  form: CheckoutFormData;
  savedAddresses: any[];
  onUpdateField: (field: string, value: string) => void;
  onApplySavedAddress: (addr: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export function AddressStep({ form, savedAddresses, onUpdateField, onApplySavedAddress, onBack, onNext }: AddressStepProps) {
  const handleCepResult = useCallback((data: any) => {
    if (data.logradouro) onUpdateField("address_street", data.logradouro);
    if (data.bairro) onUpdateField("address_neighborhood", data.bairro);
    if (data.localidade) onUpdateField("address_city", data.localidade);
    if (data.uf) onUpdateField("address_state", data.uf);
  }, [onUpdateField]);

  const { lookup: handleCepChange, isLoading: isLoadingCep } = useViaCep(handleCepResult);

  const isAddressValid = form.address_cep?.replace(/\D/g, "").length === 8 &&
    form.address_street && form.address_number &&
    form.address_neighborhood && form.address_city && form.address_state;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.buyer_email);

  const stateOptions = BR_STATES.map(s => ({ value: s, label: s }));

  return (
    <div className="bg-background rounded-2xl border border-border/20 p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-base">Endereço de entrega</h2>
      </div>

      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Endereços salvos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {savedAddresses.map(addr => (
              <button
                key={addr.id}
                onClick={() => onApplySavedAddress(addr)}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-lg border text-left text-xs transition-all",
                  form.address_cep.replace(/\D/g, "") === addr.cep
                    ? "border-primary bg-primary/5"
                    : "border-border/30 hover:border-primary/30"
                )}
              >
                <p className="font-medium">{addr.label}</p>
                <p className="text-muted-foreground truncate max-w-[180px]">{addr.street}, {addr.number}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label>Seu nome *</Label>
          <Input value={form.buyer_name} onChange={e => onUpdateField("buyer_name", e.target.value)} placeholder="Nome completo" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">E-mail *</Label>
            <Input
              type="email"
              required
              value={form.buyer_email}
              onChange={e => onUpdateField("buyer_email", e.target.value)}
              placeholder="seu@email.com"
              className={cn("mt-1.5", form.buyer_email && !isEmailValid && "border-destructive")}
            />
            {form.buyer_email && !isEmailValid && (
              <p className="text-[10px] text-destructive mt-1">E-mail inválido</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Telefone</Label>
            <Input value={form.buyer_phone} onChange={e => onUpdateField("buyer_phone", e.target.value)} placeholder="(11) 99999-9999" className="mt-1.5" />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">CEP *</Label>
            <div className="relative">
              <Input
                value={form.address_cep}
                onChange={e => {
                  const formatted = formatCep(e.target.value);
                  onUpdateField("address_cep", formatted);
                  if (formatted.replace(/\D/g, "").length === 8) handleCepChange(formatted);
                }}
                placeholder="00000-000"
                className="mt-1.5"
                inputMode="numeric"
              />
              {isLoadingCep && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-4 text-muted-foreground" />}
            </div>
          </div>
          <div>
            <Label className="text-xs">Estado *</Label>
            <MobileSelect value={form.address_state} onValueChange={v => onUpdateField("address_state", v)} options={stateOptions} placeholder="UF" className="mt-1.5" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Rua *</Label>
          <Input value={form.address_street} onChange={e => onUpdateField("address_street", e.target.value)} placeholder="Nome da rua" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Número *</Label>
            <Input value={form.address_number} onChange={e => onUpdateField("address_number", e.target.value)} placeholder="123" className="mt-1.5" inputMode="numeric" />
          </div>
          <div>
            <Label className="text-xs">Complemento</Label>
            <Input value={form.address_complement} onChange={e => onUpdateField("address_complement", e.target.value)} placeholder="Apto, bloco..." className="mt-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Bairro *</Label>
            <Input value={form.address_neighborhood} onChange={e => onUpdateField("address_neighborhood", e.target.value)} placeholder="Bairro" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs">Cidade *</Label>
            <Input value={form.address_city} onChange={e => onUpdateField("address_city", e.target.value)} placeholder="Cidade" className="mt-1.5" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!form.buyer_name || !isAddressValid || !form.buyer_email || !isEmailValid}
          className="flex-1 btn-gold gap-2 h-12 text-sm font-bold rounded-xl"
          size="lg"
        >
          Calcular frete
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
