import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, isErrorWithName } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, Zap, Database, CheckCircle2, AlertTriangle, XCircle, Play, Square,
  Sparkles, Eye, Globe, Search, RefreshCw, ArrowRightLeft, ImageIcon
} from "lucide-react";
import SyncDroperImages from "@/components/admin/SyncDroperImages";
import DescriptionReviewPanel from "@/components/admin/DescriptionReviewPanel";

// ─── Types ───────────────────────────────────────────────────────
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

// ─── StatCard ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon?: React.ElementType }) {
  return (
    <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-center space-y-1">
      {Icon && <Icon className="w-4 h-4 mx-auto text-muted-foreground" />}
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className="text-lg font-bold text-foreground">{value ?? 0}</p>
    </div>
  );
}

// ─── Sources config ──────────────────────────────────────────────
const SOURCES = [
  { id: "stockx", name: "StockX" },
  { id: "goat", name: "GOAT" },
  { id: "flightclub", name: "FlightClub" },
  { id: "stadiumgoods", name: "StadiumGoods" },
  { id: "kickscrew", name: "KicksCrew" },
];

const EXTRA_ENDPOINTS: Record<string, { id: string; label: string; needsParam?: boolean; paramLabel?: string }[]> = {
  stockx: [
    { id: "stockx_popular", label: "Mais populares" },
    { id: "stockx_sneakers_search", label: "Busca Sneakers", needsParam: true, paramLabel: "Termo (ex: Jordan 1)" },
    { id: "stockx_related", label: "Relacionados", needsParam: true, paramLabel: "urlKey" },
    { id: "stockx_prices", label: "Preços", needsParam: true, paramLabel: "styleId" },
  ],
  stadiumgoods: [
    { id: "sg_collections", label: "Coleções" },
    { id: "sg_collection_products", label: "Produtos de Coleção", needsParam: true, paramLabel: "Handle (ex: yeezy-380)" },
    { id: "sg_similar", label: "Similares", needsParam: true, paramLabel: "Product ID" },
  ],
  flightclub: [
    { id: "fc_brands", label: "Marcas" },
    { id: "fc_releases", label: "Lançamentos" },
    { id: "fc_recommendation", label: "Recomendações", needsParam: true, paramLabel: "ID do produto" },
  ],
  goat: [
    { id: "goat_recommended", label: "Similares", needsParam: true, paramLabel: "Product ID (ex: 1213732)" },
  ],
  kickscrew: [],
};

export default function CatalogSeedPage() {
  const { toast } = useToast();
  const cancelRef = useRef(false);

  // ─── StockX Seed state ─────────────────────────────────────────
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [connectorStatus, setConnectorStatus] = useState<"unknown" | "on" | "off">("unknown");
  const [seeding, setSeeding] = useState(false);
  const [brandResults, setBrandResults] = useState<BrandResult[]>([]);
  const [currentBrand, setCurrentBrand] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  // ─── Enrichment state ──────────────────────────────────────────
  const [enriching, setEnriching] = useState(false);
  const [enrichPreview, setEnrichPreview] = useState<any>(null);
  const [enrichResult, setEnrichResult] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  // ─── Multi-source state ────────────────────────────────────────
  const [msSource, setMsSource] = useState("goat");
  const [msQuery, setMsQuery] = useState("");
  const [msPage, setMsPage] = useState(1);
  const [msSearching, setMsSearching] = useState(false);
  const [msSearchResult, setMsSearchResult] = useState<any>(null);
  const [msEnriching, setMsEnriching] = useState(false);
  const [msEnrichResult, setMsEnrichResult] = useState<any>(null);
  const [msTesting, setMsTesting] = useState(false);
  const [msTestResult, setMsTestResult] = useState<any>(null);
  const [msEndpoint, setMsEndpoint] = useState("");
  const [msParam, setMsParam] = useState("");
  const [msDiscovering, setMsDiscovering] = useState(false);
  const [msDiscoverResult, setMsDiscoverResult] = useState<any>(null);

  // ─── Sync state ────────────────────────────────────────────────
  const [syncPreview, setSyncPreview] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncPreviewLoading, setSyncPreviewLoading] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sync");

  // ─── API helpers ───────────────────────────────────────────────
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão expirada");
    return session;
  };

  const callApi = async (fn: string, body: any, timeoutMs = 120_000) => {
    const session = await getSession();
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(tid);
      return res.json();
    } catch (e) {
      clearTimeout(tid);
      if (isErrorWithName(e, "AbortError")) return { ok: false, error: "Timeout" };
      throw e;
    }
  };

  const handleCancel = () => { cancelRef.current = true; };

  // ─── Sync Catalog → Marketplace ────────────────────────────────
  const fetchLastSyncTime = useCallback(async () => {
    try {
      const { data } = await supabase.from("cron_execution_logs")
        .select("finished_at")
        .eq("job_name", "catalog-sync")
        .eq("status", "completed")
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastSyncAt(data?.finished_at || null);
    } catch {}
  }, []);

  const handleSyncPreview = useCallback(async () => {
    setSyncPreviewLoading(true); setSyncPreview(null);
    try {
      const [preview] = await Promise.all([
        callApi("catalog-sync", { mode: "preview" }),
        fetchLastSyncTime(),
      ]);
      setSyncPreview(preview);
    } catch (e) { toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSyncPreviewLoading(false); }
  }, [fetchLastSyncTime]);

  // Auto-load preview when sync tab is opened
  useEffect(() => {
    if (activeTab === "sync" && !syncPreview && !syncPreviewLoading) {
      handleSyncPreview();
    }
  }, [activeTab]);

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null); setSyncProgress(0); cancelRef.current = false;
    let totalSynced = 0, totalSkipped = 0, totalUpdated = 0, totalErrors = 0, offset = 0;
    try {
      while (!cancelRef.current) {
        const data = await callApi("catalog-sync", { mode: "sync", batch_size: 100, offset });
        if (!data.ok) { toast({ title: "Erro no sync", description: data.error, variant: "destructive" }); break; }
        totalSynced += data.synced || 0; totalSkipped += data.skipped || 0;
        totalUpdated += data.updated || 0; totalErrors += data.errors || 0;
        offset = data.next_offset;
        setSyncProgress(Math.round((offset / (syncPreview?.total_sneaker_models || 1011)) * 100));
        setSyncResult({ synced: totalSynced, skipped: totalSkipped, updated: totalUpdated, errors: totalErrors });
        if (!data.has_more) { toast({ title: `✓ ${totalSynced} novos, ${totalUpdated} atualizados` }); break; }
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) { toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSyncing(false); handleSyncPreview(); }
  };

  // ─── StockX Seed ───────────────────────────────────────────────
  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const data = await callApi("catalog-seed-500", { mode: "test" });
      setTestResult(data); setConnectorStatus(data.ok ? "on" : "off");
      toast({ title: data.ok ? "Conexão OK ✓" : "Conexão falhou", variant: data.ok ? "default" : "destructive" });
    } catch (e) { toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setTesting(false); }
  };

  const handleSeed = async () => {
    cancelRef.current = false; setSeeding(true); setBrandResults([]); setOverallProgress(0);
    try {
      const listData = await callApi("catalog-seed-500", { mode: "brands_list" });
      if (!listData.ok) throw new Error("Não foi possível obter lista de marcas");
      const brands: { name: string; quota: number }[] = listData.brands;
      setBrandResults(brands.map(b => ({ brand: b.name, status: "pending" as const })));

      for (let i = 0; i < brands.length; i++) {
        if (cancelRef.current) { toast({ title: "Seed cancelado" }); break; }
        const brand = brands[i];
        setCurrentBrand(brand.name);
        setBrandResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "running" } : r));

        try {
          let queryIndex = 0, brandInserted = 0, brandTranslated = 0, brandFetched = 0;
          while (true) {
            if (cancelRef.current) break;
            const result = await callApi("catalog-seed-500", { mode: "seed_brand", brand: brand.name, query_index: queryIndex });
            if (!result.ok) { setBrandResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "error", error: result.error } : r)); break; }
            brandInserted += result.inserted || 0; brandTranslated += result.translated || 0; brandFetched += result.fetched || 0;
            setBrandResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "running", fetched: brandFetched, inserted: brandInserted, translated: brandTranslated, updated: result.updated || 0 } : r));
            if (!result.has_more || result.fetched === 0) { setBrandResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "done" } : r)); break; }
            queryIndex = result.next_query_index || queryIndex + 1;
            await new Promise(r => setTimeout(r, 500));
          }
        } catch (e) { setBrandResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "error", error: getErrorMessage(e) } : r)); }
        setOverallProgress(Math.round(((i + 1) / brands.length) * 100));
        if (i < brands.length - 1 && !cancelRef.current) await new Promise(r => setTimeout(r, 1000));
      }
      if (!cancelRef.current) toast({ title: "Seed concluído! ✓" });
    } catch (e) { toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSeeding(false); setCurrentBrand(null); }
  };

  // ─── Enrichment ────────────────────────────────────────────────
  const handleEnrichPreview = async () => {
    setPreviewing(true); setEnrichPreview(null);
    try { setEnrichPreview(await callApi("enrich-descriptions", { mode: "preview" })); }
    catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setPreviewing(false); }
  };

  const handleEnrich = async () => {
    setEnriching(true); setEnrichResult(null); cancelRef.current = false;
    let totalEnriched = 0, totalErrors = 0, totalSkipped = 0, round = 0;
    try {
      while (!cancelRef.current && round < 20) {
        round++;
        const data = await callApi("enrich-descriptions", { mode: "enrich" });
        if (!data.ok) { toast({ title: "Erro", description: data.error, variant: "destructive" }); break; }
        totalEnriched += data.enriched || 0; totalErrors += data.errors || 0; totalSkipped += data.skipped || 0;
        setEnrichResult({ ok: true, enriched: totalEnriched, errors: totalErrors, skipped: totalSkipped, remaining: data.remaining || 0, message: `${totalEnriched} enriquecidas (rodada ${round})` });
        if (!data.has_more || data.enriched === 0) { toast({ title: `✓ ${totalEnriched} descrições enriquecidas` }); break; }
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setEnriching(false); }
  };

  // ─── Multi-source ──────────────────────────────────────────────
  const handleMsTest = async () => {
    setMsTesting(true); setMsTestResult(null);
    try {
      const data = await callApi("catalog-multisource", { mode: "test", source: msSource });
      setMsTestResult(data);
      toast({ title: data.ok ? `${msSource} OK ✓` : `${msSource} falhou`, variant: data.ok ? "default" : "destructive" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setMsTesting(false); }
  };

  const handleMsTestAll = async () => {
    setMsTesting(true); setMsTestResult(null);
    try {
      const data = await callApi("catalog-multisource", { mode: "test_all" });
      setMsTestResult(data);
      const working = (data.results || []).filter((r: any) => r.ok).length;
      toast({ title: `${working}/${(data.results || []).length} fontes ok` });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setMsTesting(false); }
  };

  const handleMsSearch = async () => {
    if (!msQuery.trim()) return;
    setMsSearching(true); setMsSearchResult(null);
    try {
      const data = await callApi("catalog-multisource", { mode: "search", source: msSource, query: msQuery, page: msPage, limit: 30 });
      setMsSearchResult(data);
      toast({ title: data.ok ? `${data.inserted || 0} novos inseridos` : "Erro", variant: data.ok ? "default" : "destructive" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setMsSearching(false); }
  };

  const handleMsEnrich = async () => {
    setMsEnriching(true); setMsEnrichResult(null);
    try {
      const data = await callApi("catalog-multisource", { mode: "enrich", source: msSource, limit: 20 });
      setMsEnrichResult(data);
      toast({ title: data.ok ? `${data.enriched || 0} enriquecidos` : "Erro", variant: data.ok ? "default" : "destructive" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setMsEnriching(false); }
  };

  const handleMsDiscover = async () => {
    if (!msEndpoint) return;
    setMsDiscovering(true); setMsDiscoverResult(null);
    try {
      const data = await callApi("catalog-multisource", { mode: "discover", source: msSource, endpoint: msEndpoint, param: msParam || undefined, limit: 30 });
      setMsDiscoverResult(data);
      toast({ title: data.ok ? `${data.inserted ?? data.raw_count ?? 0} processados` : "Erro", variant: data.ok ? "default" : "destructive" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setMsDiscovering(false); }
  };

  const seedTotals = brandResults.reduce(
    (acc, r) => ({ fetched: acc.fetched + (r.fetched || 0), inserted: acc.inserted + (r.inserted || 0), updated: acc.updated + (r.updated || 0), translated: acc.translated + (r.translated || 0) }),
    { fetched: 0, inserted: 0, updated: 0, translated: 0 }
  );

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importar Catálogo</h1>
          <p className="text-sm text-muted-foreground">Gerencie fontes, importe modelos e sincronize com o marketplace</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sync" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 h-11">
          <TabsTrigger value="sync" className="gap-1.5 text-xs">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync</span> Marketplace
          </TabsTrigger>
          <TabsTrigger value="seed" className="gap-1.5 text-xs">
            <Database className="w-3.5 h-3.5" />
            Seed StockX
          </TabsTrigger>
          <TabsTrigger value="multisource" className="gap-1.5 text-xs">
            <Globe className="w-3.5 h-3.5" />
            Multi-Source
          </TabsTrigger>
          <TabsTrigger value="enrich" className="gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Enriquecer
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5" />
            Revisão
          </TabsTrigger>
          <TabsTrigger value="droper" className="gap-1.5 text-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            Droper
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════
            TAB 1: Sync Catalog → Marketplace
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="sync" className="space-y-4 mt-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                Catálogo → Marketplace
              </CardTitle>
              <CardDescription>Publica modelos do catálogo como produtos visíveis no marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={handleSyncPreview} variant="outline" disabled={syncing || syncPreviewLoading} size="sm">
                  {syncPreviewLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Atualizar dados
                </Button>
                <Button onClick={handleSync} disabled={syncing || !syncPreview} size="sm">
                  {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />}
                  {syncing ? "Sincronizando..." : "Sincronizar agora"}
                </Button>
                {syncing && (
                  <Button onClick={handleCancel} variant="destructive" size="sm">
                    <Square className="h-3.5 w-3.5 mr-1" />Cancelar
                  </Button>
                )}
                {lastSyncAt && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Última sync automática: {new Date(lastSyncAt).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              {syncPreviewLoading && !syncPreview && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados...
                </div>
              )}

              {syncPreview && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard label="No Catálogo" value={syncPreview.total_sneaker_models} icon={Database} />
                  <StatCard label="No Marketplace" value={syncPreview.total_marketplace_products} />
                  <StatCard label="SKUs já sync" value={syncPreview.existing_skus_in_marketplace} icon={CheckCircle2} />
                  <StatCard label="Novos a sync" value={syncPreview.estimated_to_sync} icon={ArrowRightLeft} />
                  <StatCard label="Imagens desatualizadas" value={syncPreview.outdated_images ?? "—"} icon={ImageIcon} />
                </div>
              )}

              {syncing && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span><span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}

              {syncResult && !syncing && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />Sync concluído
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Novos" value={syncResult.synced} />
                    <StatCard label="Imgs atualizadas" value={syncResult.updated || 0} />
                    <StatCard label="Já existiam" value={syncResult.skipped} />
                    <StatCard label="Erros" value={syncResult.errors} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════
            TAB 2: StockX Seed
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="seed" className="space-y-4 mt-4">
          {/* Connector test */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />Conector StockX
                </CardTitle>
                <div className="flex items-center gap-2">
                  {connectorStatus === "unknown" && <Badge variant="outline">Não verificado</Badge>}
                  {connectorStatus === "on" && <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30"><CheckCircle2 className="h-3 w-3 mr-1" />Online</Badge>}
                  {connectorStatus === "off" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Offline</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTest} disabled={testing} variant="outline" size="sm">
                {testing && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Testar conexão
              </Button>
              {testResult && (
                <pre className="mt-3 p-3 bg-secondary/50 rounded-lg text-xs overflow-auto max-h-32 border border-border/50">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Seed action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />Gerar ~500 Modelos
              </CardTitle>
              <CardDescription>Importa marca por marca com progresso em tempo real (~5 min total).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleSeed} disabled={seeding || connectorStatus === "off"}>
                  {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  {seeding ? "Importando..." : "Iniciar Seed"}
                </Button>
                {seeding && (
                  <Button onClick={handleCancel} variant="destructive">
                    <Square className="h-4 w-4 mr-1" />Cancelar
                  </Button>
                )}
              </div>

              {brandResults.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{currentBrand ? `Processando: ${currentBrand}` : "Concluído"}</span>
                      <span>{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Coletados" value={seedTotals.fetched} />
                    <StatCard label="Inseridos" value={seedTotals.inserted} />
                    <StatCard label="Atualizados" value={seedTotals.updated} />
                    <StatCard label="Traduzidos" value={seedTotals.translated} />
                  </div>

                  <ScrollArea className="max-h-64">
                    <div className="space-y-1.5">
                      {brandResults.map((r) => (
                        <div key={r.brand} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/30 text-sm">
                          <div className="flex items-center gap-2">
                            {r.status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                            {r.status === "running" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                            {r.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                            {r.status === "error" && <XCircle className="h-3 w-3 text-destructive" />}
                            <span className="font-medium">{r.brand}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {r.status === "done" && <><span>{r.fetched} col.</span><span>{r.inserted} novos</span><span>{r.translated} trad.</span></>}
                            {r.status === "error" && <span className="text-destructive">{r.error}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════
            TAB 3: Multi-Source
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="multisource" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />Importação Multi-Source
              </CardTitle>
              <CardDescription>Busque novos SKUs e enriqueça modelos via GOAT, FlightClub, StadiumGoods e KicksCrew.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source selector */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={msSource} onValueChange={setMsSource}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleMsTest} disabled={msTesting}>
                  {msTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  <span className="ml-1">Testar</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleMsTestAll} disabled={msTesting}>
                  <Globe className="h-3.5 w-3.5" /><span className="ml-1">Testar todas</span>
                </Button>
              </div>

              {msTestResult?.results && (
                <div className="grid gap-1.5">
                  {msTestResult.results.map((r: any) => (
                    <div key={r.source} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-sm">
                      <div className="flex items-center gap-2">
                        {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        <span className="font-medium">{r.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.ok ? `OK (${r.status})` : r.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="search" className="gap-1 text-xs"><Search className="h-3 w-3" />Buscar</TabsTrigger>
                  <TabsTrigger value="ms-enrich" className="gap-1 text-xs"><RefreshCw className="h-3 w-3" />Enriquecer</TabsTrigger>
                  <TabsTrigger value="discover" className="gap-1 text-xs"><Globe className="h-3 w-3" />Descobrir</TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-3 pt-3">
                  <div className="flex gap-2">
                    <Input placeholder="Ex: Jordan 1, Yeezy 350..." value={msQuery} onChange={e => setMsQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleMsSearch()} />
                    <Input type="number" className="w-20" value={msPage} onChange={e => setMsPage(Number(e.target.value) || 1)} min={1} />
                    <Button onClick={handleMsSearch} disabled={msSearching || !msQuery.trim()} size="sm">
                      {msSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  {msSearchResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard label="Encontrados" value={msSearchResult.fetched || 0} />
                      <StatCard label="Inseridos" value={msSearchResult.inserted || 0} />
                      <StatCard label="Já existiam" value={msSearchResult.skipped_existing || 0} />
                      <StatCard label="Erros" value={msSearchResult.errors || 0} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ms-enrich" className="space-y-3 pt-3">
                  <Button onClick={handleMsEnrich} disabled={msEnriching} size="sm">
                    {msEnriching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                    Enriquecer via {SOURCES.find(s => s.id === msSource)?.name}
                  </Button>
                  {msEnrichResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard label="Processados" value={msEnrichResult.processed || 0} />
                      <StatCard label="Enriquecidos" value={msEnrichResult.enriched || 0} />
                      <StatCard label="Sem dados" value={msEnrichResult.no_data || 0} />
                      <StatCard label="Erros" value={msEnrichResult.errors || 0} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="discover" className="space-y-3 pt-3">
                  {(EXTRA_ENDPOINTS[msSource] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum endpoint extra para {SOURCES.find(s => s.id === msSource)?.name}.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Select value={msEndpoint} onValueChange={v => { setMsEndpoint(v); setMsDiscoverResult(null); }}>
                          <SelectTrigger className="w-52"><SelectValue placeholder="Selecione endpoint" /></SelectTrigger>
                          <SelectContent>
                            {(EXTRA_ENDPOINTS[msSource] || []).map(ep => <SelectItem key={ep.id} value={ep.id}>{ep.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {(EXTRA_ENDPOINTS[msSource] || []).find(e => e.id === msEndpoint)?.needsParam && (
                          <Input className="w-52" placeholder={(EXTRA_ENDPOINTS[msSource] || []).find(e => e.id === msEndpoint)?.paramLabel || "Parâmetro"} value={msParam} onChange={e => setMsParam(e.target.value)} />
                        )}
                        <Button onClick={handleMsDiscover} disabled={msDiscovering || !msEndpoint} size="sm">
                          {msDiscovering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                          <span className="ml-1">Executar</span>
                        </Button>
                      </div>
                      {msDiscoverResult && (
                        <div className="space-y-2">
                          {msDiscoverResult.data ? (
                            <pre className="p-3 bg-secondary/50 rounded-lg text-xs overflow-auto max-h-48 border border-border/50">
                              {JSON.stringify(msDiscoverResult.data?.slice(0, 20), null, 2)}
                            </pre>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                              <StatCard label="Encontrados" value={msDiscoverResult.fetched || 0} />
                              <StatCard label="Inseridos" value={msDiscoverResult.inserted || 0} />
                              <StatCard label="Já existiam" value={msDiscoverResult.skipped_existing || 0} />
                              <StatCard label="Sem SKU" value={msDiscoverResult.skipped_no_sku || 0} />
                              <StatCard label="Sem marca" value={msDiscoverResult.skipped_no_brand || 0} />
                              <StatCard label="Erros" value={msDiscoverResult.errors || 0} />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════
            TAB 4: Enrichment
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="enrich" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />Enriquecimento de Descrições
              </CardTitle>
              <CardDescription>Reescreve descrições fracas com tom editorial usando IA (até 20/execução).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleEnrichPreview} disabled={previewing || enriching} variant="outline" size="sm">
                  {previewing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                  Ver candidatos
                </Button>
                <Button onClick={handleEnrich} disabled={enriching || previewing} size="sm">
                  {enriching ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                  {enriching ? "Enriquecendo..." : "Enriquecer"}
                </Button>
                {enriching && (
                  <Button onClick={handleCancel} variant="destructive" size="sm">
                    <Square className="h-3.5 w-3.5 mr-1" />Cancelar
                  </Button>
                )}
              </div>

              {enrichPreview && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{enrichPreview.total_weak} modelos com descrições fracas</p>
                  <div className="space-y-1.5">
                    {enrichPreview.samples?.map((s: any, idx: number) => (
                      <div key={idx} className="p-3 bg-secondary/30 rounded-lg text-xs border border-border/30">
                        <p className="font-medium text-foreground">{s.name} <span className="text-muted-foreground">({s.sku})</span></p>
                        <p className="text-muted-foreground italic mt-1">{s.current_desc ? `"${s.current_desc.slice(0, 120)}..."` : "Sem descrição"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enrichResult && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Enriquecidos" value={enrichResult.enriched} icon={CheckCircle2} />
                    <StatCard label="Pulados" value={enrichResult.skipped} />
                    <StatCard label="Erros" value={enrichResult.errors} icon={XCircle} />
                  </div>
                  {enrichResult.message && <p className="text-xs text-muted-foreground">{enrichResult.message}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════
            TAB 5: Review Descriptions
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="review" className="mt-4">
          <DescriptionReviewPanel />
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════
            TAB 6: Droper Images
        ════════════════════════════════════════════════════════════ */}
        <TabsContent value="droper" className="mt-4">
          <SyncDroperImages />
        </TabsContent>
      </Tabs>
    </div>
  );
}
