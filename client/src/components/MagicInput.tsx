import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, X, Wand2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface ExtractedData {
  clientName?: string;
  clientEmail?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  dueDate?: string;
  notes?: string;
  currency?: string;
}

interface MagicInputProps {
  onExtract: (data: ExtractedData) => void;
  onClose?: () => void;
  className?: string;
}

export function MagicInput({ onExtract, onClose, className }: MagicInputProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: credits } = trpc.ai.getCredits.useQuery();
  
  const smartCompose = trpc.ai.smartCompose.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        onExtract(result.data);
        setInput("");
        setIsExpanded(false);
      }
    },
  });

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = () => {
    if (!input.trim() || smartCompose.isPending) return;
    smartCompose.mutate({ text: input.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
      setInput("");
    }
  };

  const hasCredits = credits && credits.remaining > 0;
  const isLoading = smartCompose.isPending;

  if (!isExpanded) {
    return (
      <Button
        data-magic-invoice
        variant="outline"
        onClick={() => setIsExpanded(true)}
        className={cn(
          "gap-2 border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all",
          className
        )}
        disabled={!hasCredits}
      >
        <Wand2 className="h-4 w-4 text-primary" />
        <span>Magic Invoice</span>
        {credits && (
          <Badge variant="secondary" className="ml-1 text-xs">
            {credits.remaining}/{credits.limit}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div 
      data-magic-invoice
      className={cn(
        "relative rounded-lg border border-primary/30 bg-card p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Magic Invoice</h3>
            <p className="text-xs text-muted-foreground">
              Describe your invoice in plain English
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {credits && (
            <Badge variant={credits.remaining > 0 ? "secondary" : "destructive"} className="text-xs">
              {credits.remaining} credits left
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsExpanded(false);
              setInput("");
              onClose?.();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Input */}
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Try: "Invoice Acme Corp for website redesign, $5000, due in 2 weeks"'
        className="min-h-[80px] resize-none bg-background/50 border-muted focus:border-primary"
        disabled={isLoading}
      />

      {/* Error message */}
      {smartCompose.error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{smartCompose.error.message}</span>
        </div>
      )}

      {/* API error from result */}
      {smartCompose.data && !smartCompose.data.success && (
        <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{smartCompose.data.error}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono ml-0.5">Enter</kbd> to generate
        </p>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || !hasCredits}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Examples */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2">Examples:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Invoice John for 10 hours of consulting at $150/hr",
            "Bill ABC Corp $2500 for logo design, due net 30",
            "3 website pages at $800 each for Tech Startup Inc",
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setInput(example)}
              className="text-xs px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact trigger button for use in forms
 */
export function MagicInputTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  const { data: credits } = trpc.ai.getCredits.useQuery();
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors",
        className
      )}
      title={credits ? `${credits.remaining} AI credits remaining` : "AI-powered invoice creation"}
    >
      <Sparkles className="h-3 w-3" />
      <span>Use AI</span>
    </button>
  );
}
