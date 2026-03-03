import { useState } from "react";
import { Bell, DollarSign, Hash, Zap, Mail } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface AlertConfigModalProps {
  productId: string;
  productName: string;
  cpf: string;
  sizes?: string[];
  currentLowest?: number | null;
  trigger?: React.ReactNode;
}

export function AlertConfigModal({ productId, productName, cpf, sizes = [], currentLowest, trigger }: AlertConfigModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [targetSize, setTargetSize] = useState("");
  const [channels, setChannels] = useState("both");

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await marketplaceRequest(cpf, "alerts:upsert", "POST", {
        product_id: productId,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        target_size: targetSize || null,
        channels,
      });
      if (res.ok) {
        toast({ title: "Alerta criado!", description: `Você será notificado sobre ${productName}.` });
        setOpen(false);
        setTargetPrice("");
        setTargetSize("");
      } else {
        toast({ title: "Erro", description: res.error || "Não foi possível criar o alerta.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Bell className="h-3.5 w-3.5" />
            Criar alerta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Configurar alerta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-sm font-medium line-clamp-1">{productName}</p>
            {currentLowest && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Menor preço atual: R$ {currentLowest.toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          {/* Target price */}
          <div>
            <Label className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Preço alvo (opcional)
            </Label>
            <Input
              type="number"
              placeholder="Ex: 1200"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Notificar quando houver oferta igual ou menor que este valor
            </p>
          </div>

          {/* Target size */}
          <div>
            <Label className="flex items-center gap-1.5 text-sm">
              <Hash className="h-3.5 w-3.5 text-primary" />
              Tamanho (opcional)
            </Label>
            {sizes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  onClick={() => setTargetSize("")}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!targetSize ? "bg-primary/10 text-primary border-primary/30 font-semibold" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
                >
                  Qualquer
                </button>
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setTargetSize(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${targetSize === s ? "bg-primary/10 text-primary border-primary/30 font-semibold" : "border-border/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Ex: 42"
                value={targetSize}
                onChange={(e) => setTargetSize(e.target.value)}
                className="mt-1.5"
              />
            )}
          </div>

          {/* Channels */}
          <div>
            <Label className="text-sm mb-2 block">Canal de notificação</Label>
            <RadioGroup value={channels} onValueChange={setChannels} className="space-y-2">
              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="push" id="ch-push" />
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">Push</p>
                  <p className="text-[10px] text-muted-foreground">Notificação no navegador</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="email" id="ch-email" />
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">E-mail</p>
                  <p className="text-[10px] text-muted-foreground">Receber por e-mail</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="both" id="ch-both" />
                <div className="flex gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium">Ambos</p>
                  <p className="text-[10px] text-muted-foreground">Push + E-mail</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full btn-gold">
            {saving ? "Salvando..." : "Ativar alerta"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            Plano Free: até 5 alertas • Pro/Elite: ilimitados
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
