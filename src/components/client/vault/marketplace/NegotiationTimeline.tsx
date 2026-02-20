import { useEffect, useState } from "react";
import { Clock, ArrowRightLeft, Check, X, HandCoins, MessageCircle } from "lucide-react";
import { marketplaceRequest } from "@/hooks/marketplace/api";

interface NegotiationEvent {
  id: string;
  event_type: string;
  actor_name: string | null;
  price: number | null;
  message: string | null;
  created_at: string;
}

const eventConfig: Record<string, { label: string; icon: any; color: string }> = {
  offer_made: { label: "Oferta enviada", icon: HandCoins, color: "text-primary" },
  counter_sent: { label: "Contra-proposta", icon: ArrowRightLeft, color: "text-warning" },
  counter_accepted: { label: "Contra-proposta aceita", icon: Check, color: "text-success" },
  accepted: { label: "Oferta aceita", icon: Check, color: "text-success" },
  rejected: { label: "Recusada", icon: X, color: "text-destructive" },
  expired: { label: "Expirada", icon: Clock, color: "text-muted-foreground" },
  message: { label: "Mensagem", icon: MessageCircle, color: "text-foreground" },
};

export function NegotiationTimeline({ offerId }: { offerId: string }) {
  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await marketplaceRequest("", "negotiation-timeline", "GET", undefined, { offer_id: offerId });
        setEvents(data.events || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [offerId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground py-2">Carregando histórico...</p>;
  }

  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">Nenhum evento registrado</p>;
  }

  return (
    <div className="relative pl-4 space-y-3 py-2">
      <div className="absolute left-1.5 top-3 bottom-3 w-px bg-border" />
      {events.map((event) => {
        const cfg = eventConfig[event.event_type] || eventConfig.message;
        const Icon = cfg.icon;
        return (
          <div key={event.id} className="relative flex gap-2">
            <div className={`absolute -left-2.5 w-4 h-4 rounded-full bg-background border-2 border-current flex items-center justify-center ${cfg.color}`}>
              <Icon className="h-2 w-2" />
            </div>
            <div className="ml-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(event.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {event.actor_name && (
                <p className="text-[11px] text-muted-foreground">{event.actor_name}</p>
              )}
              {event.price && (
                <p className="text-sm font-bold">
                  R$ {event.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
              {event.message && (
                <p className="text-[11px] text-muted-foreground mt-0.5">"{event.message}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}