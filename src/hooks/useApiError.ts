import { useCallback } from "react";
import { toast } from "sonner";

interface ApiErrorOptions {
  /** Custom message shown in the toast. Falls back to error.message */
  fallbackMessage?: string;
  /** If true, silently logs without showing a toast (default: false) */
  silent?: boolean;
}

interface ApiError {
  message?: string;
  code?: string;
  status?: number;
}

/**
 * Centralised handler for errors returned by Edge Functions / fetch calls.
 *
 * Usage:
 * ```ts
 * const { handleError } = useApiError();
 *
 * try { await fetchSomething(); }
 * catch (err) { handleError(err, { fallbackMessage: "Falha ao carregar dados" }); }
 * ```
 */
export function useApiError() {
  const handleError = useCallback(
    (error: unknown, options: ApiErrorOptions = {}) => {
      const { fallbackMessage = "Ocorreu um erro inesperado.", silent = false } = options;

      // Normalise the error shape
      let message = fallbackMessage;
      let code: string | undefined;
      let status: number | undefined;

      if (error instanceof Response) {
        status = error.status;
        message = `Erro ${status}: ${fallbackMessage}`;
      } else if (error instanceof Error) {
        message = error.message || fallbackMessage;
      } else if (typeof error === "object" && error !== null) {
        const apiErr = error as ApiError;
        message = apiErr.message || fallbackMessage;
        code = apiErr.code;
        status = apiErr.status;
      }

      // Always log for observability
      console.error("[API Error]", { message, code, status, raw: error });

      if (!silent) {
        toast.error(message);
      }

      return { message, code, status };
    },
    [],
  );

  return { handleError };
}
