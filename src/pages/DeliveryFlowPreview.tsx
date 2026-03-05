import { useState } from "react";
import { logger } from "@/lib/logger";
import { DeliveryConfirmationFlow } from "@/components/client/vault/marketplace/DeliveryConfirmationFlow";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function DeliveryFlowPreview() {
  const [showFlow, setShowFlow] = useState(true);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-xl font-bold">Preview: Fluxo de Confirmação de Entrega</h1>
        <p className="text-sm text-muted-foreground">
          Clique no botão abaixo para abrir o modal com todas as etapas.
        </p>
        {!showFlow && (
          <Button onClick={() => setShowFlow(true)} className="btn-gold">
            Abrir fluxo novamente
          </Button>
        )}
      </div>

      {showFlow && (
        <DeliveryConfirmationFlow
          orderId="preview-123"
          orderCode="BVZ-2024-1847"
          productName="Nike Air Jordan 1 Retro High OG 'Chicago'"
          productImage="https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=200&h=200&fit=crop"
          sellerName="SneakerKing_BR"
          productSize="42 BR"
          productCondition="Novo com caixa"
          onConfirmDelivery={async () => {
            await new Promise((r) => setTimeout(r, 800));
            return true;
          }}
          onSubmitReview={async (data) => {
            console.log("Review submitted:", data);
            await new Promise((r) => setTimeout(r, 800));
            return true;
          }}
          onReportProblem={async (data) => {
            console.log("Problem reported:", data);
            await new Promise((r) => setTimeout(r, 800));
            return true;
          }}
          onClose={() => setShowFlow(false)}
          onContactSupport={() => alert("Suporte via WhatsApp")}
        />
      )}
    </div>
  );
}
