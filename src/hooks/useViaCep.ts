import { useRef, useCallback, useState } from "react";

interface ViaCepResult {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

/**
 * Shared ViaCEP hook with built-in 400ms debounce.
 * Prevents duplicate requests when user types quickly.
 */
export function useViaCep(onResult: (data: ViaCepResult) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback((cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    // Cancel any pending request / timer
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
          signal: controller.signal,
        });
        const data: ViaCepResult = await res.json();
        if (!data.erro) onResult(data);
      } catch (err: any) {
        if (err.name !== "AbortError") console.warn("ViaCEP error", err);
      } finally {
        setIsLoading(false);
      }
    }, 400);
  }, [onResult]);

  return { lookup, isLoading };
}
