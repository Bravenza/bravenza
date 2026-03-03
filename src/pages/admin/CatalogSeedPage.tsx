import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, Database, CheckCircle2, AlertTriangle, XCircle, Play, Square, Sparkles, Eye, Globe, Search, RefreshCw, ArrowRightLeft } from "lucide-react";

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

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichPreview, setEnrichPreview] = useState<any>(null);
  const [enrichResult, setEnrichResult] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  // Multi-source state
  const [msSource, setMsSource] = useState("goat");
  const [msQuery, setMsQuery] = useState("");
  const [msPage, setMsPage] = useState(1);
  const [msSearching, setMsSearching] = useState(false);
  const [msSearchResult, setMsSearchResult] = useState<any>(null);
  const [msEnriching, setMsEnriching] = useState(false);
  const [msEnrichResult, setMsEnrichResult] = useState<any>(null);
  const [msTesting, setMsTesting] = useState(false);
  const [msTestResult, setMsTestResult] = useState<any>(null);

  const SOURCES = [
    { id: "goat", name: "GOAT" },
    { id: "flightclub", name: "FlightClub" },
    { id: "stadiumgoods", name: "StadiumGoods" },
    { id: "kickscrew", name: "KicksCrew" },
  ];

  // Sync state
  const [syncPreview, setSyncPreview] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const callSyncApi = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada");
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-sync`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.json();
  };

  const handleSyncPreview = async () => {
    setSyncPreview(null);
    try {
      const data = await callSyncApi({ mode: "preview" });
      setSyncPreview(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(0);
    cancelRef.current = false;
    let totalSynced = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let offset = 0;
    const batchSize = 100;

    try {
      while (!cancelRef.current) {
        const data = await callSyncApi({ mode: "sync", batch_size: batchSize, offset });
        if (!data.ok) {
          toast({ title: "Erro no sync", description: data.error, variant: "destructive" });
          break;
        }
        totalSynced += data.synced || 0;
        totalSkipped += data.skipped || 0;
        totalErrors += data.errors || 0;
        offset = data.next_offset;
        setSyncProgress(Math.round((offset / (syncPreview?.total_sneaker_models || 1011)) * 100));
        setSyncResult({ synced: totalSynced, skipped: totalSkipped, errors: totalErrors });

        if (!data.has_more) {
          toast({ title: `✓ Sync completo: ${totalSynced} produtos sincronizados` });
          break;
        }
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const callApi = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-seed-500`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      return res.json();
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === "AbortError") {
        return { ok: false, error: "Timeout: a marca demorou demais. Tente novamente." };
      }
      throw e;
    }
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
          let queryIndex = 0;
          let brandInserted = 0;
          let brandTranslated = 0;
          let brandFetched = 0;

          // Loop batches for this brand until done or no more
          while (true) {
            if (cancelRef.current) break;
            const result = await callApi({ mode: "seed_brand", brand: brand.name, query_index: queryIndex });

            if (!result.ok) {
              setBrandResults((prev) =>
                prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: result.error } : r))
              );
              break;
            }

            brandInserted += result.inserted || 0;
            brandTranslated += result.translated || 0;
            brandFetched += result.fetched || 0;

            setBrandResults((prev) =>
              prev.map((r, idx) =>
                idx === i
                  ? { ...r, status: "running", fetched: brandFetched, inserted: brandInserted, translated: brandTranslated, updated: result.updated || 0 }
                  : r
              )
            );

            if (!result.has_more || result.fetched === 0) {
              setBrandResults((prev) =>
                prev.map((r, idx) =>
                  idx === i ? { ...r, status: "done" } : r
                )
              );
              break;
            }

            queryIndex = result.next_query_index || queryIndex + 1;
            await new Promise((r) => setTimeout(r, 500));
          }
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

  const callEnrichApi = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-descriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      return res.json();
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === "AbortError") {
        return { ok: false, error: "Timeout: demorou demais." };
      }
      throw e;
    }
  };

  const handleEnrichPreview = async () => {
    setPreviewing(true);
    setEnrichPreview(null);
    try {
      const data = await callEnrichApi({ mode: "preview" });
      setEnrichPreview(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichResult(null);
    cancelRef.current = false;
    let totalEnriched = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let round = 0;
    const MAX_ROUNDS = 20; // Safety limit to prevent infinite loops

    try {
      while (!cancelRef.current && round < MAX_ROUNDS) {
        round++;
        const data = await callEnrichApi({ mode: "enrich" });
        
        if (!data.ok) {
          toast({ title: "Erro no enriquecimento", description: data.error, variant: "destructive" });
          break;
        }

        totalEnriched += data.enriched || 0;
        totalErrors += data.errors || 0;
        totalSkipped += data.skipped || 0;

        setEnrichResult({
          ok: true,
          enriched: totalEnriched,
          errors: totalErrors,
          skipped: totalSkipped,
          remaining: data.remaining || 0,
          message: `${totalEnriched} descrições enriquecidas (rodada ${round}/${MAX_ROUNDS})`,
        });

        // Stop if no more candidates or no progress this round
        if (!data.has_more || data.enriched === 0) {
          toast({ title: `✓ ${totalEnriched} descrições enriquecidas no total` });
          break;
        }

        // Small delay between rounds
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (round >= MAX_ROUNDS) {
        toast({ title: `Limite de ${MAX_ROUNDS} rodadas atingido. ${totalEnriched} descrições enriquecidas.` });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setEnriching(false);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  // ─── Multi-source helpers ──────────────────────────────────
  const callMultisourceApi = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada");
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-multisource`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return res.json();
  };

  const handleMsTest = async () => {
    setMsTesting(true);
    setMsTestResult(null);
    try {
      const data = await callMultisourceApi({ mode: "test", source: msSource });
      setMsTestResult(data);
      toast({ title: data.ok ? `${msSource} OK ✓` : `${msSource} falhou`, description: data.error || undefined, variant: data.ok ? "default" : "destructive" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setMsTesting(false);
    }
  };

  const handleMsTestAll = async () => {
    setMsTesting(true);
    setMsTestResult(null);
    try {
      const data = await callMultisourceApi({ mode: "test_all" });
      setMsTestResult(data);
      const working = (data.results || []).filter((r: any) => r.ok).length;
      const total = (data.results || []).length;
      toast({ title: `${working}/${total} fontes operacionais`, variant: working > 0 ? "default" : "destructive" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setMsTesting(false);
    }
  };

  const handleMsSearch = async () => {
    if (!msQuery.trim()) return;
    setMsSearching(true);
    setMsSearchResult(null);
    try {
      const data = await callMultisourceApi({ mode: "search", source: msSource, query: msQuery, page: msPage, limit: 30 });
      setMsSearchResult(data);
      if (data.ok) {
        toast({ title: `${data.inserted || 0} novos inseridos de ${data.source}` });
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setMsSearching(false);
    }
  };

  const handleMsEnrich = async () => {
    setMsEnriching(true);
    setMsEnrichResult(null);
    try {
      const data = await callMultisourceApi({ mode: "enrich", source: msSource, limit: 20 });
      setMsEnrichResult(data);
      if (data.ok) {
        toast({ title: `${data.enriched || 0} modelos enriquecidos via ${data.source}` });
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setMsEnriching(false);
    }
  };

  // Discover state
  const [msEndpoint, setMsEndpoint] = useState("");
  const [msParam, setMsParam] = useState("");
  const [msDiscovering, setMsDiscovering] = useState(false);
  const [msDiscoverResult, setMsDiscoverResult] = useState<any>(null);

  const EXTRA_ENDPOINTS: Record<string, { id: string; label: string; needsParam?: boolean; paramLabel?: string }[]> = {
    stadiumgoods: [
      { id: "sg_collections", label: "Listar Coleções" },
      { id: "sg_collection_products", label: "Produtos de Coleção", needsParam: true, paramLabel: "Handle (ex: yeezy-380)" },
      { id: "sg_similar", label: "Similares", needsParam: true, paramLabel: "Product ID" },
    ],
    flightclub: [
      { id: "fc_brands", label: "Marcas disponíveis" },
      { id: "fc_releases", label: "Novos lançamentos" },
      { id: "fc_recommendation", label: "Recomendações", needsParam: true, paramLabel: "ID do produto" },
    ],
    goat: [
      { id: "goat_recommended", label: "Similares", needsParam: true, paramLabel: "Product ID (ex: 1213732)" },
    ],
    kickscrew: [],
  };

  const handleMsDiscover = async () => {
    if (!msEndpoint) return;
    setMsDiscovering(true);
    setMsDiscoverResult(null);
    try {
      const data = await callMultisourceApi({ mode: "discover", source: msSource, endpoint: msEndpoint, param: msParam || undefined, limit: 30 });
      setMsDiscoverResult(data);
      toast({ title: data.ok ? `${data.inserted ?? data.raw_count ?? 0} itens processados` : "Erro", description: data.error, variant: data.ok ? "default" : "destructive" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setMsDiscovering(false);
    }
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

      {/* Sync Catalog → Marketplace */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Sincronizar Catálogo → Marketplace
          </CardTitle>
          <CardDescription>
            Publica os modelos do catálogo oficial (sneaker_models) como produtos visíveis no marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleSyncPreview} variant="outline" disabled={syncing}>
              <Eye className="h-4 w-4 mr-2" />
              Ver pendentes
            </Button>
            <Button onClick={handleSync} disabled={syncing || !syncPreview || syncPreview.estimated_to_sync === 0}>
              {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
              {syncing ? "Sincronizando..." : "Sincronizar agora"}
            </Button>
            {syncing && (
              <Button onClick={handleCancel} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            )}
          </div>

          {syncPreview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="No Catálogo" value={syncPreview.total_sneaker_models} />
              <StatCard label="No Marketplace" value={syncPreview.total_marketplace_products} />
              <StatCard label="SKUs já sync" value={syncPreview.existing_skus_in_marketplace} />
              <StatCard label="A sincronizar" value={syncPreview.estimated_to_sync} />
            </div>
          )}

          {syncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-3" />
            </div>
          )}

          {syncResult && !syncing && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">✓ Sync concluído</p>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Sincronizados" value={syncResult.synced} />
                <StatCard label="Já existiam" value={syncResult.skipped} />
                <StatCard label="Erros" value={syncResult.errors} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Description Enrichment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Enriquecimento de descrições
          </CardTitle>
          <CardDescription>
            Reescreve descrições fracas ou genéricas com tom editorial usando IA. Processa até 20 modelos por execução.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleEnrichPreview} disabled={previewing || enriching} variant="outline">
              {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Ver candidatos
            </Button>
            <Button onClick={handleEnrich} disabled={enriching || previewing}>
              {enriching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {enriching ? "Enriquecendo..." : "Enriquecer descrições"}
            </Button>
          </div>

          {enrichPreview && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {enrichPreview.total_weak} modelos com descrições fracas encontrados
              </p>
              {enrichPreview.samples?.map((s: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                  <p className="font-medium">{s.name} ({s.sku})</p>
                  <p className="text-muted-foreground italic">
                    {s.current_desc ? `"${s.current_desc.slice(0, 120)}..."` : "Sem descrição"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {enrichResult && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Resultado:</p>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Enriquecidos" value={enrichResult.enriched} />
                <StatCard label="Pulados" value={enrichResult.skipped} />
                <StatCard label="Erros" value={enrichResult.errors} />
              </div>
              {enrichResult.message && (
                <p className="text-xs text-muted-foreground mt-2">{enrichResult.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Source Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Importação Multi-Source
          </CardTitle>
          <CardDescription>
            Busque novos SKUs e enriqueça modelos existentes via GOAT, FlightClub, StadiumGoods e KicksCrew.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium whitespace-nowrap">Fonte:</span>
            <Select value={msSource} onValueChange={setMsSource}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleMsTest} disabled={msTesting}>
              {msTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              <span className="ml-1">Testar fonte</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleMsTestAll} disabled={msTesting}>
              {msTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              <span className="ml-1">Testar todas</span>
            </Button>
          </div>

          {msTestResult && (
            <div className="space-y-2">
              {msTestResult.results ? (
                <div className="grid gap-2">
                  {msTestResult.results.map((r: any) => (
                    <div key={r.source} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <div className="flex items-center gap-2">
                        {r.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        <span className="font-medium">{r.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {r.ok ? `OK (${r.status})` : r.error}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48">
                  {JSON.stringify(msTestResult, null, 2)}
                </pre>
              )}
            </div>
          )}

          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center gap-1">
                <Search className="h-3.5 w-3.5" />Buscar Novos
              </TabsTrigger>
              <TabsTrigger value="enrich" className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />Enriquecer
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />Descobrir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-3 pt-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Jordan 1, Yeezy 350, Nike Dunk..."
                  value={msQuery}
                  onChange={(e) => setMsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMsSearch()}
                />
                <Input
                  type="number"
                  className="w-20"
                  placeholder="Pág"
                  value={msPage}
                  onChange={(e) => setMsPage(Number(e.target.value) || 1)}
                  min={1}
                />
                <Button onClick={handleMsSearch} disabled={msSearching || !msQuery.trim()}>
                  {msSearching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  Buscar
                </Button>
              </div>

              {msSearchResult && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Resultado — {msSearchResult.source}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Encontrados" value={msSearchResult.fetched || 0} />
                    <StatCard label="Inseridos" value={msSearchResult.inserted || 0} />
                    <StatCard label="Já existiam" value={msSearchResult.skipped_existing || 0} />
                    <StatCard label="Erros" value={msSearchResult.errors || 0} />
                  </div>
                  {msSearchResult.error && <p className="text-xs text-destructive">{msSearchResult.error}</p>}
                </div>
              )}
            </TabsContent>

            <TabsContent value="enrich" className="space-y-3 pt-3">
              <p className="text-sm text-muted-foreground">
                Busca descrições/imagens de modelos com placeholder ou sem descrição via detalhes da fonte.
              </p>
              <Button onClick={handleMsEnrich} disabled={msEnriching}>
                {msEnriching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Enriquecer via {SOURCES.find(s => s.id === msSource)?.name}
              </Button>

              {msEnrichResult && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Resultado — {msEnrichResult.source}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Processados" value={msEnrichResult.processed || 0} />
                    <StatCard label="Enriquecidos" value={msEnrichResult.enriched || 0} />
                    <StatCard label="Sem dados" value={msEnrichResult.no_data || 0} />
                    <StatCard label="Erros" value={msEnrichResult.errors || 0} />
                  </div>
                  {msEnrichResult.error && <p className="text-xs text-destructive">{msEnrichResult.error}</p>}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-3 pt-3">
              {(EXTRA_ENDPOINTS[msSource] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum endpoint extra disponível para {SOURCES.find(s => s.id === msSource)?.name}.</p>
              ) : (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={msEndpoint} onValueChange={(v) => { setMsEndpoint(v); setMsDiscoverResult(null); }}>
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Selecione endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {(EXTRA_ENDPOINTS[msSource] || []).map((ep) => (
                          <SelectItem key={ep.id} value={ep.id}>{ep.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(EXTRA_ENDPOINTS[msSource] || []).find(e => e.id === msEndpoint)?.needsParam && (
                      <Input
                        className="w-56"
                        placeholder={(EXTRA_ENDPOINTS[msSource] || []).find(e => e.id === msEndpoint)?.paramLabel || "Parâmetro"}
                        value={msParam}
                        onChange={(e) => setMsParam(e.target.value)}
                      />
                    )}

                    <Button onClick={handleMsDiscover} disabled={msDiscovering || !msEndpoint}>
                      {msDiscovering ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
                      Executar
                    </Button>
                  </div>

                  {msDiscoverResult && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-sm font-medium">
                        {msDiscoverResult.endpoint} — {msDiscoverResult.source}
                      </p>
                      {msDiscoverResult.data ? (
                        <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                          {JSON.stringify(msDiscoverResult.data?.slice(0, 20), null, 2)}
                        </pre>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <StatCard label="Encontrados" value={msDiscoverResult.fetched || 0} />
                          <StatCard label="Inseridos" value={msDiscoverResult.inserted || 0} />
                          <StatCard label="Já existiam" value={msDiscoverResult.skipped_existing || 0} />
                          <StatCard label="Erros" value={msDiscoverResult.errors || 0} />
                        </div>
                      )}
                      {msDiscoverResult.error && <p className="text-xs text-destructive">{msDiscoverResult.error}</p>}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
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
