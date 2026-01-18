import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Info, X } from "lucide-react";

interface FeatureTooltipProps {
  id: string;
  title?: string;
  content: string;
  children: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  showIcon?: boolean;
  dismissible?: boolean;
  delay?: number;
  className?: string;
}

const DISMISSED_KEY = "sleek_tooltips_dismissed";

function getDismissedTooltips(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function dismissTooltip(id: string) {
  const dismissed = getDismissedTooltips();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

export function FeatureTooltip({
  id,
  title,
  content,
  children,
  placement = "top",
  showIcon = false,
  dismissible = false,
  delay = 300,
  className,
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if tooltip was dismissed
  useEffect(() => {
    if (dismissible) {
      const dismissed = getDismissedTooltips();
      setIsDismissed(dismissed.includes(id));
    }
  }, [id, dismissible]);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - gap + window.scrollY;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + gap + window.scrollY;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 +
          window.scrollY;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case "right":
        top =
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 +
          window.scrollY;
        left = triggerRect.right + gap;
        break;
    }

    // Keep within viewport
    left = Math.max(
      8,
      Math.min(left, window.innerWidth - tooltipRect.width - 8)
    );
    top = Math.max(8, top);

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      // Small delay to let the tooltip render first
      requestAnimationFrame(calculatePosition);
    }
  }, [isVisible, placement]);

  const handleMouseEnter = () => {
    if (isDismissed) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissTooltip(id);
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (isDismissed) return;
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("relative inline-flex", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
        {showIcon && !isDismissed && (
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Info className="h-2.5 w-2.5 text-primary" />
          </div>
        )}
      </div>

      {isVisible &&
        !isDismissed &&
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              "fixed z-[9998] max-w-[280px] pointer-events-auto",
              "bg-popover border border-border/50 rounded-xl shadow-lg",
              "animate-in fade-in zoom-in-95 duration-200",
              placement === "top" && "origin-bottom",
              placement === "bottom" && "origin-top",
              placement === "left" && "origin-right",
              placement === "right" && "origin-left"
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-2 h-2 bg-popover border-border/50 rotate-45",
                placement === "top" &&
                  "bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r",
                placement === "bottom" &&
                  "top-[-5px] left-1/2 -translate-x-1/2 border-t border-l",
                placement === "left" &&
                  "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r",
                placement === "right" &&
                  "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l"
              )}
            />

            <div className="p-3">
              {(title || dismissible) && (
                <div className="flex items-start justify-between gap-2 mb-1">
                  {title && (
                    <h4 className="text-sm font-medium text-foreground">
                      {title}
                    </h4>
                  )}
                  {dismissible && (
                    <button
                      onClick={handleDismiss}
                      className="h-5 w-5 rounded-md hover:bg-muted flex items-center justify-center flex-shrink-0"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {content}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// Simple inline tooltip for quick hints
interface SimpleTooltipProps {
  content: string;
  children: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function SimpleTooltip({
  content,
  children,
  placement = "top",
  delay = 200,
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top - gap + window.scrollY;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + gap + window.scrollY;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 + window.scrollY;
        left = rect.left - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 + window.scrollY;
        left = rect.right + gap;
        break;
    }

    setPosition({ top, left });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            className={cn(
              "fixed z-[9997] px-2.5 py-1.5 text-xs font-medium",
              "bg-foreground text-background rounded-md shadow-md",
              "animate-in fade-in zoom-in-95 duration-150",
              "whitespace-nowrap pointer-events-none",
              placement === "top" && "-translate-x-1/2 -translate-y-full",
              placement === "bottom" && "-translate-x-1/2",
              placement === "left" && "-translate-x-full -translate-y-1/2",
              placement === "right" && "-translate-y-1/2"
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
