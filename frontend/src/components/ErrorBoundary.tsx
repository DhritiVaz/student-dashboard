import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error:", error, info);
  }

  handleRetry = () => {
    this.props.onReset?.();
    this.setState((s) => ({ hasError: false, retryKey: s.retryKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const err = this.state.error;
      const errMsg = import.meta.env.DEV && err ? String(err.message) : null;
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-8"
          style={{ background: "#0e0e0e", color: "#e5e5e5" }}
        >
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-[#a3a3a3] mb-6 max-w-md text-center">
            This might be temporary.
          </p>
          {errMsg && (
            <p className="text-xs text-[#71717a] mb-4 max-w-lg text-center font-mono">
              {errMsg}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            aria-label="Retry"
            className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-[#444]"
            style={{ background: "#333", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      );
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}
