import { Helmet } from "react-helmet-async";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AppContext {
  cpf: string | null;
  profile: { full_name?: string; cpf?: string } | null;
}

export default function AppMessagesPage() {
  const { cpf } = useOutletContext<AppContext>();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["client-messages", cpf],
    queryFn: async () => {
      if (!cpf) return [];
      const { data, error } = await supabase
        .from("marketplace_negotiation_events")
        .select("*")
        .eq("actor_cpf", cpf)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!cpf,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Helmet>
        <title>Mensagens | BRAVENZA</title>
      </Helmet>
      <h1 className="text-xl font-bold mb-6">Mensagens</h1>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : !messages?.length ? (
        <div className="text-center py-16">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma mensagem</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Negociações e mensagens de vendedores aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{msg.actor_name || "Usuário"}</p>
                <p className="text-[10px] text-muted-foreground/60 shrink-0">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {msg.message || `${msg.event_type}${msg.price ? ` · R$ ${msg.price.toFixed(2)}` : ""}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
