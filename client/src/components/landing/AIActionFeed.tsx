import { Check } from "lucide-react";

interface AIAction {
  text: string;
  time: string;
}

const actions: AIAction[] = [
  {
    text: "Generated invoice from email",
    time: "3 seconds ago",
  },
  {
    text: 'Matched client "Acme Corp" automatically',
    time: "Just now",
  },
  {
    text: "Applied standard payment terms",
    time: "Just now",
  },
  {
    text: "Sent invoice via email",
    time: "Just now",
  },
  {
    text: "Scheduled payment reminder",
    time: "Just now",
  },
  {
    text: "Updated invoice status to 'Sent'",
    time: "Just now",
  },
];

export function AIActionFeed() {
  return (
    <div className="space-y-4">
      {/* Each action appears with stagger animation */}
      {actions.map((action, i) => (
        <div
          key={i}
          className="stagger-fade-in flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {/* Checkmark Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-3 w-3 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <span className="text-foreground font-medium">{action.text}</span>
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {action.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
