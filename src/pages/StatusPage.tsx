import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency_ms: number | null;
  detail?: string;
}

interface HealthResponse {
  overall: "operational" | "degraded" | "down";
  services: ServiceStatus[];
  checked_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
  database: "Banco de Dados",
  auth: "Autenticação",
  storage: "Armazenamento",
  stripe: "Stripe (Pagamentos)",
  mercadopago: "MercadoPago (Pagamentos)",
  superfrete: "SuperFrete (Logística)",
};

const STATUS_CONFIG = {
  operational: {
    label: "Operacional",
    variant: "success" as const,
    icon: CheckCircle2,
    color: "text-success",
  },
  degraded: {
    label: "Degradado",
    variant: "warning" as const,
    icon: AlertTriangle,
    color: "text-warning",
  },
  down: {
    label: "Fora do ar",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-destructive",
  },
};

export default function StatusPage() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useQuery<HealthResponse>({
      queryKey: ["health-check"],
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke("health-check");
        if (error) throw error;
        return data as HealthResponse;
      },
      staleTime: 30_000,
      refetchInterval: 60_000,
    });

  const overallCfg = data ? STATUS_CONFIG[data.overall] : null;

  return (
    <PublicLayout>
      <Helmet>
        <title>Status dos Serviços | Bravenza</title>
        <meta name="description" content="Verifique o status em tempo real dos serviços da Bravenza." />
      </Helmet>

      <div className="container max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Status dos Serviços</h1>
          </div>

          {isLoading ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : overallCfg ? (
            <div className="flex items-center justify-center gap-2">
              <overallCfg.icon className={`h-5 w-5 ${overallCfg.color}`} />
              <span className={`text-lg font-semibold ${overallCfg.color}`}>
                {data?.overall === "operational"
                  ? "Todos os sistemas operacionais"
                  : data?.overall === "degraded"
                  ? "Alguns serviços com instabilidade"
                  : "Interrupção detectada"}
              </span>
            </div>
          ) : null}

          {isError && (
            <p className="text-sm text-destructive">Erro ao verificar status.</p>
          )}
        </div>

        {/* Refresh */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {dataUpdatedAt
              ? `Última verificação: ${new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")}`
              : "—"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Verificar agora
          </Button>
        </div>

        {/* Services */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Serviços</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/40">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))
              : data?.services.map((svc) => {
                  const cfg = STATUS_CONFIG[svc.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={svc.name} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <span className="text-sm font-medium text-foreground">
                          {SERVICE_LABELS[svc.name] ?? svc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {svc.latency_ms != null && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {svc.latency_ms}ms
                          </span>
                        )}
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Esta página é atualizada automaticamente a cada 60 segundos.
        </p>
      </div>
    </PublicLayout>
  );
}
