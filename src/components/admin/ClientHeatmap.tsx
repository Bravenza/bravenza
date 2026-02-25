import { useEffect, useState } from "react";
import { typedRpc, type AdminClientHeatmapRow } from "@/integrations/supabase/typed-rpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StateData {
  state: string;
  count: number;
  revenue: number;
}

const BRAZIL_STATES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

function getHeatColor(ratio: number): string {
  if (ratio >= 0.8) return "bg-primary text-primary-foreground";
  if (ratio >= 0.5) return "bg-primary/70 text-primary-foreground";
  if (ratio >= 0.3) return "bg-primary/40 text-foreground";
  if (ratio >= 0.1) return "bg-primary/20 text-foreground";
  return "bg-primary/10 text-foreground";
}

export function ClientHeatmap() {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalClients, setTotalClients] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await typedRpc<AdminClientHeatmapRow[]>("get_admin_client_heatmap");
        if (error) throw error;

        const result: StateData[] = (data || []).map((row) => ({
          state: row.state_code,
          count: Number(row.client_count),
          revenue: Number(row.revenue),
        }));

        const total = result.reduce((sum, s) => sum + s.count, 0);
        setTotalClients(total);
        setStateData(result);
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="card-premium">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-64" /></CardContent>
      </Card>
    );
  }

  const maxCount = stateData.length > 0 ? stateData[0].count : 1;

  const formatCurrencyLocal = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Mapa de Calor — Clientes por Estado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stateData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Dados geográficos insuficientes. Adicione endereços aos pedidos para visualizar.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Estados Ativos</p>
                <p className="text-xl font-bold">{stateData.length}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-xl font-bold">{totalClients}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Top Estado</p>
                <p className="text-xl font-bold">{stateData[0]?.state || "-"}</p>
              </div>
            </div>

            {/* State grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
              {Object.keys(BRAZIL_STATES).map((code) => {
                const data = stateData.find((s) => s.state === code);
                const ratio = data ? data.count / maxCount : 0;
                return (
                  <motion.div
                    key={code}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.random() * 0.3 }}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all cursor-default group",
                      data ? getHeatColor(ratio) : "bg-muted/30 text-muted-foreground"
                    )}
                    title={`${BRAZIL_STATES[code]}: ${data?.count || 0} clientes`}
                  >
                    <span className="text-sm font-bold">{code}</span>
                    <span className="text-[10px]">{data?.count || 0}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Top states bar chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Top Estados por Clientes</h4>
              {stateData.slice(0, 8).map((s, i) => (
                <motion.div
                  key={s.state}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-8 text-sm font-bold text-right">{s.state}</span>
                  <div className="flex-1 h-7 bg-muted/30 rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full bg-primary/80 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / maxCount) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      {s.count} clientes · {formatCurrencyLocal(s.revenue)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Intensidade:</span>
              <div className="flex gap-1">
                {[10, 20, 40, 70, 100].map((pct) => (
                  <div key={pct} className={cn("w-6 h-4 rounded", getHeatColor(pct / 100))} />
                ))}
              </div>
              <span>Menor → Maior</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
