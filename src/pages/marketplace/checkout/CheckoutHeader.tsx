import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export function CheckoutHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/20 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 flex items-center h-14 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full shrink-0"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/app")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">Checkout</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3 text-primary" />
          <span className="hidden sm:inline">Ambiente seguro</span>
        </div>
      </div>
    </header>
  );
}
