import { useState } from "react";
import { HandCoins, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface OfferDialogProps {
  listingId: string;
  listingPrice: number;
  onSubmit: (data: { listing_id: string; offer_price: number; message?: string }) => Promise<boolean>;
}

export function OfferDialog({ listingId, listingPrice, onSubmit }: OfferDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const offerPrice = parseFloat(price);
    if (!offerPrice || offerPrice <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }
    if (offerPrice >= listingPrice) {
      toast({ title: "A oferta deve ser menor que o preço anunciado", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        listing_id: listingId,
        offer_price: offerPrice,
        message: message || undefined,
      });
      if (success) {
        setOpen(false);
        setPrice("");
        setMessage("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount = price ? Math.round((1 - parseFloat(price) / listingPrice) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 flex-1">
          <HandCoins className="h-4 w-4" />
          Fazer oferta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-primary" />
            Fazer uma oferta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Preço anunciado</p>
            <p className="text-lg font-bold">
              R$ {listingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <Label>Sua oferta (R$) *</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 1.200"
              className="mt-1"
            />
            {price && parseFloat(price) > 0 && parseFloat(price) < listingPrice && (
              <p className="text-xs text-primary mt-1">
                {discount}% abaixo do preço anunciado
              </p>
            )}
          </div>

          <div>
            <Label>Mensagem (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Posso pagar à vista..."
              className="mt-1"
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            O vendedor tem 48h para aceitar, recusar ou fazer uma contra-proposta.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !price}
            className="w-full btn-gold gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Enviando..." : "Enviar oferta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
