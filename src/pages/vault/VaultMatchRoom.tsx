import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle,
  MapPin, DollarSign, Shield, ThumbsUp, AlertTriangle, Image, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClientSession } from "@/hooks/useClientSession";

interface MatchOption {
  id: string;
  option_title: string;
  region: string | null;
  condition: string | null;
  price_estimate: number;
  currency: string;
  pros: string | null;
  risks: string | null;
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

export default function VaultMatchRoom() {
  const { matchRoomId } = useParams();
  const { profile, isLoading: sessionLoading, user } = useClientSession();
  const cpf = profile?.cpf;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [matchRoom, setMatchRoom] = useState<MatchRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !user) {
      navigate("/entrar");
    }
  }, [sessionLoading, user, navigate]);

  useEffect(() => {
    if (cpf && matchRoomId) {
      fetchMatchRoom();
    }
  }, [cpf, matchRoomId]);

  const fetchMatchRoom = async () => {
    if (!cpf || !matchRoomId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_match_room", { 
          p_cpf: cpf, 
          p_match_room_id: matchRoomId 
        });
      
      if (!error && data && data.length > 0) {
        const room = data[0];
        setMatchRoom({
          ...room,
          options: typeof room.options === 'string' ? JSON.parse(room.options) : room.options,
        } as unknown as MatchRoomData);
      }
    } catch (error) {
      console.error("Error fetching match room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOption) {
      toast({
        title: "Selecione uma opção",
        description: "Escolha a opção que deseja aprovar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .rpc("approve_vault_match", { 
          p_cpf: cpf, 
          p_match_room_id: matchRoomId 
        });
      
      if (error) throw error;

      toast({
        title: "Match aprovado!",
        description: "Nossa equipe iniciará o processo de compra",
      });

      navigate("/minha-conta?tab=wishlist");
    } catch (error) {
      console.error("Error approving match:", error);
      toast({
        title: "Erro ao aprovar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowApproveDialog(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da recusa",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .rpc("decline_vault_match", { 
          p_cpf: cpf, 
          p_match_room_id: matchRoomId,
          p_reason: declineReason,
        });
      
      if (error) throw error;

      toast({
        title: "Match recusado",
        description: "A busca voltará para curadoria",
      });

      navigate("/minha-conta?tab=wishlist");
    } catch (error) {
      console.error("Error declining match:", error);
      toast({
        title: "Erro ao recusar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeclineDialog(false);
    }
  };

  const formatCurrency = (value: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  };

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Expirado";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)} dias`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!matchRoom) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Match room não encontrada</h2>
        <Button asChild variant="outline">
           <Link to="/minha-conta?tab=wishlist">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  const isExpired = matchRoom.decision_deadline_at && new Date(matchRoom.decision_deadline_at) < new Date();
  const isPending = matchRoom.decision_status === "PENDING" && !isExpired;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/minha-conta?tab=wishlist">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Match Room</h1>
          <p className="text-zinc-400 text-sm">{matchRoom.wishlist_title}</p>
        </div>
      </div>

      {/* Status & Deadline */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {matchRoom.decision_status === "APPROVED" && (
                <Badge className="bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprovado
                </Badge>
              )}
              {matchRoom.decision_status === "DECLINED" && (
                <Badge className="bg-red-500/10 text-red-400">
                  <XCircle className="h-3 w-3 mr-1" />
                  Recusado
                </Badge>
              )}
              {isExpired && (
                <Badge className="bg-zinc-500/10 text-zinc-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Expirado
                </Badge>
              )}
              {isPending && (
                <Badge className="bg-amber-500/10 text-amber-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Aguardando decisão
                </Badge>
              )}
            </div>
            
            {matchRoom.decision_deadline_at && isPending && (
              <div className="text-right">
                <p className="text-xs text-zinc-500">Tempo restante</p>
                <p className="font-mono text-amber-400">
                  {getTimeRemaining(matchRoom.decision_deadline_at)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Opções encontradas</h2>
        
        {matchRoom.options.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`bg-zinc-900 border-zinc-800 transition cursor-pointer ${
                selectedOption === option.id 
                  ? "border-amber-500 ring-2 ring-amber-500/20" 
                  : "hover:border-zinc-700"
              } ${!isPending ? "pointer-events-none opacity-70" : ""}`}
              onClick={() => isPending && setSelectedOption(option.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{option.option_title}</h3>
                    {option.region && (
                      <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {option.region}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">
                      {formatCurrency(option.price_estimate, option.currency)}
                    </p>
                    {option.condition && (
                      <Badge variant="outline" className="border-zinc-700 text-xs mt-1">
                        {option.condition}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Pros & Risks */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {option.pros && (
                    <div className="bg-emerald-500/5 rounded-lg p-3">
                      <p className="text-xs text-emerald-400 font-medium mb-1 flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Pontos positivos
                      </p>
                      <p className="text-sm text-zinc-300">{option.pros}</p>
                    </div>
                  )}
                  {option.risks && (
                    <div className="bg-amber-500/5 rounded-lg p-3">
                      <p className="text-xs text-amber-400 font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Riscos
                      </p>
                      <p className="text-sm text-zinc-300">{option.risks}</p>
                    </div>
                  )}
                </div>

                {/* Evidence */}
                {option.evidence_urls && option.evidence_urls.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Evidências anexadas</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {option.evidence_urls.map((url, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(url);
                          }}
                          className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-amber-500 transition"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection indicator */}
                {isPending && (
                  <div className="flex items-center justify-center mt-4 pt-4 border-t border-zinc-800">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      selectedOption === option.id 
                        ? "border-amber-500 bg-amber-500" 
                        : "border-zinc-600"
                    }`}>
                      {selectedOption === option.id && (
                        <CheckCircle2 className="h-3 w-3 text-black" />
                      )}
                    </div>
                    <span className="ml-2 text-sm text-zinc-400">
                      {selectedOption === option.id ? "Selecionada" : "Selecionar esta opção"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="flex gap-4 sticky bottom-20 md:bottom-0 bg-black/95 backdrop-blur py-4">
          <Button
            variant="outline"
            onClick={() => setShowDeclineDialog(true)}
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Recusar
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            disabled={!selectedOption}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aprovar
          </Button>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Confirmar aprovação</DialogTitle>
            <DialogDescription>
              Ao aprovar, nossa equipe iniciará o processo de compra da opção selecionada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aprovando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Recusar opções</DialogTitle>
            <DialogDescription>
              A busca voltará para curadoria. Por favor, informe o motivo da recusa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              placeholder="Ex: Preço acima do esperado, condição não ideal..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recusando...
                </>
              ) : (
                "Recusar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl p-0">
          {imagePreview && (
            <img src={imagePreview} alt="" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}