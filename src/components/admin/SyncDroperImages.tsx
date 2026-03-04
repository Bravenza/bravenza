import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, XCircle, ImageIcon, Loader2, Package, Info } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SyncResult {
  success: number;
  failed: number;
  notFound: number;
  skipped: number;
  errors: string[];
  details: { sku: string; images: number }[];
}

interface BatchResult {
  message: string;
  nextPage: number;
  pagesProcessed: number;
  result: SyncResult;
}

interface LogEntry {
  time: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface Totals {
  success: number;
  failed: number;
  notFound: number;
  batches: number;
}

const SYNC_FIELDS = [
  "Nome do produto (PT/EN)",
  "Descrição completa",
  "SKU e colorway",
  "Data de lançamento",
  "Preço MSRP (BRL)",
  "Marca (brands)",
  "Silhueta (silhouettes)",
  "Até 6 imagens .webp",
];

export default function SyncCatalogoDroper() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesPerBatch, setPagesPerBatch] = useState(1);
  const [totalBatches, setTotalBatches] = useState(5);
  const [totals, setTotals] = useState<Totals>({ success: 0, failed: 0, notFound: 0, batches: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<{ sku: string; images: number }[]>([]);
  const shouldStop = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
        body: { page, maxPages: pagesPerBatch },
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

      if (result.pagesProcessed < pagesPerBatch) {
        addLog("success", "Catálogo completo processado!");
        setDone(true); break;
      }

      if (shouldStop.current) break;
      await new Promise((r) => setTimeout(r, 2000));
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
      case "success": return <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning": return <AlertTriangle className="w-3 h-3 text-primary shrink-0 mt-0.5" />;
      case "error": return <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />;
      default: return <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />;
    }
  };

  const progressPct = Math.min(Math.round((totals.batches / totalBatches) * 100), 100);
  const estimatedProducts = pagesPerBatch * totalBatches * 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Sync Catálogo — Droper.app</CardTitle>
                <CardDescription>
                  Importa produtos completos com imagens, descrições e ficha técnica
                </CardDescription>
              </div>
            </div>
            {(running || paused) && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Página atual</p>
                <p className="text-2xl font-bold text-primary">{currentPage}</p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Col 1 — Dados importados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados importados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {SYNC_FIELDS.map((label) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <Package className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-foreground/80">{label}</span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-border text-xs text-muted-foreground">
              Fonte: <span className="text-primary/80">cataloko.com/api</span>
            </div>
          </CardContent>
        </Card>

        {/* Col 2 — Config + Métricas */}
        <div className="space-y-4">
          {/* Config — só quando parado */}
          {!running && !paused && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Página inicial</label>
                  <Input type="number" min={0} value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground/60 mt-1">0 = início do catálogo</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Páginas por batch</label>
                  <Input type="number" min={1} max={3} value={pagesPerBatch}
                    onChange={(e) => setPagesPerBatch(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground/60 mt-1">{pagesPerBatch * 60} produtos/batch · máx 3</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Total de batches</label>
                  <Input type="number" min={1} value={totalBatches}
                    onChange={(e) => setTotalBatches(parseInt(e.target.value) || 5)} />
                  <p className="text-xs text-muted-foreground/60 mt-1">~{estimatedProducts.toLocaleString()} produtos nesta sessão</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Criados", value: totals.success, icon: CheckCircle2, variant: "default" as const },
              { label: "Não encontrados", value: totals.notFound, icon: AlertTriangle, variant: "secondary" as const },
              { label: "Falhas", value: totals.failed, icon: XCircle, variant: "destructive" as const },
              { label: "Batches", value: totals.batches, icon: Package, variant: "outline" as const },
            ].map((s) => (
              <Card key={s.label} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Progress */}
          {totals.batches > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col gap-2">
            {!running && !paused && (
              <Button onClick={startSync} className="w-full gap-2" size="lg">
                <Play className="w-4 h-4" />
                {done ? "Reiniciar" : "Iniciar Sincronização"}
              </Button>
            )}
            {running && (
              <Button onClick={handlePause} variant="secondary" className="w-full gap-2" size="lg">
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
            )}
            {paused && (
              <Button onClick={() => { setPaused(false); startSync(); }} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500" size="lg">
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
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Sincronizando produtos...</span>
              </div>
            )}
          </div>
        </div>

        {/* Col 3 — Log + últimos sync */}
        <div className="space-y-4">
          {/* Últimos produtos */}
          {lastSynced.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Últimos salvos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lastSynced.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/80 font-mono truncate max-w-[140px]">{item.sku}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{item.images} imgs</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Terminal log */}
          {logs.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Log</span>
                <Badge variant="secondary" className="text-[10px]">{logs.length}</Badge>
              </div>
              <ScrollArea className="h-64 p-3">
                <div className="space-y-1.5 text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      {logIcon(log.type)}
                      <span className="text-muted-foreground/60 shrink-0 font-mono">{log.time}</span>
                      <span className="text-foreground/80">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Dica inicial */}
          {logs.length === 0 && !running && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Como usar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                <p>1. Configure a <span className="text-foreground">página inicial</span> (0 = começo)</p>
                <p>2. Use <span className="text-foreground">1 página/batch</span> para testar</p>
                <p>3. Aumente gradualmente para <span className="text-foreground">2–3 páginas</span></p>
                <p>4. Pause e retome a qualquer momento</p>
                <p className="pt-2 text-muted-foreground/50">Catálogo droper: ~64.000 produtos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Erros */}
      {errors.length > 0 && (
        <Card className="border-destructive/30">
          <details>
            <summary className="px-5 py-3 text-xs text-destructive cursor-pointer hover:text-destructive/80 select-none flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5" />
              {errors.length} erros — clique para expandir
            </summary>
            <CardContent className="pt-0 space-y-1 text-xs text-destructive/80 max-h-48 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="border-t border-destructive/10 pt-1">• {e}</div>
              ))}
            </CardContent>
          </details>
        </Card>
      )}

      {/* Sucesso */}
      {done && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-foreground font-semibold">Sincronização completa!</p>
              <p className="text-sm text-muted-foreground">{totals.success} produtos importados da droper.app</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
