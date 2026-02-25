import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShoppingBag, Tag, Star, TrendingDown, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover`;

interface FeedEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  listing_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface ActivityFeedProps {
  clientCpf: string;
}

const eventConfig: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  new_listing: { icon: Tag, color: "text-blue-500", label: "Novo anúncio" },
  sale: { icon: ShoppingBag, color: "text-green-500", label: "Venda" },
  price_drop: { icon: TrendingDown, color: "text-orange-500", label: "Queda de preço" },
  review: { icon: Star, color: "text-yellow-500", label: "Avaliação" },
  shipped: { icon: Package, color: "text-purple-500", label: "Envio" },
};

export function ActivityFeed({ clientCpf }: ActivityFeedProps) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("marketplace-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "marketplace_activity_feed" },
        (payload) => {
          setEvents((prev) => [payload.new as FeedEvent, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const res = await fetch(`${FUNCTION_URL}?action=activity-feed&limit=30`, { headers });
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Fetch feed error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card className="card-premium">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividade do marketplace
          {events.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {events.length} evento{events.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma atividade recente.
          </p>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {events.map((ev, i) => {
                const config = eventConfig[ev.event_type] || { icon: Activity, color: "text-muted-foreground", label: ev.event_type };
                const Icon = config.icon;
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-2.5 py-2 border-b border-border/20 last:border-0"
                  >
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ev.title}</p>
                      {ev.description && (
                        <p className="text-[10px] text-muted-foreground truncate">{ev.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {timeAgo(ev.created_at)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
