import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Section name shown in the error UI */
  section?: string;
  /** When this key changes, error state resets (use location.pathname) */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * RouteErrorBoundary — Per-route error isolation.
 *
 * Unlike the global ErrorBoundary, this one:
 * - Shows a lighter, inline error UI (not full-screen)
 * - Allows retry without full page reload
 * - Displays the section name for context
 * - Resets automatically on navigation via resetKey
 *
 * Pattern used by: Remix (errorElement), Next.js (error.tsx)
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[RouteError:${this.props.section ?? "unknown"}]`, error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6" role="alert">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Erro {this.props.section ? `em ${this.props.section}` : "na seção"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Esta seção encontrou um problema. As demais continuam funcionando.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={this.handleGoBack} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Button>
              <Button size="sm" onClick={this.handleRetry} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs text-left bg-muted/50 p-2 rounded-lg overflow-auto max-h-32 text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
