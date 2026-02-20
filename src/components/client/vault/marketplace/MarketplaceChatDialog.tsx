import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  sender_cpf: string;
  sender_name: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  read_at: string | null;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mk-hub`;

interface MarketplaceChatDialogProps {
  orderId?: string;
  orderCode?: string;
  listingId?: string;
  listingTitle?: string;
  clientCpf: string;
  clientName: string;
  trigger?: React.ReactNode;
}

export function MarketplaceChatDialog({
  orderId,
  orderCode,
  listingId,
  listingTitle,
  clientCpf,
  clientName,
  trigger,
}: MarketplaceChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatContext = orderId || listingId || "";
  const chatLabel = orderCode || listingTitle || "Chat";
  const isPrePurchase = !orderId && !!listingId;

  const fetchMessages = async () => {
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const params = new URLSearchParams({ action: "chat-messages" });
      if (orderId) params.set("order_id", orderId);
      if (listingId) params.set("listing_id", listingId);
      const res = await fetch(`${FUNCTION_URL}?${params}`, { headers });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open]);

  // Realtime subscription
  useEffect(() => {
    if (!open) return;

    const filter = orderId
      ? `order_id=eq.${orderId}`
      : `listing_id=eq.${listingId}`;

    const channel = supabase
      .channel(`marketplace-chat-${chatContext}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vault_marketplace_messages",
          filter,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, chatContext]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const { getMarketplaceHeaders } = await import("@/hooks/marketplace/api");
      const headers = await getMarketplaceHeaders();
      const body: Record<string, string> = {
        sender_name: clientName,
        message: newMsg.trim(),
      };
      if (orderId) body.order_id = orderId;
      if (listingId) body.listing_id = listingId;

      const res = await fetch(`${FUNCTION_URL}?action=send-message`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewMsg("");
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <MessageCircle className="h-3 w-3" />
            {isPrePurchase ? "Perguntar" : "Chat"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            {isPrePurchase ? "Perguntar ao Vendedor" : `Chat - ${chatLabel}`}
          </DialogTitle>
          {isPrePurchase && (
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[10px]">
                <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                Mediado pela Bravenza
              </Badge>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isPrePurchase
                    ? "Faça uma pergunta ao vendedor sobre este produto"
                    : "Nenhuma mensagem ainda. Inicie a conversa!"}
                </p>
                {isPrePurchase && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Dica: pergunte sobre condição, defeitos ou disponibilidade
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_cpf === clientCpf;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex flex-col max-w-[80%]", isOwn ? "ml-auto items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : msg.is_admin
                          ? "bg-warning/20 text-foreground rounded-bl-sm"
                          : "bg-muted rounded-bl-sm"
                      )}
                    >
                      {!isOwn && (
                        <p className="text-[10px] font-medium mb-0.5 opacity-70">
                          {msg.is_admin ? "Bravenza" : msg.sender_name}
                        </p>
                      )}
                      <p className="whitespace-pre-line">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder={isPrePurchase ? "Sua pergunta..." : "Digite sua mensagem..."}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !newMsg.trim()} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
