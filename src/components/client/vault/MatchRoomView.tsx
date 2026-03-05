import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, DollarSign, AlertTriangle, CheckCircle2, 
  ThumbsUp, ThumbsDown, Clock, ExternalLink, Image as ImageIcon,
  Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MatchOption {
  id: string;
  option_title: string;
  region: string;
  condition: string;
  price_estimate: number;
  currency: string;
  pros: string;
  risks: string;
  evidence_urls: string[];
}

interface MatchRoomData {
  id: string;
  search_id: string;
  wishlist_title: string;
  decision_deadline_at: string | null;
  decision_status: "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED";
  options: MatchOption[];
  created_at: string;
}

interface MatchRoomViewProps {
  clientCpf: string;
  matchRoomId: string;
  onDecisionMade: () => void;
}

const REJECTION_CATEGORIES = [
  { value: "price_high", label: "Preço acima do esperado" },
  { value: "wrong_condition", label: "Condição diferente do desejado" },
  { value: "wrong_color", label: "Cor/colorway diferente" },
  { value: "wrong_size", label: "Tamanho indisponível" },
  { value: "supplier_trust", label: "Não confio no fornecedor" },
  { value: "found_elsewhere", label: "Encontrei em outro lugar" },
  { value: "other", label: "Outro motivo" },
];

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diffMs = end.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        expired: false,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
        <Timer className="h-4 w-4" />
        Tempo expirado
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 2;
  const colorClass = isUrgent ? "text-destructive" : "text-amber-500";

  return (
    <div className={`flex items-center gap-2 font-mono text-sm font-semibold ${colorClass}`}>
      <Timer className={`h-4 w-4 ${isUrgent ? "animate-pulse" : ""}`} />
      <span>
        {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
      </span>
      <span className="text-xs font-normal opacity-70">restantes</span>
    </div>
  );
}

export function MatchRoomView({ clientCpf, matchRoomId, onDecisionMade }: MatchRoomViewProps) {
  const { toast } = useToast();
  
  const [matchRoom, setMatchRoom] = useState<MatchRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeciding, setIsDeciding] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineCategory, setDeclineCategory] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchRoom();
  }, [matchRoomId]);

  const fetchMatchRoom = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_match_room", { 
          p_cpf: clientCpf, 
          p_match_room_id: matchRoomId 
        });
      
      if (!error && data && data.length > 0) {
        const room = data[0] as any;
        setMatchRoom({
          ...room,
          options: room.options || [],
        });
      }
    } catch (error) {
      console.error("Error fetching match room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsDeciding(true);
    try {
      const { error } = await supabase
        .rpc("approve_vault_match", {
          p_cpf: clientCpf,
          p_match_room_id: matchRoomId,
        });

      if (error) throw error;

      toast({
        title: "Match aprovado!",
        description: "Entraremos em contato para dar continuidade",
      });

      onDecisionMade();
    } catch (error) {
      console.error("Error approving match:", error);
      toast({
        title: "Erro ao aprovar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsDeciding(false);
    }
  };

  const handleDecline = async () => {
    if (!declineCategory) {
      toast({ title: "Selecione um motivo", variant: "destructive" });
      return;
    }
    setIsDeciding(true);
    try {
      const { error } = await supabase
        .rpc("decline_vault_match", {
          p_cpf: clientCpf,
          p_match_room_id: matchRoomId,
          p_reason: declineReason || null,
        });

      if (error) throw error;

      // Save rejection category separately  
      await supabase
        .from("vault_match_rooms")
        .update({ 
          rejection_category: declineCategory,
          rejection_reason: declineReason || REJECTION_CATEGORIES.find(c => c.value === declineCategory)?.label || null,
        })
        .eq("id", matchRoomId);

      toast({
        title: "Match recusado",
        description: "Continuaremos buscando opções melhores com base no seu feedback",
      });

      setShowDeclineDialog(false);
      onDecisionMade();
    } catch (error) {
      console.error("Error declining match:", error);
      toast({
        title: "Erro ao recusar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsDeciding(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!matchRoom) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Match Room não encontrada</p>
      </div>
    );
  }

  const isPending = matchRoom.decision_status === "PENDING";

  return (
    <div className="space-y-4">
      {/* Header with Countdown */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">{matchRoom.wishlist_title}</h3>
              <p className="text-sm text-muted-foreground">
                {matchRoom.options.length} {matchRoom.options.length === 1 ? "opção encontrada" : "opções encontradas"}
              </p>
            </div>
            {matchRoom.decision_status === "APPROVED" && (
              <Badge className="bg-green-500/20 text-green-500 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Aprovado
              </Badge>
            )}
          </div>
          
          {/* Live Countdown */}
          {isPending && matchRoom.decision_deadline_at && (
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tempo para decidir</span>
                <CountdownTimer deadline={matchRoom.decision_deadline_at} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {matchRoom.options.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition ${
                selectedOption === option.id 
                  ? "border-primary ring-1 ring-primary" 
                  : "hover:border-muted-foreground/50"
              }`}
              onClick={() => isPending && setSelectedOption(option.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="font-medium">{option.option_title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {option.region || "Internacional"}
                      <span>•</span>
                      <span>{option.condition || "DS"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(option.price_estimate, option.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">estimado</p>
                  </div>
                </div>

                {/* Pros & Risks */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {option.pros && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                        Pontos positivos
                      </p>
                      <p className="text-green-500/90">{option.pros}</p>
                    </div>
                  )}
                  {option.risks && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Atenção
                      </p>
                      <p className="text-amber-500/90">{option.risks}</p>
                    </div>
                  )}
                </div>

                {/* Evidence Images */}
                {option.evidence_urls && option.evidence_urls.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {option.evidence_urls.slice(0, 3).map((url, i) => (
                      <Dialog key={i}>
                        <DialogTrigger asChild>
                          <button className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <img src={url} alt="" className="w-full rounded-lg" />
                        </DialogContent>
                      </Dialog>
                    ))}
                    {option.evidence_urls.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                        +{option.evidence_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Decision Buttons */}
      {isPending && (
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isDeciding}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            {isDeciding ? "Processando..." : "Aprovar"}
          </Button>
          
          <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <ThumbsDown className="h-4 w-4 mr-2" />
                Recusar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recusar match</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Seu feedback nos ajuda a encontrar a opção perfeita. A busca será reaberta automaticamente.
                </p>
                
                <div className="space-y-2">
                  <Label className="font-medium">Qual o principal motivo? *</Label>
                  <RadioGroup value={declineCategory} onValueChange={setDeclineCategory} className="space-y-2">
                    {REJECTION_CATEGORIES.map((cat) => (
                      <div key={cat.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={cat.value} id={cat.value} />
                        <Label htmlFor={cat.value} className="font-normal cursor-pointer">{cat.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Detalhes adicionais (opcional)</Label>
                  <Textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Nos ajude a entender o que procurar..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowDeclineDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDecline}
                  disabled={isDeciding || !declineCategory}
                >
                  {isDeciding ? "Recusando..." : "Confirmar recusa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Ao aprovar, nossa equipe entrará em contato para finalizar a compra
      </p>
    </div>
  );
}
