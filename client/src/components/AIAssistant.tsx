import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  FileText, 
  Users, 
  Calculator,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  Wand2,
  MessageSquare,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Orb } from "@/components/ui/orb";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { parseAIResponse, AIActionButtonGroup } from "./AIActionButton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "create-invoice",
    label: "Create Invoice",
    icon: FileText,
    prompt: "Help me create a new invoice",
    description: "AI-assisted invoice creation"
  },
  {
    id: "analyze-revenue",
    label: "Revenue Insights",
    icon: TrendingUp,
    prompt: "Analyze my revenue trends and provide insights",
    description: "Get AI-powered business insights"
  },
  {
    id: "overdue-follow-up",
    label: "Follow-up Drafts",
    icon: Clock,
    prompt: "Help me draft follow-up emails for overdue invoices",
    description: "Generate professional reminders"
  },
  {
    id: "client-summary",
    label: "Client Summary",
    icon: Users,
    prompt: "Give me a summary of my top clients by revenue",
    description: "Understand your client base"
  },
];

const CONTEXTUAL_SUGGESTIONS: Record<string, string[]> = {
  "/dashboard": [
    "What's my revenue this month?",
    "Which invoices are overdue?",
    "Create a quick invoice"
  ],
  "/invoices": [
    "Help me create a new invoice",
    "Which invoices need follow-up?",
    "Export my invoices"
  ],
  "/clients": [
    "Who are my top clients?",
    "Add a new client",
    "Which clients have unpaid invoices?"
  ],
  "/analytics": [
    "Explain my revenue trends",
    "Compare this month to last month",
    "What's my average invoice value?"
  ],
};

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [location] = useLocation();

  const { data: credits } = trpc.ai.getCredits.useQuery();
  const { data: stats } = trpc.analytics.getStats.useQuery();
  
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === "assistant" && updated[lastIndex]?.isStreaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: response.content,
            isStreaming: false,
          };
        }
        return updated;
      });
      setIsTyping(false);
    },
    onError: (error) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === "assistant" && updated[lastIndex]?.isStreaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
            isStreaming: false,
          };
        }
        return updated;
      });
      setIsTyping(false);
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback((content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsTyping(true);

    // Build context from conversation history
    const conversationHistory = messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    chatMutation.mutate({
      message: content.trim(),
      context: {
        currentPage: location,
        conversationHistory,
        stats: stats ? {
          totalRevenue: stats.totalRevenue,
          outstandingBalance: stats.outstandingBalance,
          totalInvoices: stats.totalInvoices,
          paidInvoices: stats.paidInvoices,
        } : undefined,
      },
    });
  }, [isTyping, messages, location, stats, chatMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const contextualSuggestions = CONTEXTUAL_SUGGESTIONS[location] || CONTEXTUAL_SUGGESTIONS["/dashboard"];

  const hasCredits = credits && credits.remaining > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {credits ? `${credits.remaining} credits remaining` : "Loading..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClearChat}
              title="Clear conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {messages.length === 0 ? (
          <div className="p-4 space-y-6">
            {/* Welcome */}
            <div className="text-center py-6">
              <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">How can I help?</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                I can help you create invoices, analyze your business, and more.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-1">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={!hasCredits || isTyping}
                    className="flex flex-col items-start p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <action.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contextual Suggestions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-1">Suggestions</p>
              <div className="space-y-1">
                {contextualSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    disabled={!hasCredits || isTyping}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent text-left text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{suggestion}</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    message.isStreaming && !message.content ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    ) : (
                      (() => {
                        const { text, actions } = parseAIResponse(message.content);
                        return (
                          <div>
<MarkdownRenderer 
                                              content={text} 
                                              isStreaming={message.isStreaming}
                                              className="prose prose-sm dark:prose-invert max-w-none"
                                            />
                            {!message.isStreaming && actions.length > 0 && (
                              <AIActionButtonGroup actions={actions} />
                            )}
                          </div>
                        );
                      })()
                    )
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background/50">
        {!hasCredits && (
          <div className="mb-3 p-2 rounded-lg bg-destructive/10 text-destructive text-xs text-center">
            No AI credits remaining. Upgrade to Pro for more credits.
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasCredits ? "Ask me anything..." : "No credits remaining"}
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={!hasCredits || isTyping}
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || !hasCredits || isTyping}
            className="shrink-0 h-[44px] w-[44px]"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Floating AI Assistant trigger button with animated orb
 */
export function AIAssistantTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  const { data: credits } = trpc.ai.getCredits.useQuery();
  
  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <Orb
        onClick={onClick}
        size="md"
        state="idle"
        colors={["#818cf8", "#6366f1"]}
        className="shadow-lg hover:shadow-xl"
      />
      {credits && credits.remaining > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-[10px] font-bold flex items-center justify-center text-white shadow-md z-10">
          {credits.remaining > 9 ? "9+" : credits.remaining}
        </span>
      )}
    </div>
  );
}
