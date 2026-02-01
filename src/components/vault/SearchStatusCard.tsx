import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Clock, CheckCircle2, AlertCircle, ArrowRight, Sparkles,
  Search, Eye, MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

interface SearchStatusCardProps {
  search: SearchItem;
  index: number;
}

const searchStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  RECEIVED: { label: "Recebida", color: "text-blue-400", bgColor: "bg-blue-500/10", icon: Clock },
  IN_CURATION: { label: "Em curadoria", color: "text-amber-400", bgColor: "bg-amber-500/10", icon: Search },
  OPTIONS_IDENTIFIED: { label: "Opções encontradas", color: "text-purple-400", bgColor: "bg-purple-500/10", icon: Eye },
  VALIDATING: { label: "Validando", color: "text-cyan-400", bgColor: "bg-cyan-500/10", icon: Search },
  MATCH_SENT: { label: "Match enviado", color: "text-emerald-400", bgColor: "bg-emerald-500/10", icon: Sparkles },
  AWAITING_DECISION: { label: "Aguardando decisão", color: "text-orange-400", bgColor: "bg-orange-500/10", icon: AlertCircle },
  CLOSED_APPROVED: { label: "Aprovada", color: "text-green-400", bgColor: "bg-green-500/10", icon: CheckCircle2 },
  CLOSED_NOT_FOUND: { label: "Não encontrado", color: "text-zinc-400", bgColor: "bg-zinc-500/10", icon: AlertCircle },
  CLOSED_CANCELLED: { label: "Cancelada", color: "text-red-400", bgColor: "bg-red-500/10", icon: AlertCircle },
};

export function SearchStatusCard({ search, index }: SearchStatusCardProps) {
  const statusInfo = searchStatusConfig[search.status] || searchStatusConfig.RECEIVED;
  const StatusIcon = statusInfo.icon;

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
              </div>
              
              <h3 className="font-semibold truncate mb-1">{search.wishlist_title}</h3>
              
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
                  <Link to={`/vault/app/match/${search.match_room_id}`}>
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

          {/* Progress indicator for active searches */}
          {search.is_active && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Progresso da busca</span>
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${statusInfo.bgColor.replace('/10', '')}`}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: search.status === "RECEIVED" ? "15%" :
                           search.status === "IN_CURATION" ? "40%" :
                           search.status === "OPTIONS_IDENTIFIED" ? "60%" :
                           search.status === "VALIDATING" ? "75%" :
                           search.status === "MATCH_SENT" ? "90%" :
                           search.status === "AWAITING_DECISION" ? "95%" : "100%"
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
