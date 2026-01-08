import { useState } from "react";
import { useLocation } from "wouter";
import { 
  FileText, 
  User, 
  Mail, 
  ExternalLink, 
  Plus,
  Send,
  Eye,
  Copy,
  Check,
  Loader2,
  Calendar,
  DollarSign,
  Users,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

/**
 * Action types that the AI can suggest
 */
export type AIActionType = 
  | "create_invoice"
  | "view_invoice"
  | "view_client"
  | "send_reminder"
  | "navigate"
  | "copy_text"
  | "create_client"
  | "view_analytics"
  | "schedule_reminder";

/**
 * Action data structure embedded in AI responses
 */
export interface AIAction {
  type: AIActionType;
  label: string;
  data?: Record<string, string | number | boolean>;
}

/**
 * Parse AI response content to extract action buttons
 * Actions are embedded using the format: [[action:type|label|data]]
 * Example: [[action:create_invoice|Create Invoice|{"clientName":"John"}]]
 */
export function parseAIResponse(content: string): {
  text: string;
  actions: AIAction[];
} {
  const actionRegex = /\[\[action:(\w+)\|([^|]+)(?:\|([^\]]+))?\]\]/g;
  const actions: AIAction[] = [];
  
  // Extract actions and replace with empty string
  const text = content.replace(actionRegex, (_, type, label, dataStr) => {
    let data: Record<string, string | number | boolean> | undefined;
    
    if (dataStr) {
      try {
        data = JSON.parse(dataStr);
      } catch {
        // If JSON parsing fails, try to parse as simple key=value pairs
        data = {};
        dataStr.split(",").forEach((pair: string) => {
          const [key, value] = pair.split("=");
          if (key && value) {
            data![key.trim()] = value.trim();
          }
        });
      }
    }
    
    actions.push({
      type: type as AIActionType,
      label,
      data,
    });
    
    return ""; // Remove the action marker from displayed text
  });
  
  return { text: text.trim(), actions };
}

/**
 * Get icon for action type
 */
function getActionIcon(type: AIActionType) {
  switch (type) {
    case "create_invoice":
      return Plus;
    case "view_invoice":
      return FileText;
    case "view_client":
      return User;
    case "send_reminder":
      return Send;
    case "navigate":
      return ExternalLink;
    case "copy_text":
      return Copy;
    case "create_client":
      return Users;
    case "view_analytics":
      return BarChart3;
    case "schedule_reminder":
      return Calendar;
    default:
      return ExternalLink;
  }
}

/**
 * Get action button variant based on type
 */
function getActionVariant(type: AIActionType): "default" | "secondary" | "outline" {
  switch (type) {
    case "create_invoice":
    case "create_client":
      return "default";
    case "send_reminder":
      return "secondary";
    default:
      return "outline";
  }
}

interface AIActionButtonProps {
  action: AIAction;
  onComplete?: () => void;
  className?: string;
}

/**
 * Renders a single action button that executes the specified action
 */
export function AIActionButton({ action, onComplete, className }: AIActionButtonProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const sendReminderMutation = trpc.invoices.sendReminder.useMutation();
  
  const Icon = getActionIcon(action.type);
  const variant = getActionVariant(action.type);
  
  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      switch (action.type) {
        case "create_invoice":
          // Navigate to create invoice page with pre-filled data
          const invoiceParams = new URLSearchParams();
          if (action.data?.clientId) {
            invoiceParams.set("clientId", String(action.data.clientId));
          }
          if (action.data?.clientName) {
            invoiceParams.set("clientName", String(action.data.clientName));
          }
          navigate(`/invoices/create${invoiceParams.toString() ? `?${invoiceParams}` : ""}`);
          break;
          
        case "view_invoice":
          if (action.data?.invoiceId) {
            navigate(`/invoices/${action.data.invoiceId}`);
          } else {
            navigate("/invoices");
          }
          break;
          
        case "view_client":
          if (action.data?.clientId) {
            navigate(`/clients/${action.data.clientId}`);
          } else {
            navigate("/clients");
          }
          break;
          
        case "create_client":
          navigate("/clients/new");
          break;
          
        case "send_reminder":
          if (action.data?.invoiceId) {
            await sendReminderMutation.mutateAsync({
              id: Number(action.data.invoiceId),
            });
            setIsComplete(true);
          }
          break;
          
        case "navigate":
          if (action.data?.path) {
            navigate(String(action.data.path));
          }
          break;
          
        case "copy_text":
          if (action.data?.text) {
            await navigator.clipboard.writeText(String(action.data.text));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
          break;
          
        case "view_analytics":
          navigate("/analytics");
          break;
          
        case "schedule_reminder":
          // Navigate to settings reminders tab
          navigate("/settings?tab=reminders");
          break;
          
        default:
          console.warn("Unknown action type:", action.type);
      }
      
      onComplete?.();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      disabled={isLoading || isComplete}
      className={cn(
        "gap-2 transition-all",
        isComplete && "bg-green-500/20 text-green-600 border-green-500/30",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isComplete ? (
        <Check className="h-3.5 w-3.5" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      <span>{copied ? "Copied!" : isComplete ? "Done" : action.label}</span>
    </Button>
  );
}

interface AIActionButtonGroupProps {
  actions: AIAction[];
  onActionComplete?: () => void;
  className?: string;
}

/**
 * Renders a group of action buttons
 */
export function AIActionButtonGroup({ actions, onActionComplete, className }: AIActionButtonGroupProps) {
  if (actions.length === 0) return null;
  
  return (
    <div className={cn("flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50", className)}>
      {actions.map((action, index) => (
        <AIActionButton
          key={`${action.type}-${index}`}
          action={action}
          onComplete={onActionComplete}
        />
      ))}
    </div>
  );
}

/**
 * Component that renders AI message content with action buttons
 */
interface AIMessageContentProps {
  content: string;
  isStreaming?: boolean;
  onActionComplete?: () => void;
}

export function AIMessageContent({ content, isStreaming, onActionComplete }: AIMessageContentProps) {
  // Don't parse actions while streaming
  if (isStreaming) {
    return <span>{content}</span>;
  }
  
  const { text, actions } = parseAIResponse(content);
  
  return (
    <div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {/* Use Streamdown for markdown rendering */}
        {text}
      </div>
      <AIActionButtonGroup actions={actions} onActionComplete={onActionComplete} />
    </div>
  );
}
