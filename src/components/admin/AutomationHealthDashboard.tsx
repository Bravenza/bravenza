import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CronLog {
  id: string;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  result: Record<string, unknown> | null;
}

interface JobHealth {
  job_name: string;
  display_name: string;
  schedule: string;
  last_run: CronLog | null;
  recent_errors: number;
}

const JOB_CONFIG: Record<string, { display: string; schedule: string }> = {
  "mk-notifications": { display: "Notificações Marketplace", schedule: "A cada hora" },
  "mk-auto-payout": { display: "Auto-Payout", schedule: "A cada hora" },
  "mk-cron-tasks": { display: "Manutenção (Expirar/Preços)", schedule: "A cada 6 horas" },
  "mk-releases": { display: "Releases de Sneakers", schedule: "Diário (6h)" },
  "vault-sla-monitor": { display: "Monitor SLA Vault", schedule: "A cada 6 horas" },
  "vault-tier-check": { display: "Verificação de Tier", schedule: "Diário (3h)" },
  "vault-semester-reset": { display: "Reset Semestral", schedule: "Diário (4h)" },
  "process-reminders": { display: "Lembretes de Pagamento", schedule: "A cada hora" },
};

export function AutomationHealthDashboard() {
  const [jobs, setJobs] = useState<JobHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200) as { data: CronLog[] | null; error: unknown };

      if (error) throw error;

      const jobMap = new Map<string, CronLog[]>();
      for (const log of logs || []) {
        const existing = jobMap.get(log.job_name) || [];
        existing.push(log);
        jobMap.set(log.job_name, existing);
      }

      const healthList: JobHealth[] = Object.entries(JOB_CONFIG).map(
        ([name, config]) => {
          const jobLogs = jobMap.get(name) || [];
          const last24h = jobLogs.filter(
            (l) =>
              new Date(l.started_at).getTime() >
              Date.now() - 24 * 60 * 60 * 1000
          );
          return {
            job_name: name,
            display_name: config.display,
            schedule: config.schedule,
            last_run: jobLogs[0] || null,
            recent_errors: last24h.filter((l) => l.status === "error").length,
          };
        }
      );

      setJobs(healthList);
    } catch (err) {
      console.error("Error fetching automation health:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHealth();
  };

  const handleManualRun = async (jobName: string) => {
    toast.info(`Executando ${JOB_CONFIG[jobName]?.display || jobName}...`);
    try {
      const { error } = await supabase.functions.invoke(jobName);
      if (error) throw error;
      toast.success("Execução concluída!");
      setTimeout(fetchHealth, 2000);
    } catch (err) {
      toast.error("Erro ao executar: " + (err instanceof Error ? err.message : "desconhecido"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  const healthyCount = jobs.filter(
    (j) => j.last_run?.status === "success"
  ).length;
  const errorCount = jobs.filter((j) => j.recent_errors > 0).length;
  const neverRun = jobs.filter((j) => !j.last_run).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>{healthyCount} saudáveis</span>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-destructive" />
              <span>{errorCount} com erros (24h)</span>
            </div>
          )}
          {neverRun > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{neverRun} nunca executados</span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <Card key={job.job_name} className="card-premium">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {job.display_name}
                </CardTitle>
                <StatusBadge status={job.last_run?.status} errors={job.recent_errors} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Agenda: {job.schedule}</span>
                {job.last_run?.duration_ms && (
                  <span>{job.last_run.duration_ms}ms</span>
                )}
              </div>

              {job.last_run ? (
                <div className="text-xs">
                  <span className="text-muted-foreground">Última execução: </span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(job.last_run.started_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  {job.last_run.error_message && (
                    <p className="text-destructive mt-1 truncate">
                      {job.last_run.error_message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Ainda não foi executado
                </p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleManualRun(job.job_name)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Executar agora
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, errors }: { status?: string; errors: number }) {
  if (errors > 0) {
    return (
      <Badge variant="destructive" className="text-xs">
        {errors} erro(s) 24h
      </Badge>
    );
  }
  if (!status) {
    return (
      <Badge variant="secondary" className="text-xs">
        Pendente
      </Badge>
    );
  }
  if (status === "success") {
    return (
      <Badge className="bg-success/20 text-success border-success/30 text-xs">
        Saudável
      </Badge>
    );
  }
  if (status === "running") {
    return (
      <Badge variant="outline" className="text-xs animate-pulse">
        Executando
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs">
      Erro
    </Badge>
  );
}
