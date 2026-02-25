import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsignmentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  onSuccess?: () => void;
}

const CONDITIONS = [
  { value: "novo", label: "Novo (DS / Deadstock)" },
  { value: "seminovo", label: "Seminovo (VNDS)" },
  { value: "usado_bom", label: "Usado (bom estado)" },
  { value: "usado_sinais", label: "Usado (com sinais de uso)" },
];

export function ConsignmentRequestDialog({
  open,
  onOpenChange,
  sellerId,
  onSuccess,
}: ConsignmentRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [colorway, setColorway] = useState("");
  const [size, setSize] = useState("");
  const [sizeSystem, setSizeSystem] = useState("BR");
  const [condition, setCondition] = useState("novo");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [hasReceipt, setHasReceipt] = useState(false);

  const canSubmit = brand && model && size && suggestedPrice && Number(suggestedPrice) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("marketplace_consignments" as any).insert({
        seller_id: sellerId,
        brand,
        model,
        colorway: colorway || null,
        size,
        size_system: sizeSystem,
        condition,
        suggested_price: Number(suggestedPrice),
        description: description || null,
        has_receipt: hasReceipt,
        status: "requested",
      });

      if (error) throw error;

      toast({ title: "Solicitação enviada!", description: "Você receberá as instruções de envio em breve." });
      onOpenChange(false);
      onSuccess?.();

      // Reset
      setBrand(""); setModel(""); setColorway(""); setSize("");
      setSuggestedPrice(""); setDescription(""); setHasReceipt(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao enviar solicitação", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Solicitar Bravenza Full
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          Informe os detalhes do sneaker. Após a análise, enviaremos as instruções de envio ao Hub.
          Comissão fixa de 22% sobre o valor da venda.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nike, adidas..." />
            </div>
            <div>
              <Label>Modelo *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Air Jordan 1..." />
            </div>
          </div>

          <div>
            <Label>Colorway</Label>
            <Input value={colorway} onChange={(e) => setColorway(e.target.value)} placeholder="Chicago, Bred..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tamanho *</Label>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="42" />
            </div>
            <div>
              <Label>Sistema</Label>
              <Select value={sizeSystem} onValueChange={setSizeSystem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">BR</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Condição *</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Preço sugerido (R$) *</Label>
            <Input
              type="number"
              min="0"
              value={suggestedPrice}
              onChange={(e) => setSuggestedPrice(e.target.value)}
              placeholder="1.200"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nossa equipe pode sugerir ajustes com base no mercado
            </p>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre o sneaker..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="receipt" className="cursor-pointer">Possuo nota fiscal / comprovante</Label>
            <Switch id="receipt" checked={hasReceipt} onCheckedChange={setHasReceipt} />
          </div>

          <Button
            className="w-full btn-gold"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar solicitação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
