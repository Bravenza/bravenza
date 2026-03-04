import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon } from "lucide-react";

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
    <div className="space-y-4">
      <Button onClick={handleSync} disabled={loading} size="sm">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ImageIcon className="h-4 w-4 mr-1" />}
        {loading ? "Sincronizando..." : "🔄 Sincronizar Imagens"}
      </Button>

      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Buscando imagens na Droper e salvando no catálogo...
        </p>
      )}

      {response && (
        <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-2">
          <p className="font-semibold text-sm">✅ {response.message}</p>
          <div className="text-sm space-y-1">
            <p>✔️ Atualizados: <strong>{response.result.success}</strong></p>
            <p>⚠️ SKUs não encontrados: <strong>{response.result.notFound}</strong></p>
            <p>❌ Falhas: <strong>{response.result.failed}</strong></p>
          </div>

          {response.result.errors.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-destructive cursor-pointer">Ver erros detalhados</summary>
              <ul className="mt-1 text-xs text-destructive space-y-1">
                {response.result.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          ❌ Erro: {error}
        </div>
      )}
    </div>
  );
}
