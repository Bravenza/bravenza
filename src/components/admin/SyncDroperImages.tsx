import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Play, Pause, RotateCcw, Loader2, ImageIcon, CheckCircle2,
  AlertTriangle, XCircle, Layers, Info
} from "lucide-react";

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
  page: number;
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

// ─── Componente ───────────────────────────────────────────────────────────────
export default function SyncDroperImages() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesPerBatch, setPagesPerBatch] = useState(5);
  const [totalBatches, setTotalBatches] = useState(10);
  const [totals, setTotals] = useState<Totals>({ success: 0, failed: 0, notFound: 0, batches: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const shouldStop = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry["type"], message: string) => {
    const entry: LogEntry = {
      time: new Date().toLocaleTimeString("pt-BR"),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-199), entry]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const reset = () => {
    setRunning(false);
    setPaused(false);
    setDone(false);
    setCurrentPage(0);
    setTotals({ success: 0, failed: 0, notFound: 0, batches: 0 });
    setLogs([]);
    setErrors([]);
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
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      addLog("error", `Batch página ${page} falhou: ${msg}`);
      return null;
    }
  };

  const startSync = async () => {
    shouldStop.current = false;
    setRunning(true);
    setPaused(false);
    setDone(false);
    setLogs([]);
    setErrors([]);
    setTotals({ success: 0, failed: 0, notFound: 0, batches: 0 });

    let page = currentPage;
    let batchCount = 0;

    addLog("info", `Sincronização iniciada — página ${page}, ${pagesPerBatch} páginas/batch, ${totalBatches} batches máximo`);

    while (batchCount < totalBatches) {
      while (paused && !shouldStop.current) {
        await new Promise((r) => setTimeout(r, 500));
      }
      if (shouldStop.current) break;

      addLog("info", `Batch ${batchCount + 1}/${totalBatches} — página ${page}...`);

      const result = await runBatch(page);

      if (!result) {
        addLog("error", `Batch ${batchCount + 1} falhou. Tentando próxima página...`);
        page += pagesPerBatch;
        batchCount++;
        continue;
      }

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

      if (r.errors.length > 0) {
        setErrors((prev) => [...prev, ...r.errors.slice(0, 10)]);
      }

      addLog(
        r.success > 0 ? "success" : "warning",
        `${r.success} salvos | ${r.notFound} não encontrados | ${r.failed} falhas`
      );

      if (result.pagesProcessed < pagesPerBatch) {
        addLog("success", "Catálogo completo processado!");
        setDone(true);
        break;
      }

      if (shouldStop.current) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!done) {
      addLog("info", `Sincronização pausada na página ${page}. Retome quando quiser.`);
    }

    setRunning(false);
  };

  const handlePause = () => {
    shouldStop.current = true;
    setPaused(true);
    setRunning(false);
    addLog("warning", "Sincronização pausada pelo usuário.");
  };

  const handleResume = () => {
    setPaused(false);
    startSync();
  };

  const logIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning": return <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />;
      case "error": return <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />;
      default: return <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />;
    }
  };

  const progressPct = Math.min(Math.round((totals.batches / totalBatches) * 100), 100);

  const stats = [
    { label: "Salvos", value: totals.success, icon: CheckCircle2, variant: "default" as const },
    { label: "Não encontrados", value: totals.notFound, icon: AlertTriangle, variant: "secondary" as const },
    { label: "Falhas", value: totals.failed, icon: XCircle, variant: "destructive" as const },
    { label: "Batches", value: totals.batches, icon: Layers, variant: "outline" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Sincronização de Imagens — Droper</CardTitle>
          </div>
          <CardDescription>
            Baixa imagens do catálogo da Droper e atualiza a tabela <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">sneaker_models</code>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Configurações */}
          {!running && !paused && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Página inicial</label>
                <Input
                  type="number"
                  min={0}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">0 = começo do catálogo</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Páginas por batch</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={pagesPerBatch}
                  onChange={(e) => setPagesPerBatch(parseInt(e.target.value) || 5)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">{pagesPerBatch * 60} produtos/batch</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de batches</label>
                <Input
                  type="number"
                  min={1}
                  value={totalBatches}
                  onChange={(e) => setTotalBatches(parseInt(e.target.value) || 10)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">~{totalBatches * pagesPerBatch * 60} produtos no total</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Progresso */}
          {(running || paused || done || totals.batches > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso estimado</span>
                <span className="font-mono">{progressPct}% — pág. {currentPage}</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-wrap gap-2">
            {!running && !paused && (
              <Button onClick={startSync} size="sm">
                <Play className="h-4 w-4 mr-1.5" />
                {done ? "Reiniciar" : "Iniciar Sincronização"}
              </Button>
            )}

            {running && (
              <Button onClick={handlePause} variant="secondary" size="sm">
                <Pause className="h-4 w-4 mr-1.5" />
                Pausar
              </Button>
            )}

            {paused && (
              <Button onClick={handleResume} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Play className="h-4 w-4 mr-1.5" />
                Retomar (pág. {currentPage})
              </Button>
            )}

            {(totals.batches > 0 || paused) && !running && (
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Resetar
              </Button>
            )}

            {running && (
              <Badge variant="secondary" className="animate-pulse gap-1.5 ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sincronizando...
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Log de execução</span>
              <Badge variant="outline" className="text-[10px]">{logs.length} entradas</Badge>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="h-60">
            <div className="p-3 space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  {logIcon(log.type)}
                  <span className="text-muted-foreground shrink-0 tabular-nums">{log.time}</span>
                  <span className="text-foreground">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Erros detalhados */}
      {errors.length > 0 && (
        <Card className="border-destructive/30">
          <details>
            <summary className="px-4 py-3 text-xs text-destructive cursor-pointer hover:bg-destructive/5 transition-colors font-medium">
              <XCircle className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              {errors.length} erros — clique para expandir
            </summary>
            <Separator />
            <ScrollArea className="max-h-48">
              <div className="p-3 space-y-1 text-xs text-destructive">
                {errors.map((e, i) => (
                  <div key={i} className="py-1 border-b border-destructive/10 last:border-0">• {e}</div>
                ))}
              </div>
            </ScrollArea>
          </details>
        </Card>
      )}

      {/* Sucesso */}
      {done && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-foreground">
              Sincronização completa! <strong>{totals.success}</strong> produtos atualizados com imagens da Droper.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dica */}
      {!running && !paused && totals.batches === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-4 text-xs text-muted-foreground space-y-1.5">
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" />
              Como processar o catálogo inteiro
            </p>
            <p>• Comece com <strong className="text-foreground">5 batches de 5 páginas</strong> para testar</p>
            <p>• Se funcionar bem, aumente para <strong className="text-foreground">50+ batches</strong></p>
            <p>• Você pode <strong className="text-foreground">pausar e retomar</strong> a qualquer momento</p>
            <p>• Cada batch processa ~{pagesPerBatch * 60} produtos e leva ~{pagesPerBatch * 30}s</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
