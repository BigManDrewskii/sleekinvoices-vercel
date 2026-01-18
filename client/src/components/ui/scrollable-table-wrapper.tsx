import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableTableWrapperProps {
  children: ReactNode;
  minWidth?: number;
  className?: string;
  /** Storage key for swipe hint dismissal. Defaults to "table-swipe-hint-dismissed" */
  hintStorageKey?: string;
}

const SWIPE_HINT_STORAGE_KEY = "table-swipe-hint-dismissed";

/**
 * A wrapper component that adds horizontal scrolling with fade indicators
 * to indicate when more content is available to scroll.
 * Shows a one-time swipe hint on mobile devices.
 */
export function ScrollableTableWrapper({
  children,
  minWidth = 800,
  className,
  hintStorageKey = SWIPE_HINT_STORAGE_KEY,
}: ScrollableTableWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Add small threshold to account for rounding errors
    const threshold = 2;
    
    setCanScrollLeft(scrollLeft > threshold);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - threshold);
  }, []);

  // Check if device is mobile and if swipe hint should be shown
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.matchMedia("(max-width: 768px)").matches;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show swipe hint on mobile if not dismissed and content is scrollable
  useEffect(() => {
    if (!isMobile) {
      setShowSwipeHint(false);
      return;
    }

    const dismissed = localStorage.getItem(hintStorageKey) === "true";
    if (dismissed) {
      setShowSwipeHint(false);
      return;
    }

    // Only show hint if there's content to scroll
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setShowSwipeHint(true);
      
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        localStorage.setItem(hintStorageKey, "true");
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, hintStorageKey]);

  // Dismiss hint on first scroll
  const handleScroll = useCallback(() => {
    checkScroll();
    if (showSwipeHint) {
      setShowSwipeHint(false);
      localStorage.setItem(hintStorageKey, "true");
    }
  }, [checkScroll, showSwipeHint, hintStorageKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check
    checkScroll();

    // Check on scroll
    el.addEventListener("scroll", handleScroll, { passive: true });

    // Check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, handleScroll]);

  const dismissHint = () => {
    setShowSwipeHint(false);
    localStorage.setItem(hintStorageKey, "true");
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mobile swipe hint overlay */}
      {showSwipeHint && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={dismissHint}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && dismissHint()}
          aria-label="Dismiss swipe hint"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-full shadow-lg">
            <ChevronLeft className="w-5 h-5 text-muted-foreground animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              Swipe to see more
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground animate-pulse" />
          </div>
        </div>
      )}

      {/* Left fade indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10",
          "bg-gradient-to-r from-background to-transparent",
          "transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
      >
        <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
      </div>

      {/* Right fade indicator */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10",
          "bg-gradient-to-l from-background to-transparent",
          "transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
    </div>
  );
}
