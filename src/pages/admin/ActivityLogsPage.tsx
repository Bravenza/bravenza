import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Activity,
  User,
  Package,
  CreditCard,
  FileText,
  Shield,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: unknown;
  ip_address: string | null;
  created_at: string;
  user_email?: string;
}

const ENTITY_ICONS: Record<string, any> = {
  order: Package,
  payment: CreditCard,
  budget: FileText,
  user: User,
  system: Shield,
};

const ENTITY_COLORS: Record<string, string> = {
  order: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  payment: "bg-green-500/20 text-green-400 border-green-500/30",
  budget: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  user: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  system: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [admins, setAdmins] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    supabase
      .from("admin_profiles")
      .select("user_id, full_name, email")
      .order("full_name")
      .then(({ data }) => { if (data) setAdmins(data); });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, adminFilter, page]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      if (adminFilter !== "all") {
        query = query.eq("user_id", adminFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const logsData = data || [];

      // Batch fetch user emails - collect unique user_ids
      const userIds = [...new Set(logsData.filter(l => l.user_id).map(l => l.user_id!))];
      let emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);

        if (profiles) {
          emailMap = Object.fromEntries(profiles.map(p => [p.user_id, p.email || ""]));
        }
      }

      const logsWithUsers = logsData.map(log => ({
        ...log,
        user_email: log.user_id ? emailMap[log.user_id] : undefined,
      }));

      if (page === 0) {
        setLogs(logsWithUsers);
      } else {
        setLogs((prev) => [...prev, ...logsWithUsers]);
      }

      setHasMore(logsData.length === pageSize);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    setIsLoading(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity_id?.toLowerCase().includes(search) ||
      log.user_email?.toLowerCase().includes(search)
    );
  });

  if (isLoading && page === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Log de Atividades</h1>
          <p className="text-muted-foreground">
            Histórico de ações realizadas no sistema
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, ação, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="order">Pedidos</SelectItem>
                <SelectItem value="payment">Pagamentos</SelectItem>
                <SelectItem value="budget">Orçamentos</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
            <Select value={adminFilter} onValueChange={(v) => { setAdminFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Admin responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os admins</SelectItem>
                {admins.map((a) => (
                  <SelectItem key={a.user_id} value={a.user_id}>
                    {a.full_name} — {a.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="card-premium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>ID Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const Icon = ENTITY_ICONS[log.entity_type] || Activity;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={ENTITY_COLORS[log.entity_type] || ENTITY_COLORS.system}>
                          <Icon className="h-3 w-3 mr-1" />
                          {log.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.action}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {log.user_email ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            <span className={`truncate max-w-[150px] ${adminFilter !== "all" && log.user_id === adminFilter ? "font-bold" : ""}`}>{log.user_email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.entity_id ? (
                          <code className="text-xs bg-secondary px-2 py-1 rounded">
                            {log.entity_id}
                          </code>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {hasMore && filteredLogs.length > 0 && (
            <div className="p-4 text-center">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
              >
                {isLoading ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
