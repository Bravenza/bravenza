import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Database, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function CatalogSeedPage() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [connectorStatus, setConnectorStatus] = useState<"unknown" | "on" | "off">("unknown");

  const callSeed = async (mode: "test" | "seed") => {
    const isTest = mode === "test";
    isTest ? setTesting(true) : setSeeding(true);
    isTest ? setTestResult(null) : setSeedResult(null);

    try {
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
          body: JSON.stringify({ mode }),
        }
      );

      const data = await res.json();

      if (isTest) {
        setTestResult(data);
        setConnectorStatus(data.ok ? "on" : "off");
        toast({ title: data.ok ? "Conexão OK ✓" : "Conexão falhou", variant: data.ok ? "default" : "destructive" });
      } else {
        setSeedResult(data);
        toast({ title: data.ok ? "Seed concluído!" : "Erro no seed", variant: data.ok ? "default" : "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      isTest ? setTesting(false) : setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo Oficial — Seed v1</h1>
        <p className="text-muted-foreground">Gere ~500 modelos de sneakers automaticamente via Sneaker Database - StockX (RapidAPI).</p>
      </div>

      {/* Connector Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Conector StockX (RapidAPI)
          </CardTitle>
          <CardDescription>Verifique se a RAPIDAPI_KEY está configurada nas secrets do projeto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status:</span>
            {connectorStatus === "unknown" && <Badge variant="outline">Não verificado</Badge>}
            {connectorStatus === "on" && <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</Badge>}
            {connectorStatus === "off" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>}
          </div>
          <Button onClick={() => callSeed("test")} disabled={testing} variant="outline">
            {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Testar conexão TSDB
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
            Gerar 500 Modelos (v1)
          </CardTitle>
          <CardDescription>Importa modelos da TSDB com upsert idempotente, imagens e tradução automática.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">A operação pode levar alguns minutos. Não feche esta página.</span>
          </div>
          <Button onClick={() => callSeed("seed")} disabled={seeding || connectorStatus === "off"} size="lg">
            {seeding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {seeding ? "Importando..." : "Gerar 500 modelos (v1)"}
          </Button>

          {seedResult && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                {seedResult.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-semibold">{seedResult.ok ? "Seed concluído com sucesso!" : "Erro no seed"}</span>
              </div>

              {seedResult.ok && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Inseridos" value={seedResult.inserted_count} />
                  <StatCard label="Atualizados" value={seedResult.updated_count} />
                  <StatCard label="Duplicados" value={seedResult.duplicates_skipped} />
                  <StatCard label="Sem imagem" value={seedResult.missing_image_count} />
                  <StatCard label="Sem MSRP" value={seedResult.missing_msrp_count} />
                  <StatCard label="Sem data" value={seedResult.missing_release_date_count} />
                  <StatCard label="Sem silhueta" value={seedResult.missing_silhouette_count} />
                  <StatCard label="Traduzidos" value={seedResult.translation_translated_count} />
                </div>
              )}

              {seedResult.per_brand_counts && (
                <div>
                  <p className="text-sm font-medium mb-2">Por marca:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(seedResult.per_brand_counts).map(([brand, count]) => (
                      <Badge key={brand} variant="secondary">{brand}: {count as number}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-60">
                {JSON.stringify(seedResult, null, 2)}
              </pre>
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
