import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogBody } from "@/components/shared/DialogPatterns";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Open search', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close dialog / search', category: 'Navigation' },
  
  // Actions
  { keys: ['⌘', 'Z'], description: 'Undo last delete', category: 'Actions' },
  { keys: ['⌘', 'N'], description: 'Create new invoice', category: 'Actions' },
  { keys: ['⌘', 'Shift', 'N'], description: 'Create new client', category: 'Actions' },
  { keys: ['⌘', 'Shift', 'E'], description: 'Create new expense', category: 'Actions' },
  
  // Help
  { keys: ['Shift', '?'], description: 'Show keyboard shortcuts', category: 'Help' },
];

// Group shortcuts by category
const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = [];
  }
  acc[shortcut.category].push(shortcut);
  return acc;
}, {} as Record<string, ShortcutItem[]>);

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp() {
  const { isShortcutsHelpOpen, setShortcutsHelpOpen } = useKeyboardShortcuts();
  
  // Detect if user is on Mac
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  // Replace ⌘ with Ctrl on non-Mac systems
  const formatKey = (key: string) => {
    if (key === '⌘' && !isMac) return 'Ctrl';
    return key;
  };

  return (
    <Dialog open={isShortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Quick actions to boost your productivity
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody spacing="relaxed">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                {category}
              </h4>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <ShortcutKey key={keyIndex}>{formatKey(key)}</ShortcutKey>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
            Press <ShortcutKey>Shift</ShortcutKey> + <ShortcutKey>?</ShortcutKey> anytime to show this help
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
