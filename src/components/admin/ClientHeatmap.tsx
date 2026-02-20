import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users } from "lucide-react";
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

function extractState(address: string | null): string | null {
  if (!address) return null;
  // Try to find a 2-letter state code
  const parts = address.split(/[,\-\s]+/).map((p) => p.trim().toUpperCase());
  for (const part of parts.reverse()) {
    if (BRAZIL_STATES[part]) return part;
  }
  // Try to find state name
  const upperAddress = address.toUpperCase();
  for (const [code, name] of Object.entries(BRAZIL_STATES)) {
    if (upperAddress.includes(name.toUpperCase())) return code;
  }
  return null;
}

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
        // Fetch orders with address and price
        const { data: orders } = await supabase
          .from("orders")
          .select("client_address, client_cpf, product_price, sinal_paid, balance_paid")
          .not("client_address", "is", null);

        if (!orders) { setIsLoading(false); return; }

        // Also fetch order_requests for more geographic data
        const { data: requests } = await supabase
          .from("order_requests")
          .select("address_state, client_cpf");

        const stateMap: Record<string, { clients: Set<string>; revenue: number }> = {};

        // Process orders
        orders.forEach((o) => {
          const state = extractState(o.client_address);
          if (!state) return;
          if (!stateMap[state]) stateMap[state] = { clients: new Set(), revenue: 0 };
          stateMap[state].clients.add(o.client_cpf);
          if (o.sinal_paid || o.balance_paid) stateMap[state].revenue += o.product_price || 0;
        });

        // Process order requests
        (requests || []).forEach((r) => {
          const state = r.address_state?.toUpperCase()?.trim();
          if (!state || !BRAZIL_STATES[state]) return;
          if (!stateMap[state]) stateMap[state] = { clients: new Set(), revenue: 0 };
          stateMap[state].clients.add(r.client_cpf);
        });

        const result: StateData[] = Object.entries(stateMap)
          .map(([state, data]) => ({
            state,
            count: data.clients.size,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.count - a.count);

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

  const formatCurrency = (value: number) =>
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
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Estados Ativos</p>
                <p className="text-2xl font-bold">{stateData.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">Top Estado</p>
                <p className="text-2xl font-bold">{stateData[0]?.state || "-"}</p>
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
                      {s.count} clientes · {formatCurrency(s.revenue)}
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
                  <div
                    key={pct}
                    className={cn(
                      "w-6 h-4 rounded",
                      getHeatColor(pct / 100)
                    )}
                  />
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
