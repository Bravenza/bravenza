import { useState } from "react";
import { 
  Truck, 
  Calculator, 
  Tag, 
  Package, 
  Loader2, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Copy,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/constants";

interface ShippingSectionProps {
  orderId: string;
  clientName: string;
  clientCpf: string;
  clientPhone: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  productName: string;
  productPrice: number | null;
  nationalTracking: string | null;
  nationalCarrier: string | null;
  onTrackingUpdate?: (tracking: string, carrier: string) => void;
  onShippingCostAdded?: (cost: number) => void;
}

interface FreightQuote {
  id: number;
  name: string;
  company: { name: string; picture: string };
  price: number;
  discount: number;
  currency: string;
  delivery_time: number;
  delivery_range: { min: number; max: number };
  custom_delivery_time?: number;
  custom_delivery_range?: { min: number; max: number };
  packages?: any[];
  error?: string;
}

interface ShippingLabel {
  id: string;
  tracking: string;
  status: string;
  print_url?: string;
}

// Default package dimensions for sneakers (in cm and kg)
const DEFAULT_PACKAGE = {
  weight: 1.2, // kg
  height: 15, // cm
  width: 35, // cm  
  length: 30, // cm
};

// Origin address (Bravenza warehouse)
const ORIGIN_ADDRESS = {
  name: "BRAVENZA VAULT",
  phone: "5551981055425",
  email: "contato@bravenza.com",
  document: "00000000000", // CNPJ/CPF - to be configured
  address: "Rua Dr. Egydio Michaelsen",
  number: "176",
  complement: "",
  neighborhood: "Cavalhada",
  city: "Porto Alegre",
  state: "RS",
  postal_code: "91751140",
};

// Token is now stored as Supabase secret - no need for localStorage
const hasApiTokenConfigured = true; // Token is configured in backend secrets

export function ShippingSection({
  orderId,
  clientName,
  clientCpf,
  clientPhone,
  clientEmail,
  clientAddress,
  productName,
  productPrice,
  nationalTracking,
  nationalCarrier,
  onTrackingUpdate,
  onShippingCostAdded,
}: ShippingSectionProps) {
  const [isQuoting, setIsQuoting] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [quotes, setQuotes] = useState<FreightQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<FreightQuote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // Custom package dimensions
  const [packageDimensions, setPackageDimensions] = useState(DEFAULT_PACKAGE);

  // Parse client address to extract CEP
  const extractCepFromAddress = (address: string | null): string => {
    if (!address) return "";
    const cepMatch = address.match(/CEP:\s*(\d{5}-?\d{3})/i);
    return cepMatch ? cepMatch[1].replace("-", "") : "";
  };

  const parsedClientAddress = {
    cep: extractCepFromAddress(clientAddress),
    // Parse other fields from address string if needed
  };

  const handleQuoteFreight = async () => {
    const toCep = parsedClientAddress.cep;
    if (!toCep || toCep.length !== 8) {
      toast.error("CEP do cliente não encontrado ou inválido no endereço");
      return;
    }

    setIsQuoting(true);
    setQuotes([]);

    try {
      const { data, error } = await supabase.functions.invoke("superfrete", {
        body: {
          action: "quote",
          from_cep: ORIGIN_ADDRESS.postal_code,
          to_cep: toCep,
          weight: packageDimensions.weight,
          height: packageDimensions.height,
          width: packageDimensions.width,
          length: packageDimensions.length,
          insurance_value: productPrice || 0,
        },
      });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const validQuotes = data.filter((q: FreightQuote) => !q.error);
        setQuotes(validQuotes);
        setShowQuoteModal(true);
        
        if (validQuotes.length === 0) {
          toast.warning("Nenhuma opção de frete disponível para este destino");
        }
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error quoting freight:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao calcular frete");
    } finally {
      setIsQuoting(false);
    }
  };

  const handleSelectQuote = async (quote: FreightQuote) => {
    setSelectedQuote(quote);
    setShowQuoteModal(false);
    setShowLabelModal(true);
    
    // Automatically add shipping cost to order_costs
    try {
      // First check if there's already a shipping cost entry for this order
      const { data: existingCosts } = await supabase
        .from("order_costs")
        .select("id")
        .eq("order_id", orderId)
        .eq("cost_type", "shipping");
      
      if (existingCosts && existingCosts.length > 0) {
        // Update existing shipping cost
        await supabase
          .from("order_costs")
          .update({
            amount: quote.price,
            description: `${quote.company?.name || quote.name} - Prazo: ${quote.delivery_time} dias`,
          })
          .eq("id", existingCosts[0].id);
      } else {
        // Create new shipping cost entry
        await supabase
          .from("order_costs")
          .insert({
            order_id: orderId,
            cost_type: "shipping",
            amount: quote.price,
            description: `${quote.company?.name || quote.name} - Prazo: ${quote.delivery_time} dias`,
          });
      }
      
      // Also update the shipping_cost field on the order
      await supabase
        .from("orders")
        .update({ shipping_cost: quote.price })
        .eq("order_id", orderId);
      
      // Notify parent component
      if (onShippingCostAdded) {
        onShippingCostAdded(quote.price);
      }
      
      toast.success(`Frete de ${formatCurrency(quote.price)} adicionado aos custos`);
    } catch (error) {
      console.error("Error adding shipping cost:", error);
      // Don't block the flow, just log the error
    }
  };

  const parseAddressForLabel = () => {
    if (!clientAddress) return null;

    // Parse address: "Rua X, nº 123, Bairro, Cidade - UF, CEP: 00000-000"
    const parts = clientAddress.split(",").map(p => p.trim());
    
    const street = parts[0] || "";
    const numMatch = parts[1]?.match(/n[º°]?\s*(\S+)/i);
    const number = numMatch ? numMatch[1] : "";
    
    // Find CEP
    const cepMatch = clientAddress.match(/CEP:\s*(\d{5}-?\d{3})/i);
    const cep = cepMatch ? cepMatch[1].replace("-", "") : "";

    // Find city and state
    const cityStateMatch = clientAddress.match(/([^,]+)\s*-\s*(\w{2})(?:,\s*CEP)?/i);
    const city = cityStateMatch ? cityStateMatch[1].trim() : "";
    const state = cityStateMatch ? cityStateMatch[2].trim() : "";

    // Neighborhood (usually 3rd part)
    const neighborhood = parts.length >= 3 ? parts[2] : "";

    return {
      address: street,
      number: number || "S/N",
      complement: "",
      neighborhood,
      city,
      state,
      postal_code: cep,
    };
  };

  const handleCreateLabel = async () => {
    if (!selectedQuote) return;

    const parsedAddress = parseAddressForLabel();
    if (!parsedAddress || !parsedAddress.postal_code) {
      toast.error("Não foi possível extrair o endereço do cliente");
      return;
    }

    setIsCreatingLabel(true);

    try {
      const { data, error } = await supabase.functions.invoke("superfrete", {
        body: {
          action: "create_label",
          service_id: selectedQuote.id,
          from: ORIGIN_ADDRESS,
          to: {
            name: clientName,
            phone: clientPhone?.replace(/\D/g, "") || "",
            email: clientEmail || "",
            document: clientCpf.replace(/\D/g, ""),
            ...parsedAddress,
          },
          products: [
            {
              name: productName,
              quantity: 1,
              unitary_value: productPrice || 0,
            },
          ],
          package: packageDimensions,
          // insurance_value deve ser o mesmo valor declarado do produto para o seguro
          // Se não quiser seguro adicional, envie 0
          insurance_value: 0,
        },
      });

      if (error) throw error;

      if (data?.checkout?.purchase?.orders?.[0]) {
        const orderData = data.checkout.purchase.orders[0];
        const trackingCode = orderData.tracking || orderData.id;
        
        toast.success("Etiqueta criada com sucesso!");
        
        // Update tracking in parent component
        if (onTrackingUpdate && trackingCode) {
          onTrackingUpdate(trackingCode, selectedQuote.company?.name || selectedQuote.name);
        }

        // Show print URL if available
        if (orderData.print_url) {
          window.open(orderData.print_url, "_blank");
        }
      } else if (data?.error) {
        // Check for specific wallet balance error
        if (data.error.includes("saldo na carteira") || data.error.includes("Sem saldo")) {
          toast.warning(
            "Etiqueta criada, mas sem saldo na carteira SuperFrete. Acesse o app SuperFrete para recarregar ou pagar com cartão de crédito.",
            { duration: 8000 }
          );
          setShowLabelModal(false);
          setSelectedQuote(null);
          return;
        }
        throw new Error(data.error);
      } else {
        toast.success("Etiqueta processada! Verifique sua conta SuperFrete.");
      }

      setShowLabelModal(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error("Error creating label:", error);
      
      // Check for wallet balance error in catch block too
      const errorMsg = error instanceof Error ? error.message : "";
      if (errorMsg.includes("saldo na carteira") || errorMsg.includes("Sem saldo")) {
        toast.warning(
          "Etiqueta criada no SuperFrete, mas sem saldo na carteira. Acesse o app para pagar a etiqueta.",
          { duration: 8000 }
        );
        setShowLabelModal(false);
        setSelectedQuote(null);
        return;
      }
      
      toast.error(errorMsg || "Erro ao criar etiqueta");
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleTrackPackage = async () => {
    if (!nationalTracking) {
      toast.error("Nenhum código de rastreio nacional cadastrado");
      return;
    }

    setIsTracking(true);

    try {
      const { data, error } = await supabase.functions.invoke("superfrete", {
        body: {
          action: "tracking",
          tracking_code: nationalTracking,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setTrackingInfo(data);
      setShowTrackingModal(true);
    } catch (error) {
      console.error("Error tracking:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao rastrear pacote");
    } finally {
      setIsTracking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const hasToken = hasApiTokenConfigured;

  return (
    <>
      <Card className="card-premium border-dashed border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-primary" />
            SuperFrete
          </CardTitle>
          <CardDescription>
            Cotação, etiquetas e rastreamento para entregas nacionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasToken && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Configure o token da API SuperFrete em Configurações → Logística</span>
            </div>
          )}

          {/* Package dimensions */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={packageDimensions.weight}
                onChange={(e) => setPackageDimensions(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Alt (cm)</Label>
              <Input
                type="number"
                value={packageDimensions.height}
                onChange={(e) => setPackageDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Larg (cm)</Label>
              <Input
                type="number"
                value={packageDimensions.width}
                onChange={(e) => setPackageDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Comp (cm)</Label>
              <Input
                type="number"
                value={packageDimensions.length}
                onChange={(e) => setPackageDimensions(prev => ({ ...prev, length: parseInt(e.target.value) || 0 }))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuoteFreight}
              disabled={!hasToken || isQuoting || !parsedClientAddress.cep}
              className="flex-1"
            >
              {isQuoting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Cotar Frete
            </Button>
            
            {nationalTracking && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTrackPackage}
                disabled={!hasToken || isTracking}
              >
                {isTracking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Rastrear
              </Button>
            )}
          </div>

          {/* Current tracking info */}
          {nationalTracking && (
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Rastreio Nacional</p>
                  <p className="font-mono text-sm font-medium">{nationalTracking}</p>
                  {nationalCarrier && (
                    <p className="text-xs text-muted-foreground">{nationalCarrier}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(nationalTracking)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Opções de Frete
            </DialogTitle>
            <DialogDescription>
              Selecione a opção de envio desejada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {quotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma opção de frete disponível
              </p>
            ) : (
              quotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => handleSelectQuote(quote)}
                  className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {quote.company?.picture && (
                        <img
                          src={quote.company.picture}
                          alt={quote.company.name}
                          className="h-8 w-auto object-contain"
                        />
                      )}
                      <div>
                        <p className="font-medium">{quote.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.company?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(quote.price)}
                      </p>
                      {quote.discount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          -{quote.discount}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {quote.delivery_range?.min || quote.delivery_time}-{quote.delivery_range?.max || quote.delivery_time} dias úteis
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Label Modal */}
      <Dialog open={showLabelModal} onOpenChange={setShowLabelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Criar Etiqueta
            </DialogTitle>
            <DialogDescription>
              Confirme os dados para gerar a etiqueta de envio
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium">{selectedQuote.name}</p>
                <p className="text-sm text-muted-foreground">{selectedQuote.company?.name}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatCurrency(selectedQuote.price)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Destinatário</p>
                <p className="text-sm">{clientName}</p>
                <p className="text-sm text-muted-foreground">{clientAddress}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Produto</p>
                <p className="text-sm">{productName}</p>
                <p className="text-sm text-muted-foreground">
                  {packageDimensions.weight}kg • {packageDimensions.height}x{packageDimensions.width}x{packageDimensions.length}cm
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabelModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLabel} disabled={isCreatingLabel}>
              {isCreatingLabel ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Tag className="h-4 w-4 mr-2" />
                  Gerar Etiqueta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Modal */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Rastreamento
            </DialogTitle>
            <DialogDescription>
              Status atual do envio
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {trackingInfo ? (
              <div className="space-y-4">
                {trackingInfo.status && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium">{trackingInfo.status}</span>
                  </div>
                )}
                
                {trackingInfo.events && Array.isArray(trackingInfo.events) && (
                  <div className="space-y-3">
                    {trackingInfo.events.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{event.description || event.status}</p>
                          <p className="text-muted-foreground">
                            {event.date} {event.time} • {event.city}/{event.state}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!trackingInfo.events && (
                  <pre className="text-xs bg-secondary/30 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(trackingInfo, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Nenhuma informação de rastreamento disponível
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackingModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
