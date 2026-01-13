import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Loader2,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  MessageCircle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Orb } from "@/components/ui/orb";
import { cn } from "@/lib/utils";
import { SleekyAvatar } from "@/components/SleekyAvatar";
import { LowCreditsPrompt, CreditTopUp } from "@/components/CreditTopUp";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
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
  const { user } = useAuth();

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

  const handleExportConversation = () => {
    if (messages.length === 0) return;

    // Format the conversation as text
    const header = `SleekInvoices AI Assistant - Conversation Export\n`;
    const divider = `${'='.repeat(50)}\n`;
    const exportDate = `Exported on: ${new Date().toLocaleString()}\n\n`;
    
    const conversationText = messages.map((msg) => {
      const role = msg.role === 'user' ? 'You' : 'AI Assistant';
      const timestamp = msg.timestamp.toLocaleTimeString();
      // Strip any action buttons from assistant messages
      const content = msg.role === 'assistant' 
        ? msg.content.replace(/\[ACTION:.*?\]/g, '').trim()
        : msg.content;
      return `[${timestamp}] ${role}:\n${content}\n`;
    }).join('\n' + '-'.repeat(40) + '\n\n');

    const fullText = header + divider + exportDate + conversationText;

    // Create and download the file
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sleek-ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const contextualSuggestions = CONTEXTUAL_SUGGESTIONS[location] || CONTEXTUAL_SUGGESTIONS["/dashboard"];

  const hasCredits = credits && credits.remaining > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-gradient-to-b from-background via-background to-background/95 border-l border-border/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        
        {/* Header - Manus-inspired minimal design */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-border/40">
          {/* Subtle gradient accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex items-center gap-3">
<SleekyAvatar size="md" bordered glow />
            <div>
              <h2 className="font-semibold text-[15px] tracking-tight">Sleeky AI Assistant</h2>
              <p className="text-xs text-muted-foreground/80">
                {credits ? (
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      credits.remaining > 10 ? "bg-emerald-500" : credits.remaining > 0 ? "bg-amber-500" : "bg-destructive/100"
                    )} />
                    {credits.remaining} credits
                  </span>
                ) : (
                  "Loading..."
                )}
              </p>
            </div>
          </div>
          
          {/* Top-up button when low on credits */}
          {credits && credits.remaining <= 5 && (
            <CreditTopUp
              trigger={
                <Button variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-400">
                  + Get Credits
                </Button>
              }
            />
          )}
          
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-colors"
                  onClick={handleExportConversation}
                  title="Export conversation"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-colors"
                  onClick={handleClearChat}
                  title="Clear conversation"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-colors"
              onClick={onClose}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="p-5 space-y-8">
              {/* Welcome Section - Manus-inspired */}
              <div className="text-center pt-8 pb-4">
                <div className="relative inline-flex mb-5">
                  <SleekyAvatar size="xl" bordered={true} glow={true} />
                  {/* Animated glow */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">What can Sleeky help with?</h3>
                <p className="text-sm text-muted-foreground/80 max-w-[280px] mx-auto leading-relaxed">
                  Create invoices, analyze your business, draft emails, and more.
                </p>
              </div>

              {/* Quick Actions - Pill-style buttons like Manus */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-1">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      disabled={!hasCredits || isTyping}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-full",
                        "bg-muted/50 hover:bg-muted border border-border/50 hover:border-border",
                        "text-sm font-medium text-foreground/90 hover:text-foreground",
                        "transition-all duration-200 ease-out",
                        "hover:shadow-sm hover:-translate-y-0.5",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      )}
                    >
                      <action.icon className="h-4 w-4 text-primary/80" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contextual Suggestions - Clean list */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-1">Suggestions</p>
                <div className="space-y-1.5">
                  {contextualSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      disabled={!hasCredits || isTyping}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                        "bg-transparent hover:bg-muted/60",
                        "text-left text-sm text-muted-foreground hover:text-foreground",
                        "transition-all duration-200 group",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <Lightbulb className="h-4 w-4 text-amber-500/80 shrink-0" />
                      <span className="flex-1">{suggestion}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="shrink-0">
                      <SleekyAvatar size="sm" bordered={true} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/60 border border-border/30 rounded-bl-md"
                    )}
                  >
                    {message.role === "assistant" ? (
                      message.isStreaming && !message.content ? (
                        <div className="flex items-center gap-2.5 py-1">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                          </div>
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
                                className="max-w-none"
                              />
                              {!message.isStreaming && actions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/30">
                                  <AIActionButtonGroup actions={actions} />
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && user && (
                    <UserAvatar user={user} size="sm" bordered />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area - Manus-inspired clean design */}
        <div className="relative p-4 border-t border-border/40 bg-gradient-to-t from-muted/30 to-transparent">
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
          {!hasCredits && (
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-amber-600 dark:text-amber-400">No credits remaining.</span>
                  <span className="text-muted-foreground ml-1">Get more to continue.</span>
                </div>
                <CreditTopUp
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5 border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Top Up Credits
                    </Button>
                  }
                />
              </div>
            </div>
          )}
          
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={hasCredits ? "Ask me anything..." : "No credits remaining"}
                className={cn(
                  "w-full min-h-[48px] max-h-[120px] px-4 py-3 pr-12",
                  "bg-background border border-border/60 rounded-2xl",
                  "text-sm placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
                  "resize-none transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={!hasCredits || isTyping}
                rows={1}
              />
              {/* Character hint when typing */}
              {input.length > 0 && (
                <span className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/50">
                  ⏎
                </span>
              )}
            </div>
            <Button
              size="icon"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || !hasCredits || isTyping}
              className={cn(
                "shrink-0 h-12 w-12 rounded-xl",
                "bg-primary hover:bg-primary/90",
                "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:shadow-none"
              )}
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <p className="text-[11px] text-muted-foreground/60 mt-2.5 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * Floating AI Assistant trigger button with animated orb
 */
export function AIAssistantTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  const { data: credits } = trpc.ai.getCredits.useQuery();
  
  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)} data-onboarding="ai-assistant">
      <Orb
        onClick={onClick}
        size="md"
        state="idle"
        className="shadow-lg hover:shadow-xl transition-shadow duration-300"
      />
      {credits && credits.remaining > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-[10px] font-bold flex items-center justify-center text-white shadow-md ring-2 ring-background z-10">
          {credits.remaining}
        </span>
      )}
    </div>
  );
}
