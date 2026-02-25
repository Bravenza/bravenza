import { type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryStateHandlerProps {
  /** React Query isLoading flag */
  isLoading: boolean;
  /** React Query isError flag */
  isError: boolean;
  /** React Query error object */
  error?: Error | null;
  /** React Query refetch function */
  onRetry?: () => void;
  /** Skeleton component shown during loading */
  skeleton: ReactNode;
  /** The actual content rendered on success */
  children: ReactNode;
  /** Custom error message (default: "Erro ao carregar dados") */
  errorMessage?: string;
}

/**
 * Wrapper que padroniza os 3 estados de uma query React Query:
 * 1. isLoading → exibe skeleton
 * 2. isError → exibe mensagem de erro com botão de retry
 * 3. sucesso → exibe children
 *
 * Uso:
 * ```tsx
 * <QueryStateHandler
 *   isLoading={isLoading}
 *   isError={isError}
 *   error={error}
 *   onRetry={refetch}
 *   skeleton={<OrdersTabSkeleton />}
 * >
 *   <OrdersList orders={data} />
 * </QueryStateHandler>
 * ```
 */
export function QueryStateHandler({
  isLoading,
  isError,
  error,
  onRetry,
  skeleton,
  children,
  errorMessage = "Erro ao carregar dados",
}: QueryStateHandlerProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="alert">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium mb-1">{errorMessage}</p>
        {error?.message && (
          <p className="text-xs text-muted-foreground mb-4 max-w-sm">
            {error.message}
          </p>
        )}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={() => onRetry()} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
