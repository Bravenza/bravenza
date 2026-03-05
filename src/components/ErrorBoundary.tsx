import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** When this key changes, error state resets (use location.pathname) */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorKey: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorKey: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4" role="alert">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold mb-2">Algo deu errado</h1>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Início
              </Button>
              <Button variant="outline" onClick={this.handleRetry} className="gap-2">
                Tentar novamente
              </Button>
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recarregar
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs text-left bg-muted/50 p-3 rounded-lg overflow-auto max-h-40 text-muted-foreground">
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
