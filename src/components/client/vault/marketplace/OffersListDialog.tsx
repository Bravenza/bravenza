import { useState, useEffect } from "react";
import { HandCoins, Check, X, ArrowRightLeft, Clock, History, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { marketplaceRequest } from "@/hooks/marketplace/api";
import { NegotiationTimeline } from "./NegotiationTimeline";

interface Offer {
  id: string;
  listing_id: string;
  buyer_cpf: string;
  buyer_name: string;
  offer_price: number;
  message: string | null;
  status: string;
  counter_price: number | null;
  counter_message: string | null;
  expires_at: string;
  created_at: string;
  bundle_id?: string | null;
  bundle_discount_percent?: number;
}

interface OffersListDialogProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  offers: Offer[];
  onRespond: (offerId: string, action: string, data?: any) => Promise<boolean>;
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-warning/20 text-warning" },
  accepted: { label: "Aceita", color: "bg-success/20 text-success" },
  rejected: { label: "Recusada", color: "bg-destructive/20 text-destructive" },
  expired: { label: "Expirada", color: "bg-muted text-muted-foreground" },
  counter: { label: "Contra-proposta", color: "bg-primary/20 text-primary" },
};

export function OffersListDialog({
  listingId,
  listingTitle,
  listingPrice,
  offers,
  onRespond,
  onRefresh,
}: OffersListDialogProps) {
  const { toast } = useToast();
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [timelineOfferId, setTimelineOfferId] = useState<string | null>(null);

  const pendingOffers = offers.filter((o) => o.status === "pending");

  // Group bundle offers
  const bundleGroups = new Map<string, Offer[]>();
  const standaloneOffers: Offer[] = [];
  offers.forEach((o) => {
    if (o.bundle_id) {
      const group = bundleGroups.get(o.bundle_id) || [];
      group.push(o);
      bundleGroups.set(o.bundle_id, group);
    } else {
      standaloneOffers.push(o);
    }
  });

  const handleRespond = async (offerId: string, action: string) => {
    setIsResponding(true);
    try {
      const data: any = {};
      if (action === "counter") {
        if (!counterPrice) return;
        data.counter_price = parseFloat(counterPrice);
        data.counter_message = counterMessage || undefined;
      }
      const success = await onRespond(offerId, action, data);
      if (success) {
        setCounterOfferId(null);
        setCounterPrice("");
        setCounterMessage("");
        onRefresh();
      }
    } finally {
      setIsResponding(false);
    }
  };

  const renderOffer = (offer: Offer) => {
    const cfg = statusConfig[offer.status] || statusConfig.pending;
    const discount = Math.round((1 - offer.offer_price / listingPrice) * 100);
    const isExpired = new Date(offer.expires_at) < new Date() && offer.status === "pending";
    const timeRemaining = Math.max(0, new Date(offer.expires_at).getTime() - Date.now());
    const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div key={offer.id} className="p-3 border border-border/50 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{offer.buyer_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(offer.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {offer.bundle_id && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">📦 Bundle</Badge>
            )}
            <Badge className={`${cfg.color} text-xs`}>
              {isExpired ? "Expirada" : cfg.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-lg font-bold">
            R$ {offer.offer_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-muted-foreground">(-{discount}%)</span>
        </div>

        {/* Expiration timer for pending offers */}
        {offer.status === "pending" && !isExpired && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Expira em {hoursLeft}h {minutesLeft}min</span>
          </div>
        )}

        {offer.message && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">{offer.message}</p>
        )}

        {offer.counter_price && (
          <div className="p-2 bg-primary/5 border border-primary/20 rounded">
            <p className="text-xs text-muted-foreground">Contra-proposta:</p>
            <p className="font-bold text-sm">
              R$ {offer.counter_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {offer.counter_message && <p className="text-xs mt-1">{offer.counter_message}</p>}
          </div>
        )}

        {/* Timeline button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 px-2 h-6"
          onClick={() => setTimelineOfferId(timelineOfferId === offer.id ? null : offer.id)}
        >
          <History className="h-3 w-3" />
          {timelineOfferId === offer.id ? "Ocultar histórico" : "Ver histórico"}
        </Button>

        {timelineOfferId === offer.id && (
          <NegotiationTimeline offerId={offer.id} />
        )}

        {/* Actions for pending offers */}
        {offer.status === "pending" && !isExpired && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="text-xs gap-1 btn-gold"
              onClick={() => handleRespond(offer.id, "accept")}
              disabled={isResponding}
            >
              <Check className="h-3 w-3" /> Aceitar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs gap-1"
              onClick={() => handleRespond(offer.id, "reject")}
              disabled={isResponding}
            >
              <X className="h-3 w-3" /> Recusar
            </Button>
            {counterOfferId === offer.id ? (
              <div className="space-y-2 w-full mt-1">
                <Input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Seu preço"
                  className="h-8 text-sm"
                />
                <Textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Mensagem (opcional)"
                  rows={2}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => handleRespond(offer.id, "counter")}
                  disabled={isResponding || !counterPrice}
                >
                  Enviar contra-proposta
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                onClick={() => setCounterOfferId(offer.id)}
              >
                <ArrowRightLeft className="h-3 w-3" /> Contra-proposta
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs relative">
          <HandCoins className="h-3 w-3" />
          Ofertas
          {pendingOffers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
              {pendingOffers.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Ofertas: {listingTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma oferta recebida</p>
          ) : (
            <>
              {/* Bundle groups */}
              {Array.from(bundleGroups.entries()).map(([bundleId, bundleOffers]) => (
                <div key={bundleId} className="border border-primary/30 rounded-lg p-3 space-y-2 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary text-xs">📦 Bundle ({bundleOffers.length} itens)</Badge>
                    {bundleOffers[0]?.bundle_discount_percent ? (
                      <span className="text-xs text-primary font-medium">
                        -{bundleOffers[0].bundle_discount_percent}% desconto
                      </span>
                    ) : null}
                  </div>
                  {bundleOffers.map(renderOffer)}
                </div>
              ))}
              {/* Standalone offers */}
              {standaloneOffers.map(renderOffer)}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}