import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: { sku: string; imageUrl: string }[];
  remaining: number;
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
      <div className="flex items-center gap-3">
        <Button onClick={handleSync} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ImageIcon className="h-4 w-4 mr-1" />}
          {loading ? "Sincronizando..." : "Sincronizar Imagens (10 SKUs)"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Busca imagens via StockX API e salva no storage. Processa 10 SKUs por vez.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Buscando imagens e fazendo upload...
        </p>
      )}

      {response && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <p className="font-medium text-sm">{response.message}</p>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{response.result.success} sincronizados</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span>{response.result.failed} falhas</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span>{response.result.skipped} pulados</span>
            </div>
            <div className="text-muted-foreground">
              📦 {response.result.remaining} restantes
            </div>
          </div>

          {response.result.details.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">Ver detalhes</summary>
              <ul className="mt-1 text-xs space-y-1">
                {response.result.details.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="font-mono">{d.sku}</span>
                    <a href={d.imageUrl} target="_blank" rel="noopener" className="text-primary underline truncate max-w-xs">ver imagem</a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {response.result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-destructive cursor-pointer">Ver erros ({response.result.errors.length})</summary>
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
