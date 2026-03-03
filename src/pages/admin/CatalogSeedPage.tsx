import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Database, CheckCircle2, AlertTriangle, XCircle, Play, Square } from "lucide-react";

interface BrandResult {
  brand: string;
  status: "pending" | "running" | "done" | "error";
  fetched?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  translated?: number;
  error?: string;
}

export default function CatalogSeedPage() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [connectorStatus, setConnectorStatus] = useState<"unknown" | "on" | "off">("unknown");

  const [seeding, setSeeding] = useState(false);
  const [brandResults, setBrandResults] = useState<BrandResult[]>([]);
  const [currentBrand, setCurrentBrand] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const cancelRef = useRef(false);

  const callApi = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada");

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-seed-500`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    return res.json();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await callApi({ mode: "test" });
      setTestResult(data);
      setConnectorStatus(data.ok ? "on" : "off");
      toast({ title: data.ok ? "Conexão OK ✓" : "Conexão falhou", variant: data.ok ? "default" : "destructive" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleSeed = async () => {
    cancelRef.current = false;
    setSeeding(true);
    setBrandResults([]);
    setOverallProgress(0);

    try {
      // Get brands list
      const listData = await callApi({ mode: "brands_list" });
      if (!listData.ok) throw new Error("Não foi possível obter lista de marcas");

      const brands: { name: string; quota: number }[] = listData.brands;
      const initial: BrandResult[] = brands.map((b) => ({ brand: b.name, status: "pending" as const }));
      setBrandResults(initial);

      for (let i = 0; i < brands.length; i++) {
        if (cancelRef.current) {
          toast({ title: "Seed cancelado pelo usuário" });
          break;
        }

        const brand = brands[i];
        setCurrentBrand(brand.name);
        setBrandResults((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r))
        );

        try {
          const result = await callApi({ mode: "seed_brand", brand: brand.name });

          setBrandResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: result.ok ? "done" : "error",
                    fetched: result.fetched,
                    inserted: result.inserted,
                    updated: result.updated,
                    skipped: result.skipped,
                    translated: result.translated,
                    error: result.error,
                  }
                : r
            )
          );
        } catch (e: any) {
          setBrandResults((prev) =>
            prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: e.message } : r))
          );
        }

        setOverallProgress(Math.round(((i + 1) / brands.length) * 100));

        // Small delay between brands
        if (i < brands.length - 1 && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!cancelRef.current) {
        toast({ title: "Seed concluído! ✓" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSeeding(false);
      setCurrentBrand(null);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const totals = brandResults.reduce(
    (acc, r) => ({
      fetched: acc.fetched + (r.fetched || 0),
      inserted: acc.inserted + (r.inserted || 0),
      updated: acc.updated + (r.updated || 0),
      translated: acc.translated + (r.translated || 0),
    }),
    { fetched: 0, inserted: 0, updated: 0, translated: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo Oficial — Seed v1</h1>
        <p className="text-muted-foreground">
          Gere ~500 modelos de sneakers automaticamente via Sneaker Database - StockX (RapidAPI).
        </p>
      </div>

      {/* Connector Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Conector StockX (RapidAPI)
          </CardTitle>
          <CardDescription>Verifique se a RAPIDAPI_KEY está configurada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status:</span>
            {connectorStatus === "unknown" && <Badge variant="outline">Não verificado</Badge>}
            {connectorStatus === "on" && (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />Conectado
              </Badge>
            )}
            {connectorStatus === "off" && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />Desconectado
              </Badge>
            )}
          </div>
          <Button onClick={handleTest} disabled={testing} variant="outline">
            {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Testar conexão StockX
          </Button>
          {testResult && (
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Seed Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerar ~500 Modelos (v1)
          </CardTitle>
          <CardDescription>
            Importa marca por marca com progresso em tempo real. Cada marca é processada individualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">
              Processa uma marca por vez (~30s cada). Total: ~5 minutos.
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSeed}
              disabled={seeding || connectorStatus === "off"}
              size="lg"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {seeding ? "Importando..." : "Iniciar Seed"}
            </Button>
            {seeding && (
              <Button onClick={handleCancel} variant="destructive" size="lg">
                <Square className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>

          {/* Progress */}
          {brandResults.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentBrand ? `Processando: ${currentBrand}` : "Concluído"}</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Coletados" value={totals.fetched} />
                <StatCard label="Inseridos" value={totals.inserted} />
                <StatCard label="Atualizados" value={totals.updated} />
                <StatCard label="Traduzidos" value={totals.translated} />
              </div>

              {/* Per-brand results */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Por marca:</p>
                <div className="grid gap-2">
                  {brandResults.map((r) => (
                    <div
                      key={r.brand}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {r.status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                        {r.status === "running" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                        {r.status === "done" && <CheckCircle2 className="h-3 w-3 text-success" />}
                        {r.status === "error" && <XCircle className="h-3 w-3 text-destructive" />}
                        <span className="font-medium">{r.brand}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {r.status === "done" && (
                          <>
                            <span>{r.fetched} coletados</span>
                            <span>{r.inserted} novos</span>
                            <span>{r.translated} traduzidos</span>
                          </>
                        )}
                        {r.status === "error" && (
                          <span className="text-destructive">{r.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value ?? 0}</p>
    </div>
  );
}
