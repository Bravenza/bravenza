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
  success: number;
  failed: number;
  notFound: number;
  batches: number;
}

// ─── O que é sincronizado por produto ────────────────────────────────────────
const SYNC_FIELDS = [
  { icon: "◈", label: "Nome do produto (PT/EN)" },
  { icon: "◈", label: "Descrição completa" },
  { icon: "◈", label: "SKU e colorway" },
  { icon: "◈", label: "Data de lançamento" },
  { icon: "◈", label: "Preço MSRP (BRL)" },
  { icon: "◈", label: "Marca (brands)" },
  { icon: "◈", label: "Silhueta (silhouettes)" },
  { icon: "◈", label: "Até 6 imagens .webp" },
];

export default function SyncCatalogoDroper() {
  const [running, setRunning]         = useState(false);
  const [paused, setPaused]           = useState(false);
  const [done, setDone]               = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesPerBatch, setPagesPerBatch] = useState(1);
  const [totalBatches, setTotalBatches]   = useState(5);
  const [marcaFiltro, setMarcaFiltro]     = useState("");
  const [totals, setTotals]           = useState<Totals>({ success: 0, failed: 0, notFound: 0, batches: 0 });
  const [logs, setLogs]               = useState<LogEntry[]>([]);
  const [errors, setErrors]           = useState<string[]>([]);
  const [lastSynced, setLastSynced]   = useState<{ sku: string; images: number }[]>([]);
  const shouldStop                    = useRef(false);
  const logsEndRef                    = useRef<HTMLDivElement>(null);

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
        success:  prev.success  + r.success,
        failed:   prev.failed   + r.failed,
        notFound: prev.notFound + r.notFound,
        batches:  prev.batches  + 1,
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

    if (!done) addLog("warning", `Pausado na página ${page}. Retome quando quiser.`);
    setRunning(false);
  };

  const handlePause = () => {
    shouldStop.current = true; setPaused(true); setRunning(false);
    addLog("warning", "Pausado pelo usuário.");
  };

  const logColor = (type: LogEntry["type"]) => ({
    success: "text-emerald-400",
    warning: "text-amber-400",
    error:   "text-red-400",
    info:    "text-slate-300",
  }[type]);

  const progressPct = Math.min(Math.round((totals.batches / totalBatches) * 100), 100);
  const estimatedProducts = pagesPerBatch * totalBatches * 60;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6" style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Bravenza Admin</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Sync Catálogo
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Importa produtos completos da <span className="text-orange-400">droper.app</span> para o seu catálogo
            </p>
          </div>
          {(running || paused) && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Página atual</p>
              <p className="text-2xl font-bold text-orange-400">{currentPage}</p>
            </div>
          )}
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Coluna esquerda — o que é sincronizado */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Dados importados</p>
            {SYNC_FIELDS.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm">
                <span className="text-orange-500 text-xs">{f.icon}</span>
                <span className="text-zinc-300">{f.label}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
              Fonte: <span className="text-orange-400">service.cataloko.com/api/search/v4</span>
            </div>
          </div>

          {/* Coluna centro — configurações + métricas */}
          <div className="space-y-4">

            {/* Configurações — só quando parado */}
            {!running && !paused && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Configuração</p>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Página inicial</label>
                  <input type="number" min={0} value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                  <p className="text-xs text-zinc-600 mt-1">0 = início do catálogo</p>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Páginas por batch</label>
                  <input type="number" min={1} max={3} value={pagesPerBatch}
                    onChange={(e) => setPagesPerBatch(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                  <p className="text-xs text-zinc-600 mt-1">{pagesPerBatch * 60} produtos/batch · máx 3</p>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Total de batches</label>
                  <input type="number" min={1} value={totalBatches}
                    onChange={(e) => setTotalBatches(parseInt(e.target.value) || 5)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                  <p className="text-xs text-zinc-600 mt-1">~{estimatedProducts.toLocaleString()} produtos nesta sessão</p>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Filtrar por marca <span className="text-zinc-600">(opcional)</span></label>
                  <input type="text" placeholder="ex: nike, adidas, new-balance..."
                    value={marcaFiltro}
                    onChange={(e) => setMarcaFiltro(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder-zinc-600"
                  />
                  <p className="text-xs text-zinc-600 mt-1">Limite: 100 páginas por marca (6.000 produtos)</p>
                </div>
              </div>
            )}

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Criados / Atualizados", value: totals.success,  color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-900" },
                { label: "Não encontrados",        value: totals.notFound, color: "text-amber-400",   bg: "bg-amber-950 border-amber-900" },
                { label: "Falhas",                 value: totals.failed,   color: "text-red-400",     bg: "bg-red-950 border-red-900" },
                { label: "Batches",                value: totals.batches,  color: "text-blue-400",    bg: "bg-blue-950 border-blue-900" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} border rounded-xl p-3`}>
                  <p className="text-xs text-zinc-500 mb-1 leading-tight">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {totals.batches > 0 && (
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Progresso da sessão</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-2">
              {!running && !paused && (
                <button onClick={startSync}
                  className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-black font-bold py-3 rounded-xl transition text-sm tracking-wide">
                  {done ? "↺ Reiniciar" : "▶ Iniciar Sincronização"}
                </button>
              )}
              {running && (
                <button onClick={handlePause}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition text-sm">
                  ⏸ Pausar
                </button>
              )}
              {paused && (
                <button onClick={() => { setPaused(false); startSync(); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-sm">
                  ▶ Retomar (p. {currentPage})
                </button>
              )}
              {(totals.batches > 0 || paused) && !running && (
                <button onClick={reset}
                  className="w-full border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white py-2 rounded-xl transition text-sm">
                  ↺ Resetar
                </button>
              )}
              {running && (
                <div className="flex items-center justify-center gap-2 text-orange-400 text-xs py-1">
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Últimos salvos</p>
                <div className="space-y-2">
                  {lastSynced.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300 font-mono truncate max-w-[120px]">{item.sku}</span>
                      <span className="text-xs text-zinc-500">{item.images} imgs</span>
                      <span className="text-xs text-emerald-500">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal de log */}
            {logs.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex-1">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest">Log</span>
                  <span className="text-xs text-zinc-600">{logs.length} entradas</span>
                </div>
                <div className="h-64 overflow-y-auto p-3 space-y-1 text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-zinc-600 shrink-0">{log.time}</span>
                      <span className={logColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {/* Dica inicial */}
            {logs.length === 0 && !running && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs text-zinc-500">
                <p className="text-zinc-300 font-semibold text-sm">Como usar</p>
                <p>1. Configure a <span className="text-zinc-300">página inicial</span> (0 = começo)</p>
                <p>2. Use <span className="text-zinc-300">1 página/batch</span> para testar</p>
                <p>3. Aumente gradualmente para <span className="text-zinc-300">2–3 páginas</span></p>
                <p>4. Pause e retome a qualquer momento</p>
                <p className="pt-1 text-zinc-600">Catálogo droper: ~64.000 produtos</p>
              </div>
            )}
          </div>
        </div>

        {/* Erros detalhados */}
        {errors.length > 0 && (
          <details className="bg-zinc-900 border border-red-900 rounded-xl overflow-hidden">
            <summary className="px-5 py-3 text-xs text-red-400 cursor-pointer hover:text-red-300 select-none">
              ❌ {errors.length} erros — clique para expandir
            </summary>
            <div className="px-5 pb-4 space-y-1 text-xs text-red-400 max-h-48 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="border-t border-red-900/50 pt-1">• {e}</div>
              ))}
            </div>
          </details>
        )}

        {/* Banner de sucesso */}
        {done && (
          <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-emerald-300 font-semibold">Sincronização completa!</p>
              <p className="text-emerald-500 text-sm">{totals.success} produtos importados da droper.app com imagens, descrições e ficha técnica.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
