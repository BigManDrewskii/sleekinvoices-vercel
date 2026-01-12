import { useState, useRef, useEffect } from "react";
import { Loader2, X, Wand2, AlertCircle, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { SleekyAIAvatar } from "@/components/SleekyAIAvatar";

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

  // Collapsed state - elegant inline button
  if (!isExpanded) {
    return (
      <button
        data-magic-invoice
        onClick={() => setIsExpanded(true)}
        disabled={!hasCredits}
        className={cn(
          "group w-full flex items-center gap-3 px-4 py-3 rounded-xl",
          "bg-gradient-to-r from-primary/5 via-primary/8 to-emerald-500/5",
          "border border-primary/20 hover:border-primary/40",
          "transition-all duration-300 hover:shadow-lg hover:shadow-primary/10",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <SleekyAIAvatar size="sm" className="ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Sleeky's Magic Invoice</span>
            {credits && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {credits.remaining}/{credits.limit}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Describe your invoice in plain English
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </button>
    );
  }

  // Expanded state - full input experience
  return (
    <div 
      data-magic-invoice
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-card via-card to-card/95",
        "border border-primary/30",
        "shadow-xl shadow-primary/5",
        "animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/30">
              <SleekyAIAvatar size="sm" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sleeky's Magic Invoice</h3>
              <p className="text-xs text-muted-foreground">
                AI-powered invoice creation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {credits && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                credits.remaining > 0 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "bg-red-500/10 text-red-500"
              )}>
                <Zap className="h-3 w-3" />
                {credits.remaining} credits
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted/80"
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

        {/* Input Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Try: "Invoice Acme Corp for website redesign, $5000, due in 2 weeks"'
            className={cn(
              "min-h-[100px] resize-none",
              "bg-background/60 backdrop-blur-sm",
              "border-muted/50 focus:border-primary/50",
              "rounded-xl",
              "text-sm leading-relaxed",
              "placeholder:text-muted-foreground/60"
            )}
            disabled={isLoading}
          />
          
          {/* Character hint */}
          {input.length > 0 && (
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/50">
              {input.length} chars
            </div>
          )}
        </div>

        {/* Error Messages */}
        {smartCompose.error && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{smartCompose.error.message}</span>
          </div>
        )}

        {smartCompose.data && !smartCompose.data.success && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{smartCompose.data.error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-mono">⌘</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-mono">Enter</kbd>
            <span className="ml-1">to generate</span>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || !hasCredits}
            className="gap-2 rounded-lg px-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Generate Invoice</span>
              </>
            )}
          </Button>
        </div>

        {/* Quick Examples */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2.5 font-medium">Quick examples</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Invoice John for 10 hours consulting at $150/hr",
              "Bill ABC Corp $2500 for logo design, due net 30",
              "3 website pages at $800 each for Tech Startup",
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setInput(example)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full",
                  "bg-muted/40 hover:bg-muted/80",
                  "text-muted-foreground hover:text-foreground",
                  "border border-transparent hover:border-border/50",
                  "transition-all duration-200"
                )}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
