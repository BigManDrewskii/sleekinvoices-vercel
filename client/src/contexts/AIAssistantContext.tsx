import { createContext, useContext, useState, useCallback, ReactNode, lazy, Suspense } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

// Lazy load the heavy AIAssistant component (contains streamdown/mermaid)
const AIAssistant = lazy(() => import("@/components/AIAssistant").then(m => ({ default: m.AIAssistant })));
const AIAssistantTrigger = lazy(() => import("@/components/AIAssistant").then(m => ({ default: m.AIAssistantTrigger })));

interface AIAssistantContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  isAvailable: boolean;
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider");
  }
  return context;
}

interface AIAssistantProviderProps {
  children: ReactNode;
}

// Lightweight trigger button that doesn't require Suspense
function TriggerFallback({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      aria-label="Open AI Assistant"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </button>
  );
}

// Pages where AI Assistant should NOT be shown (public pages)
const PUBLIC_PAGES = ["/landing", "/portal", "/terms", "/privacy", "/refund-policy"];

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: false });
  const [location] = useLocation();

  // Check if current page is a public page where AI should not be shown
  const isPublicPage = PUBLIC_PAGES.some(page => location.startsWith(page)) || location === "/";
  
  // AI Assistant is only available for authenticated users on non-public pages
  const isAvailable = isAuthenticated && !isPublicPage && !loading;

  const open = useCallback(() => {
    if (!isAvailable) return;
    setIsOpen(true);
    setHasBeenOpened(true);
  }, [isAvailable]);
  
  const close = useCallback(() => setIsOpen(false), []);
  
  const toggle = useCallback(() => {
    if (!isAvailable) return;
    setIsOpen((prev) => {
      if (!prev) setHasBeenOpened(true);
      return !prev;
    });
  }, [isAvailable]);

  return (
    <AIAssistantContext.Provider value={{ isOpen, open, close, toggle, isAvailable }}>
      {children}
      
      {/* Only render AI components when user is authenticated and not on public pages */}
      {isAvailable && (
        <>
          {/* Only load the heavy AIAssistant component when it's been opened at least once */}
          {hasBeenOpened && (
            <Suspense fallback={null}>
              <AIAssistant isOpen={isOpen} onClose={close} />
            </Suspense>
          )}
          
          {/* Show trigger button when assistant is closed */}
          {!isOpen && (
            <Suspense fallback={<TriggerFallback onClick={open} />}>
              <AIAssistantTrigger onClick={open} />
            </Suspense>
          )}
        </>
      )}
    </AIAssistantContext.Provider>
  );
}
