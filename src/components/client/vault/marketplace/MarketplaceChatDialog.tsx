import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
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
  orderId: string;
  orderCode: string;
  clientCpf: string;
  clientName: string;
  trigger?: React.ReactNode;
}

export function MarketplaceChatDialog({
  orderId,
  orderCode,
  clientCpf,
  clientName,
  trigger,
}: MarketplaceChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({ action: "chat-messages", order_id: orderId });
      const res = await fetch(`${FUNCTION_URL}?${params}`, {
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": clientCpf,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
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

    const channel = supabase
      .channel(`marketplace-chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vault_marketplace_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, orderId]);

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
      const res = await fetch(`${FUNCTION_URL}?action=send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-cpf": clientCpf,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          order_id: orderId,
          sender_name: clientName,
          message: newMsg.trim(),
        }),
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
            Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base">Chat - {orderCode}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma mensagem ainda. Inicie a conversa!
              </p>
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
                          {msg.is_admin ? "Admin" : msg.sender_name}
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
            placeholder="Digite sua mensagem..."
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
