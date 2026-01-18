import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollableTableWrapperProps {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}

/**
 * A wrapper component that adds horizontal scrolling with fade indicators
 * to indicate when more content is available to scroll.
 */
export function ScrollableTableWrapper({
  children,
  minWidth = 800,
  className,
}: ScrollableTableWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Add small threshold to account for rounding errors
    const threshold = 2;
    
    setCanScrollLeft(scrollLeft > threshold);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - threshold);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check
    checkScroll();

    // Check on scroll
    el.addEventListener("scroll", checkScroll, { passive: true });

    // Check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  return (
    <div className={cn("relative", className)}>
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
