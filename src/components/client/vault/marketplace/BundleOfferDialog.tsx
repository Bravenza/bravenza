import { useState } from "react";
import { Package, Send } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface BundleListing {
  id: string;
  title: string;
  price: number;
  photos?: string[];
}

interface BundleOfferDialogProps {
  listings: BundleListing[];
  onSubmit: (data: {
    listing_ids: string[];
    prices: number[];
    message?: string;
    buyer_name: string;
    discount_percent: number;
  }) => Promise<boolean>;
  buyerName: string;
}

export function BundleOfferDialog({ listings, onSubmit, buyerName }: BundleOfferDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [discount, setDiscount] = useState(10);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalOriginal = listings.reduce((s, l) => s + l.price, 0);
  const totalWithDiscount = Math.round(totalOriginal * (1 - discount / 100) * 100) / 100;
  const savings = totalOriginal - totalWithDiscount;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const prices = listings.map((l) => Math.round(l.price * (1 - discount / 100) * 100) / 100);
      const success = await onSubmit({
        listing_ids: listings.map((l) => l.id),
        prices,
        message: message || undefined,
        buyer_name: buyerName,
        discount_percent: discount,
      });
      if (success) {
        setOpen(false);
        setMessage("");
        setDiscount(10);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (listings.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          Bundle ({listings.length} itens)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Oferta Bundle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Items list */}
          <div className="space-y-2">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                {l.photos?.[0] && (
                  <img src={l.photos[0]} alt={l.title} className="w-10 h-10 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {l.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Discount slider */}
          <div>
            <Label>Desconto proposto: {discount}%</Label>
            <Slider
              value={[discount]}
              onValueChange={([v]) => setDiscount(v)}
              min={5}
              max={30}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Price summary */}
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total original</span>
              <span className="line-through text-muted-foreground">
                R$ {totalOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Oferta bundle</span>
              <span className="text-primary">
                R$ {totalWithDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-success font-medium">
              Economia: R$ {savings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <Label>Mensagem (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Gostaria de comprar os dois juntos com desconto..."
              className="mt-1"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full btn-gold gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Enviando..." : `Enviar oferta bundle (R$ ${totalWithDiscount.toFixed(2)})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}