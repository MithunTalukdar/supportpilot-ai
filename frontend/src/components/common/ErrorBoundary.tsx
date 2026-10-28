import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Card, CardContent } from '../ui/Card.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-darkest">
          <Card className="max-w-md w-full border-rose-500/20">
            <CardContent className="text-center py-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Something went wrong</h2>
              <p className="text-sm text-slate-400 mt-2 mb-6">
                An unexpected UI rendering error occurred. You can retry safely.
              </p>
              {this.state.error && (
                <div className="p-3 mb-6 bg-black/40 rounded-xl text-left border border-white/5 overflow-auto max-h-32 text-xs font-mono text-rose-300">
                  {this.state.error.message}
                </div>
              )}
              <Button
                variant="primary"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="w-full"
              >
                Reload Component
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
