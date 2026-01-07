import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Types for undoable actions
interface UndoableAction {
  id: string;
  type: 'delete' | 'update' | 'create';
  entityType: 'client' | 'invoice' | 'expense' | 'product' | 'estimate' | 'recurring';
  description: string;
  undo: () => void;
  timestamp: number;
}

interface KeyboardShortcutsContextType {
  // Undo stack
  undoStack: UndoableAction[];
  pushUndoAction: (action: Omit<UndoableAction, 'id' | 'timestamp'>) => void;
  popUndoAction: () => UndoableAction | undefined;
  clearUndoStack: () => void;
  
  // Search
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  
  // Shortcuts help
  isShortcutsHelpOpen: boolean;
  setShortcutsHelpOpen: (open: boolean) => void;
  
  // Register custom shortcuts
  registerShortcut: (key: string, callback: () => void) => void;
  unregisterShortcut: (key: string) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

// Generate unique ID for actions
const generateId = () => Math.random().toString(36).substring(2, 9);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isShortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const customShortcuts = useRef<Map<string, () => void>>(new Map());

  // Push an undoable action to the stack
  const pushUndoAction = useCallback((action: Omit<UndoableAction, 'id' | 'timestamp'>) => {
    const newAction: UndoableAction = {
      ...action,
      id: generateId(),
      timestamp: Date.now(),
    };
    
    setUndoStack((prev) => {
      // Keep only last 10 actions and remove actions older than 30 seconds
      const now = Date.now();
      const filtered = prev.filter((a) => now - a.timestamp < 30000).slice(-9);
      return [...filtered, newAction];
    });
  }, []);

  // Pop the most recent undoable action
  const popUndoAction = useCallback(() => {
    let poppedAction: UndoableAction | undefined;
    
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      poppedAction = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    
    return poppedAction;
  }, []);

  // Clear the undo stack
  const clearUndoStack = useCallback(() => {
    setUndoStack([]);
  }, []);

  // Register a custom shortcut
  const registerShortcut = useCallback((key: string, callback: () => void) => {
    customShortcuts.current.set(key, callback);
  }, []);

  // Unregister a custom shortcut
  const unregisterShortcut = useCallback((key: string) => {
    customShortcuts.current.delete(key);
  }, []);

  // Handle Cmd+Z undo
  const handleUndo = useCallback(() => {
    const action = undoStack[undoStack.length - 1];
    if (action) {
      // Check if action is still within the undo window (30 seconds)
      if (Date.now() - action.timestamp < 30000) {
        action.undo();
        setUndoStack((prev) => prev.slice(0, -1));
        toast.success(`Undone: ${action.description}`);
      } else {
        toast.error('Undo window expired');
        setUndoStack((prev) => prev.filter((a) => Date.now() - a.timestamp < 30000));
      }
    } else {
      toast.info('Nothing to undo');
    }
  }, [undoStack]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      // Cmd/Ctrl + K - Open search (works even in inputs)
      if (modifier && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Escape - Close search or help
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setSearchOpen(false);
          return;
        }
        if (isShortcutsHelpOpen) {
          setShortcutsHelpOpen(false);
          return;
        }
      }

      // Don't process other shortcuts when in input
      if (isInput) return;

      // Cmd/Ctrl + Z - Undo
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShortcutsHelpOpen(true);
        return;
      }

      // Check custom shortcuts
      const shortcutKey = `${modifier ? 'mod+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`;
      const customHandler = customShortcuts.current.get(shortcutKey);
      if (customHandler) {
        e.preventDefault();
        customHandler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isShortcutsHelpOpen, handleUndo]);

  // Clean up expired actions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUndoStack((prev) => prev.filter((a) => Date.now() - a.timestamp < 30000));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const value: KeyboardShortcutsContextType = {
    undoStack,
    pushUndoAction,
    popUndoAction,
    clearUndoStack,
    isSearchOpen,
    setSearchOpen,
    isShortcutsHelpOpen,
    setShortcutsHelpOpen,
    registerShortcut,
    unregisterShortcut,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

// Hook for registering page-specific shortcuts
export function useShortcut(key: string, callback: () => void, deps: any[] = []) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  
  useEffect(() => {
    registerShortcut(key, callback);
    return () => unregisterShortcut(key);
  }, [key, registerShortcut, unregisterShortcut, ...deps]);
}
