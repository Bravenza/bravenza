import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Section name shown in the fallback UI */
  section?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Granular error boundary for individual sections/features.
 * Prevents a single section crash from taking down the entire page.
 * Pattern: Meta/Netflix
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SectionError:${this.props.section || "unknown"}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-border/40 bg-muted/20 my-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive/70" />
          </div>
          <p className="text-sm font-medium mb-1">
            Não foi possível carregar {this.props.section ? `"${this.props.section}"` : "esta seção"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">Um erro inesperado ocorreu nesta área.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
