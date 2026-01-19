import { cn } from "@/lib/utils";
import { RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 text-center">
            {/* Sleeky Error Image */}
            <img
              src="/sleeky/error-states/error.png"
              alt="Sleeky looking concerned about the error"
              loading="lazy"
              className="h-48 w-48 object-contain mb-6 animate-bounce-subtle"
            />

            <h2 className="text-2xl font-semibold mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6">
              Don't worry, Sleeky is on it! Try refreshing the page or going
              back to the dashboard.
            </p>

            {/* Error details (collapsed by default in production) */}
            {import.meta.env.DEV && this.state.error?.stack && (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 text-left">
                <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-muted text-foreground",
                  "hover:bg-muted/80 cursor-pointer"
                )}
              >
                <Home size={16} />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
