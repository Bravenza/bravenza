import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Layers,
  ImageIcon, FileText, Tag, Calendar, DollarSign, Palette, Box
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SyncResult {
  inserted: number;
  updated: number;
  failed: number;
  notFound: number;
  skippedDuplicates: number;
  errors: string[];
  details: { sku: string; images: number; action: "inserted" | "updated" | "duplicate" }[];
}

interface BatchResult {
  message: string;
  nextPage: number;
  pagesProcessed: number;
  reachedLimit?: boolean;
  result: SyncResult;
}

interface LogEntry {
  time: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface Totals {
  inserted: number;
  updated: number;
  duplicates: number;
  failed: number;
  notFound: number;
  batches: number;
}

const SYNC_FIELDS = [
  { icon: FileText, label: "Nome do produto (PT/EN)" },
  { icon: FileText, label: "Descrição completa" },
  { icon: Tag, label: "SKU e colorway" },
  { icon: Calendar, label: "Data de lançamento" },
  { icon: DollarSign, label: "Preço MSRP (BRL)" },
  { icon: Palette, label: "Marca (brands)" },
  { icon: Box, label: "Silhueta (silhouettes)" },
  { icon: ImageIcon, label: "Até 6 imagens .webp" },
];

export default function SyncCatalogoDroper() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesPerBatch, setPagesPerBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(5);
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [totals, setTotals] = useState<Totals>({ inserted: 0, updated: 0, duplicates: 0, failed: 0, notFound: 0, batches: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<{ sku: string; images: number }[]>([]);
  const shouldStop = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("brands").select("name").order("name").then(({ data }) => {
      if (data) setBrands(data.map((b) => b.name));
    });
  }, []);

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev.slice(-299), { time: new Date().toLocaleTimeString("pt-BR"), type, message }]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const reset = () => {
    setRunning(false); setPaused(false); setDone(false);
    setCurrentPage(0); setTotals({ success: 0, failed: 0, notFound: 0, batches: 0 });
    setLogs([]); setErrors([]); setLastSynced([]);
    shouldStop.current = false;
  };

  const runBatch = async (page: number): Promise<BatchResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-droper-images", {
        body: { page, maxPages: pagesPerBatch, marca: marcaFiltro || null },
      });
      if (error) throw new Error(error.message);
      return data as BatchResult;
    } catch (err: unknown) {
      addLog("error", `Batch p.${page} falhou: ${err instanceof Error ? err.message : "erro desconhecido"}`);
      return null;
    }
  };

  const startSync = async () => {
    shouldStop.current = false;
    setRunning(true); setPaused(false); setDone(false);
    setLogs([]); setErrors([]); setLastSynced([]);
    setTotals({ success: 0, failed: 0, notFound: 0, batches: 0 });

    let page = currentPage;
    let batchCount = 0;

    addLog("info", `Iniciando sincronização — página ${page}, ${pagesPerBatch}p/batch, ${totalBatches} batches`);

    while (batchCount < totalBatches) {
      while (paused && !shouldStop.current) await new Promise((r) => setTimeout(r, 500));
      if (shouldStop.current) break;

      addLog("info", `Batch ${batchCount + 1}/${totalBatches} — buscando página ${page}...`);
      const result = await runBatch(page);

      if (!result) { page += pagesPerBatch; batchCount++; continue; }

      const r = result.result;
      setCurrentPage(result.nextPage);
      page = result.nextPage;
      batchCount++;

      setTotals((prev) => ({
        success: prev.success + r.success,
        failed: prev.failed + r.failed,
        notFound: prev.notFound + r.notFound,
        batches: prev.batches + 1,
      }));

      if (r.details?.length > 0) {
        setLastSynced((prev) => [...r.details.slice(0, 5), ...prev].slice(0, 10));
      }

      if (r.errors?.length > 0) setErrors((prev) => [...prev, ...r.errors.slice(0, 10)]);

      addLog(r.success > 0 ? "success" : "warning",
        `${r.success} criados/atualizados · ${r.notFound} não encontrados · ${r.failed} falhas`
      );

      if (result.reachedLimit) {
        addLog("warning", `Limite de 100 páginas atingido para "${marcaFiltro || "sem filtro"}". Troque a marca e continue.`);
        setRunning(false);
        return;
      }
      if (result.pagesProcessed < pagesPerBatch) {
        addLog("success", "Catálogo completo processado!");
        setDone(true); break;
      }

      if (shouldStop.current) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Após sync Droper, disparar catalog-sync para copiar sneaker_models → marketplace_products
    if (totals.success > 0 || done) {
      addLog("info", "Sincronizando catálogo (sneaker_models → marketplace_products)...");
      try {
        let syncOffset = 0;
        let totalSynced = 0;
        let totalUpdated = 0;
        let hasMore = true;
        while (hasMore) {
          const { data: syncData, error: syncErr } = await supabase.functions.invoke("catalog-sync", {
            body: { mode: "sync", batch_size: 200, offset: syncOffset },
          });
          if (syncErr) throw new Error(syncErr.message);
          totalSynced += syncData?.synced || 0;
          totalUpdated += syncData?.updated || 0;
          hasMore = syncData?.has_more || false;
          syncOffset = syncData?.next_offset || syncOffset + 200;
        }
        addLog("success", `Catálogo atualizado: ${totalSynced} novos, ${totalUpdated} imagens atualizadas`);
      } catch (err: unknown) {
        addLog("error", `Erro ao sincronizar catálogo: ${err instanceof Error ? err.message : "erro"}`);
      }
    }

    if (!done) addLog("warning", `Pausado na página ${page}. Retome quando quiser.`);
    setRunning(false);
  };

  const handlePause = () => {
    shouldStop.current = true; setPaused(true); setRunning(false);
    addLog("warning", "Pausado pelo usuário.");
  };

  const logIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />;
      case "warning": return <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />;
      case "error": return <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />;
      default: return <div className="w-3 h-3 rounded-full bg-muted-foreground/30 shrink-0 mt-0.5" />;
    }
  };

  const progressPct = Math.min(Math.round((totals.batches / totalBatches) * 100), 100);
  const estimatedProducts = pagesPerBatch * totalBatches * 60;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {running && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Droper → Catálogo</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Importa produtos completos da <span className="font-semibold text-foreground">droper.app</span> para o catálogo interno
          </p>
        </div>
        {(running || paused) && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Página atual</p>
            <p className="text-2xl font-bold text-primary">{currentPage}</p>
          </div>
        )}
      </div>

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Coluna esquerda — o que é sincronizado */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Dados importados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {SYNC_FIELDS.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 text-sm">
                <f.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-foreground">{f.label}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border mt-3">
              <p className="text-xs text-muted-foreground">
                Fonte: <span className="font-mono text-foreground/70">cataloko.com/api/v4</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coluna centro — configurações + métricas */}
        <div className="space-y-4">

          {/* Configurações — só quando parado */}
          {!running && !paused && (
            <Card className="bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Configuração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Página inicial</Label>
                  <Input type="number" min={0} value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">0 = início do catálogo</p>
                </div>

                <div>
                  <Label className="text-xs">Páginas por batch</Label>
                  <Input type="number" min={1} max={3} value={pagesPerBatch}
                    onChange={(e) => setPagesPerBatch(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{pagesPerBatch * 60} produtos/batch · máx 3</p>
                </div>

                <div>
                  <Label className="text-xs">Total de batches</Label>
                  <Input type="number" min={1} value={totalBatches}
                    onChange={(e) => setTotalBatches(parseInt(e.target.value) || 5)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">~{estimatedProducts.toLocaleString()} produtos nesta sessão</p>
                </div>

                <div>
                  <Label className="text-xs">Filtrar por marca <span className="text-muted-foreground">(opcional)</span></Label>
                  <Select value={marcaFiltro} onValueChange={setMarcaFiltro}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todas as marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as marcas</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b.toLowerCase()}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Limite: 100 páginas por marca (6.000 produtos)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sincronizados", value: totals.success, icon: CheckCircle2, variant: "default" as const },
              { label: "Não encontrados", value: totals.notFound, icon: AlertTriangle, variant: "secondary" as const },
              { label: "Falhas", value: totals.failed, icon: XCircle, variant: "destructive" as const },
              { label: "Batches", value: totals.batches, icon: Layers, variant: "outline" as const },
            ].map((s) => (
              <Card key={s.label} className="bg-card/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress bar */}
          {totals.batches > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progresso da sessão</span>
                <span className="font-medium text-foreground">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col gap-2">
            {!running && !paused && (
              <Button onClick={startSync} className="w-full gap-2">
                <Play className="w-4 h-4" />
                {done ? "Reiniciar" : "Iniciar Sincronização"}
              </Button>
            )}
            {running && (
              <Button onClick={handlePause} variant="secondary" className="w-full gap-2">
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
            )}
            {paused && (
              <Button onClick={() => { setPaused(false); startSync(); }} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Play className="w-4 h-4" />
                Retomar (p. {currentPage})
              </Button>
            )}
            {(totals.batches > 0 || paused) && !running && (
              <Button onClick={reset} variant="outline" className="w-full gap-2">
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>
            )}
            {running && (
              <div className="flex items-center justify-center gap-2 text-primary text-xs py-1">
                <span className="animate-pulse">●</span>
                <span>Sincronizando produtos...</span>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita — log + últimos sincronizados */}
        <div className="space-y-4">

          {/* Últimos produtos sincronizados */}
          {lastSynced.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Últimos salvos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lastSynced.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-foreground truncate max-w-[140px]">{item.sku}</span>
                    <Badge variant="secondary" className="text-[10px] font-normal">{item.images} imgs</Badge>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Terminal de log */}
          {logs.length > 0 && (
            <Card className="bg-card/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Log</span>
                <Badge variant="outline" className="text-[10px]">{logs.length}</Badge>
              </div>
              <ScrollArea className="h-64">
                <div className="p-3 space-y-1.5 text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      {logIcon(log.type)}
                      <span className="text-muted-foreground shrink-0 font-mono">{log.time}</span>
                      <span className="text-foreground">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Dica inicial */}
          {logs.length === 0 && !running && (
            <Card className="bg-card/50">
              <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
                <p className="text-foreground font-semibold text-sm">Como usar</p>
                <p>1. Configure a <span className="text-foreground font-medium">página inicial</span> (0 = começo)</p>
                <p>2. Use <span className="text-foreground font-medium">1 página/batch</span> para testar</p>
                <p>3. Aumente gradualmente para <span className="text-foreground font-medium">2–3 páginas</span></p>
                <p>4. Pause e retome a qualquer momento</p>
                <p className="pt-1 text-muted-foreground/60">Catálogo droper: ~64.000 produtos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Erros detalhados */}
      {errors.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <details>
            <summary className="px-5 py-3 text-xs text-destructive cursor-pointer hover:text-destructive/80 select-none font-medium">
              ❌ {errors.length} erros — clique para expandir
            </summary>
            <div className="px-5 pb-4 space-y-1 text-xs text-destructive/80 max-h-48 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="border-t border-destructive/10 pt-1">• {e}</div>
              ))}
            </div>
          </details>
        </Card>
      )}

      {/* Banner de sucesso */}
      {done && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-emerald-800 font-semibold">Sincronização completa!</p>
              <p className="text-emerald-600 text-sm">{totals.success} produtos importados da droper.app com imagens, descrições e ficha técnica.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
