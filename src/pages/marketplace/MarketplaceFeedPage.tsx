import { useOutletContext } from "react-router-dom";
import { Activity, TrendingUp, Tag, ShoppingBag, Star, Package, Flame, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mkv2-discover`;
const PAGE_SIZE = 30;

interface FeedEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  listing_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const eventConfig: Record<string, { icon: typeof Activity; color: string; bgColor: string; label: string }> = {
  new_listing: { icon: Tag, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Novo anúncio" },
  sale: { icon: ShoppingBag, color: "text-green-500", bgColor: "bg-green-500/10", label: "Venda realizada" },
  price_drop: { icon: TrendingUp, color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Queda de preço" },
  review: { icon: Star, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Nova avaliação" },
  shipped: { icon: Package, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Envio realizado" },
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function MarketplaceFeedPage() {
  const context = useOutletContext<{ cpf?: string; profile?: any }>();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const headersRef = useRef<Record<string, string> | null>(null);

  const getHeaders = useCallback(async () => {
    if (headersRef.current) return headersRef.current;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    headersRef.current = headers;
    return headers;
  }, []);

  const fetchFeed = useCallback(async (beforeId?: string) => {
    const loading = beforeId ? setIsLoadingMore : setIsLoading;
    loading(true);
    try {
      const headers = await getHeaders();
      let url = `${FUNCTION_URL}?action=activity-feed&limit=${PAGE_SIZE}`;
      if (beforeId) url += `&before_id=${beforeId}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      const newEvents: FeedEvent[] = data.events || [];
      setHasMore(data.has_more ?? false);
      if (beforeId) {
        setEvents((prev) => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }
    } catch (err) {
      console.error("Fetch feed error:", err);
    } finally {
      loading(false);
    }
  }, [getHeaders]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // Realtime subscription for new events
  useEffect(() => {
    const channel = supabase
      .channel("marketplace-feed-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "marketplace_activity_feed" },
        (payload) => {
          setEvents((prev) => [payload.new as FeedEvent, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLoadMore = () => {
    const lastEvent = events[events.length - 1];
    if (lastEvent) fetchFeed(lastEvent.id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display">Feed</h1>
          <p className="text-sm text-muted-foreground">Atividade em tempo real do marketplace</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Carregando feed...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl bg-card/50 border border-border/20 p-12 text-center">
          <Flame className="h-14 w-14 mx-auto text-muted-foreground/15 mb-4" />
          <h3 className="font-semibold text-lg mb-1">Nenhuma atividade ainda</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            As atividades do marketplace aparecerão aqui em tempo real: novos anúncios, vendas, quedas de preço e mais.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((ev, i) => {
              const config = eventConfig[ev.event_type] || { icon: Activity, color: "text-muted-foreground", bgColor: "bg-muted/50", label: ev.event_type };
              const Icon = config.icon;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.02, duration: 0.3 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/60 border border-border/20 hover:border-primary/20 transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto whitespace-nowrap">
                        {timeAgo(ev.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {hasMore && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mais"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
