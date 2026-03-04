import { useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // ajuste o path se necessário

interface SyncResult {
  success: number;
  failed: number;
  notFound: number;
  errors: string[];
}

interface SyncResponse {
  message: string;
  result: SyncResult;
}

export default function SyncDroperImages() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "sync-droper-images"
      );

      if (fnError) throw new Error(fnError.message);

      setResponse(data as SyncResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Sincronizar Imagens — Droper.app</h2>

      <button
        onClick={handleSync}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Sincronizando..." : "🔄 Sincronizar Imagens"}
      </button>

      {/* Loading */}
      {loading && (
        <div className="mt-4 text-gray-500 text-sm animate-pulse">
          Buscando imagens na Droper e salvando no catálogo...
        </div>
      )}

      {/* Resultado */}
      {response && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold text-green-800 mb-2">✅ {response.message}</p>
          <div className="text-sm text-green-700 space-y-1">
            <p>✔️ Atualizados: <strong>{response.result.success}</strong></p>
            <p>⚠️ SKUs não encontrados: <strong>{response.result.notFound}</strong></p>
            <p>❌ Falhas: <strong>{response.result.failed}</strong></p>
          </div>

          {response.result.errors.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer">Ver erros detalhados</summary>
              <ul className="mt-1 text-xs text-red-500 space-y-1">
                {response.result.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Erro geral */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ Erro: {error}
        </div>
      )}
    </div>
  );
}
