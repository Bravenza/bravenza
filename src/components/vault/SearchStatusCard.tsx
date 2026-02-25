import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Clock, CheckCircle2, AlertCircle, ArrowRight, Sparkles,
  Search, Eye, MessageSquare, Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchItem {
  search_id: string;
  wishlist_title: string;
  status: string;
  is_active: boolean;
  started_at: string;
  last_update_at: string;
  has_match_room: boolean;
  match_room_id: string | null;
  decision_status: string | null;
  progress_message?: string | null;
  progress_percentage?: number | null;
  decline_count?: number | null;
}

interface SearchStatusCardProps {
  search: SearchItem;
  index: number;
}

const searchStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock; description: string }> = {
  RECEIVED: { label: "Recebida", color: "text-blue-400", bgColor: "bg-blue-500/10", icon: Clock, description: "Seu pedido foi recebido pela equipe de curadoria" },
  IN_CURATION: { label: "Em curadoria", color: "text-amber-400", bgColor: "bg-amber-500/10", icon: Search, description: "Nossa equipe está pesquisando fornecedores e opções" },
  OPTIONS_IDENTIFIED: { label: "Opções encontradas", color: "text-purple-400", bgColor: "bg-purple-500/10", icon: Eye, description: "Fornecedores contatados, cotações em andamento" },
  VALIDATING: { label: "Validando", color: "text-cyan-400", bgColor: "bg-cyan-500/10", icon: Search, description: "Verificando autenticidade e condições das opções" },
  MATCH_SENT: { label: "Match enviado", color: "text-emerald-400", bgColor: "bg-emerald-500/10", icon: Sparkles, description: "Opções prontas para sua decisão!" },
  AWAITING_DECISION: { label: "Aguardando decisão", color: "text-orange-400", bgColor: "bg-orange-500/10", icon: AlertCircle, description: "Confira as opções e tome sua decisão" },
  CLOSED_APPROVED: { label: "Aprovada", color: "text-green-400", bgColor: "bg-green-500/10", icon: CheckCircle2, description: "Busca concluída com sucesso" },
  CLOSED_NOT_FOUND: { label: "Não encontrado", color: "text-zinc-400", bgColor: "bg-zinc-500/10", icon: AlertCircle, description: "Infelizmente não encontramos o produto" },
  CLOSED_CANCELLED: { label: "Cancelada", color: "text-red-400", bgColor: "bg-red-500/10", icon: AlertCircle, description: "Busca cancelada" },
};

const getProgressPercentage = (status: string, customPercentage?: number | null): number => {
  if (customPercentage && customPercentage > 0) return customPercentage;
  const defaults: Record<string, number> = {
    RECEIVED: 10,
    IN_CURATION: 35,
    OPTIONS_IDENTIFIED: 55,
    VALIDATING: 70,
    MATCH_SENT: 85,
    AWAITING_DECISION: 90,
    CLOSED_APPROVED: 100,
    CLOSED_NOT_FOUND: 100,
    CLOSED_CANCELLED: 100,
  };
  return defaults[status] || 0;
};

export function SearchStatusCard({ search, index }: SearchStatusCardProps) {
  const statusInfo = searchStatusConfig[search.status] || searchStatusConfig.RECEIVED;
  const StatusIcon = statusInfo.icon;
  const progress = getProgressPercentage(search.status, search.progress_percentage);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d atrás`;
    if (diffHours > 0) return `${diffHours}h atrás`;
    return "Agora";
  };

  const showMatchRoomButton = search.has_match_room && search.match_room_id && 
    (search.status === "MATCH_SENT" || search.status === "AWAITING_DECISION" || search.decision_status === "PENDING");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                {(search.decline_count ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                    Re-busca #{search.decline_count}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold truncate mb-1">{search.wishlist_title}</h3>
              
              {/* Progress message from admin */}
              {search.progress_message && (
                <p className="text-xs text-zinc-400 mb-2 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                  {search.progress_message}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Iniciada: {formatRelativeTime(search.started_at)}</span>
                <span>Atualizada: {formatRelativeTime(search.last_update_at)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {showMatchRoomButton && (
                <Button
                  asChild
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Link to={`/app/vault`}>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Ver opções
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
              
              {search.status === "IN_CURATION" && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Search className="h-3 w-3 animate-pulse" />
                  Buscando...
                </div>
              )}
            </div>
          </div>

          {/* Progress bar with status description */}
          {search.is_active && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Progresso da busca</span>
                        <span className={statusInfo.color}>{progress}%</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{statusInfo.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
