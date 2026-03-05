import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanCPF, validateCPF, formatCPF } from "@/lib/constants";

export const TrackingForm = () => {
  const [orderId, setOrderId] = useState("");
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = cleanCPF(value);
    if (cleaned.length <= 11) {
      setCpf(formatCPF(cleaned));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId.trim()) {
      toast({
        title: "Código do pedido obrigatório",
        description: "Por favor, insira o código do seu pedido.",
        variant: "destructive",
      });
      return;
    }

    const cleanedCPF = cleanCPF(cpf);
    if (!validateCPF(cleanedCPF)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("track_order", {
        p_order_id: orderId.trim().toUpperCase(),
        p_cpf: cleanedCPF,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Pedido não encontrado",
          description:
            "Verifique se o código do pedido e CPF estão corretos.",
          variant: "destructive",
        });
        return;
      }

      // Navigate to tracking page with order data
      navigate(`/rastreio/${orderId.trim().toUpperCase()}`, {
        state: { cpf: cleanedCPF },
      });
    } catch (error) {
      console.error("Error tracking order:", error);
      toast({
        title: "Erro ao buscar pedido",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="orderId" className="text-foreground/80">
          Código do Pedido
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="orderId"
            type="text"
            placeholder="Ex: BV-260126-014"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
            className="pl-10 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary/30 uppercase"
            autoFocus
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf" className="text-foreground/80">
          CPF
        </Label>
        <Input
          id="cpf"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={handleCPFChange}
          className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 btn-gold text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            Rastrear Pedido
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
};
