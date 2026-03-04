import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// ─── Totais acumulados ────────────────────────────────────────────────────────
interface Totals {
  success: number;
  failed: number;
  notFound: number;
  batches: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function SyncDroperImages() {
  const [running, setRunning]     = useState(false);
  const [paused, setPaused]       = useState(false);
  const [done, setDone]           = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesPerBatch, setPagesPerBatch] = useState(5);
  const [totalBatches, setTotalBatches]   = useState(10); // 10 batches × 5 páginas × 60 drops = 3000 produtos
  const [totals, setTotals]       = useState<Totals>({ success: 0, failed: 0, notFound: 0, batches: 0 });
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [errors, setErrors]       = useState<string[]>([]);
  const shouldStop                = useRef(false);
  const logsEndRef                = useRef<HTMLDivElement>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const addLog = (type: LogEntry["type"], message: string) => {
    const entry: LogEntry = {
      time: new Date().toLocaleTimeString("pt-BR"),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-199), entry]); // mantém últimas 200 linhas
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

  // ─── Executa um batch (uma chamada à Edge Function) ──────────────────────────
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

  // ─── Loop principal ──────────────────────────────────────────────────────────
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

    addLog("info", `🚀 Sincronização iniciada — página ${page}, ${pagesPerBatch} páginas/batch, ${totalBatches} batches máximo`);

    while (batchCount < totalBatches) {
      // Verifica pausa
      while (paused && !shouldStop.current) {
        await new Promise((r) => setTimeout(r, 500));
      }
      if (shouldStop.current) break;

      addLog("info", `📦 Batch ${batchCount + 1}/${totalBatches} — página ${page}...`);

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
        success:   prev.success   + r.success,
        failed:    prev.failed    + r.failed,
        notFound:  prev.notFound  + r.notFound,
        batches:   prev.batches   + 1,
      }));

      if (r.errors.length > 0) {
        setErrors((prev) => [...prev, ...r.errors.slice(0, 10)]);
      }

      addLog(
        r.success > 0 ? "success" : "warning",
        `✅ ${r.success} salvos | ⚠️ ${r.notFound} não encontrados | ❌ ${r.failed} falhas`
      );

      // Se a API disse que não tem mais páginas, para
      if (result.pagesProcessed < pagesPerBatch) {
        addLog("success", "🎉 Catálogo completo processado!");
        setDone(true);
        break;
      }

      if (shouldStop.current) break;

      // Pausa de 2s entre batches para não sobrecarregar
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!done) {
      addLog("info", `⏸ Sincronização pausada na página ${page}. Retome quando quiser.`);
    }

    setRunning(false);
  };

  const handlePause = () => {
    shouldStop.current = true;
    setPaused(true);
    setRunning(false);
    addLog("warning", "⏸ Sincronização pausada pelo usuário.");
  };

  const handleResume = () => {
    setPaused(false);
    startSync();
  };

  // ─── Cores dos logs ──────────────────────────────────────────────────────────
  const logColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return "text-emerald-400";
      case "warning": return "text-amber-400";
      case "error":   return "text-red-400";
      default:        return "text-slate-300";
    }
  };

  // ─── Progresso estimado ──────────────────────────────────────────────────────
  const progressPct = Math.min(
    Math.round((totals.batches / totalBatches) * 100),
    100
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sync Imagens — Droper.app
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Baixa imagens do catálogo da Droper e salva na tabela{" "}
            <code className="text-amber-400">sneaker_models</code>
          </p>
        </div>

        {/* Configurações */}
        {!running && !paused && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <label className="text-xs text-slate-400 block mb-2">PÁGINA INICIAL</label>
              <input
                type="number"
                min={0}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-slate-500 mt-1">0 = começo do catálogo</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <label className="text-xs text-slate-400 block mb-2">PÁGINAS POR BATCH</label>
              <input
                type="number"
                min={1}
                max={10}
                value={pagesPerBatch}
                onChange={(e) => setPagesPerBatch(parseInt(e.target.value) || 5)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-slate-500 mt-1">{pagesPerBatch * 60} produtos/batch</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <label className="text-xs text-slate-400 block mb-2">TOTAL DE BATCHES</label>
              <input
                type="number"
                min={1}
                value={totalBatches}
                onChange={(e) => setTotalBatches(parseInt(e.target.value) || 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-slate-500 mt-1">~{totalBatches * pagesPerBatch * 60} produtos no total</p>
            </div>
          </div>
        )}

        {/* Totais */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "SALVOS",         value: totals.success,  color: "text-emerald-400 border-emerald-900" },
            { label: "NÃO ENCONTRADOS",value: totals.notFound, color: "text-amber-400 border-amber-900" },
            { label: "FALHAS",         value: totals.failed,   color: "text-red-400 border-red-900" },
            { label: "BATCHES",        value: totals.batches,  color: "text-blue-400 border-blue-900" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-slate-900 border rounded-lg p-4 ${stat.color}`}>
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color.split(" ")[0]}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Barra de progresso */}
        {(running || paused || done || totals.batches > 0) && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progresso estimado</span>
              <span>{progressPct}% — página atual: {currentPage}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          {!running && !paused && (
            <button
              onClick={startSync}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg transition text-sm"
            >
              {done ? "🔄 Reiniciar" : "▶ Iniciar Sincronização"}
            </button>
          )}

          {running && (
            <button
              onClick={handlePause}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-lg transition text-sm"
            >
              ⏸ Pausar
            </button>
          )}

          {paused && (
            <button
              onClick={handleResume}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition text-sm"
            >
              ▶ Retomar (página {currentPage})
            </button>
          )}

          {(totals.batches > 0 || paused) && !running && (
            <button
              onClick={reset}
              className="border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-6 py-3 rounded-lg transition text-sm"
            >
              ↺ Resetar
            </button>
          )}

          {running && (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <span className="animate-pulse">●</span>
              <span>Sincronizando...</span>
            </div>
          )}
        </div>

        {/* Log terminal */}
        {logs.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-sans">LOG</span>
              <span className="text-xs text-slate-600">{logs.length} entradas</span>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-1 text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600 shrink-0">{log.time}</span>
                  <span className={logColor(log.type)}>{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Erros detalhados */}
        {errors.length > 0 && (
          <details className="bg-slate-900 border border-red-900 rounded-lg overflow-hidden">
            <summary className="px-4 py-3 text-xs text-red-400 cursor-pointer hover:text-red-300">
              ❌ {errors.length} erros — clique para expandir
            </summary>
            <div className="px-4 pb-4 space-y-1 text-xs text-red-400 max-h-48 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="border-t border-red-900 pt-1">• {e}</div>
              ))}
            </div>
          </details>
        )}

        {/* Sucesso final */}
        {done && (
          <div className="bg-emerald-950 border border-emerald-800 rounded-lg p-4 text-emerald-400 text-sm">
            🎉 Sincronização completa! {totals.success} produtos atualizados com imagens da Droper.
          </div>
        )}

        {/* Dica de uso em lotes */}
        {!running && !paused && totals.batches === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-slate-400 space-y-1">
            <p className="text-slate-300 font-semibold mb-2">💡 Como processar o catálogo inteiro (64k produtos)</p>
            <p>• Comece com <strong className="text-white">5 batches de 5 páginas</strong> para testar</p>
            <p>• Se funcionar bem, aumente para <strong className="text-white">50+ batches</strong></p>
            <p>• Você pode <strong className="text-white">pausar e retomar</strong> a qualquer momento — o progresso é salvo</p>
            <p>• Cada batch processa ~{pagesPerBatch * 60} produtos e leva ~{pagesPerBatch * 30}s</p>
          </div>
        )}

      </div>
    </div>
  );
}
