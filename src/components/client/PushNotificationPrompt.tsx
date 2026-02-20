import { useState } from "react";
import { Bell, BellRing, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface PushNotificationPromptProps {
  onDismiss?: () => void;
  variant?: "banner" | "card";
  className?: string;
}

export function PushNotificationPrompt({ 
  onDismiss, 
  variant = "card",
  className 
}: PushNotificationPromptProps) {
  const { isSupported, permission, isLoading, requestPermission } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === "granted" || permission === "denied" || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      handleDismiss();
    }
  };

  if (variant === "banner") {
    return (
      <div className={cn(
        "bg-primary/10 border border-primary/30 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <BellRing className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Ativar Notificações</p>
              <p className="text-xs text-muted-foreground">
                Receba alertas sobre seus pedidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              Depois
            </Button>
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="btn-gold"
            >
              {isLoading ? "..." : "Ativar"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-primary/30 bg-primary/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-5 w-5 text-primary" />
            Notificações
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Ative as notificações para receber alertas instantâneos sobre pedidos, drops exclusivos e alertas de preço
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>Alertas de status em tempo real</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>🔥 Novos drops e lançamentos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>💰 Alertas de queda de preço</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>💬 Mensagens do chat</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>📦 Atualizações de entrega</span>
          </div>
          <Button
            className="w-full btn-gold mt-4"
            onClick={handleEnable}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Ativando...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Ativar Notificações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
