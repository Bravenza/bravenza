import { useState, useEffect } from "react";
import { ShoppingCart, ShieldCheck, Truck, CreditCard, Loader2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MobileSelect } from "@/components/ui/mobile-select";
import type { MarketplaceListing } from "@/hooks/useMarketplace";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

interface MarketplaceCheckoutDialogProps {
  listing: MarketplaceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    listing_id: string;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
    buyer_address: string;
    payment_method: string;
  }) => Promise<any>;
  buyerDefaults?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export function MarketplaceCheckoutDialog({
  listing,
  open,
  onOpenChange,
  onConfirm,
  buyerDefaults,
}: MarketplaceCheckoutDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [form, setForm] = useState({
    buyer_name: buyerDefaults?.name || "",
    buyer_email: buyerDefaults?.email || "",
    buyer_phone: buyerDefaults?.phone || "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    payment_method: "pix",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      buyer_name: buyerDefaults?.name || prev.buyer_name,
      buyer_email: buyerDefaults?.email || prev.buyer_email,
      buyer_phone: buyerDefaults?.phone || prev.buyer_phone,
    }));
  }, [buyerDefaults?.name, buyerDefaults?.email, buyerDefaults?.phone]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingCep(false);
    }
  };

  if (!listing) return null;

  const totalPrice = listing.price + (listing.shipping_cost_estimate || 0);

  const buildAddressString = () => {
    const parts = [
      form.address_street,
      form.address_number,
      form.address_complement,
      form.address_neighborhood,
      form.address_city,
      form.address_state,
      form.address_cep,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const isAddressValid = form.address_cep && form.address_street && form.address_number && form.address_neighborhood && form.address_city && form.address_state;

  const handleSubmit = async () => {
    if (!form.buyer_name || !isAddressValid) return;
    setIsSubmitting(true);
    try {
      const result = await onConfirm({
        listing_id: listing.id,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email,
        buyer_phone: form.buyer_phone,
        buyer_address: buildAddressString(),
        payment_method: form.payment_method,
      });
      if (result) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stateOptions = BR_STATES.map((s) => ({ value: s, label: s }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Finalizar compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Product summary */}
          <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
            {listing.photos?.[0] && (
              <img
                src={listing.photos[0]}
                alt={listing.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
              <p className="text-xs text-muted-foreground">
                {listing.brand} {listing.model ? `· ${listing.model}` : ""} {listing.size ? `· Tam. ${listing.size}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {listing.is_vault_certified && (
                  <Badge className="bg-primary/20 text-primary text-[10px] gap-0.5 px-1.5 py-0">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Vault ID
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                  <Truck className="h-2.5 w-2.5" />
                  {listing.shipping_mode === "bravenza" ? "Via Bravenza" : "Direto"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produto</span>
              <span>R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete estimado</span>
              <span>R$ {(listing.shipping_cost_estimate || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <Separator />

          {/* Buyer info */}
          <div className="space-y-3">
            <div>
              <Label>Seu nome *</Label>
              <Input
                value={form.buyer_name}
                onChange={(e) => updateField("buyer_name", e.target.value)}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>E-mail</Label>
                <Input
                  value={form.buyer_email}
                  onChange={(e) => updateField("buyer_email", e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.buyer_phone}
                  onChange={(e) => updateField("buyer_phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address - Detailed fields matching system pattern */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Endereço de entrega</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">CEP *</Label>
                <div className="relative">
                  <Input
                    value={form.address_cep}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      updateField("address_cep", formatted);
                      if (formatted.replace(/\D/g, "").length === 8) {
                        handleCepChange(formatted);
                      }
                    }}
                    placeholder="00000-000"
                    className="mt-1"
                  />
                  {isLoadingCep && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs">Estado *</Label>
                <MobileSelect
                  value={form.address_state}
                  onValueChange={(v) => updateField("address_state", v)}
                  options={stateOptions}
                  placeholder="UF"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Rua *</Label>
              <Input
                value={form.address_street}
                onChange={(e) => updateField("address_street", e.target.value)}
                placeholder="Nome da rua"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Número *</Label>
                <Input
                  value={form.address_number}
                  onChange={(e) => updateField("address_number", e.target.value)}
                  placeholder="123"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Complemento</Label>
                <Input
                  value={form.address_complement}
                  onChange={(e) => updateField("address_complement", e.target.value)}
                  placeholder="Apto, bloco..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Bairro *</Label>
                <Input
                  value={form.address_neighborhood}
                  onChange={(e) => updateField("address_neighborhood", e.target.value)}
                  placeholder="Bairro"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Cidade *</Label>
                <Input
                  value={form.address_city}
                  onChange={(e) => updateField("address_city", e.target.value)}
                  placeholder="Cidade"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment method */}
          <div>
            <Label className="mb-2 block">Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "pix", label: "PIX", icon: "💚" },
                { value: "card", label: "Cartão", icon: "💳" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField("payment_method", opt.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    form.payment_method === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-primary/40"
                  }`}
                >
                  <span className="mr-1.5">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground space-y-1">
            <p>🔒 <strong>Compra protegida:</strong> Após a entrega, você tem 7 dias úteis para reportar qualquer problema.</p>
            <p>📦 O vendedor só recebe o pagamento após o período de proteção.</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.buyer_name || !isAddressValid}
            className="w-full btn-gold gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isSubmitting ? "Processando..." : `Comprar por R$ ${totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}