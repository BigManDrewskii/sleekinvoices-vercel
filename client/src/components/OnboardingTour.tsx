import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

// Best practices constants based on Material Design and Popper.js guidelines
const VIEWPORT_PADDING = 16; // Minimum distance from viewport edges
const GAP = 12; // Gap between tooltip and target element
const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 200; // Estimated max height

export function OnboardingTour() {
  const {
    isOnboardingActive,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0, placement: 'bottom' });
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate tooltip position using FIXED positioning (viewport-relative)
  const calculateTooltipPosition = useCallback((
    targetRect: DOMRect,
    preferredPlacement: 'top' | 'bottom' | 'left' | 'right'
  ): TooltipPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const tooltipWidth = Math.min(TOOLTIP_WIDTH, viewportWidth - VIEWPORT_PADDING * 2);
    const tooltipHeight = TOOLTIP_HEIGHT;

    // Calculate available space in each direction (all relative to viewport)
    const spaceAbove = targetRect.top - VIEWPORT_PADDING;
    const spaceBelow = viewportHeight - targetRect.bottom - VIEWPORT_PADDING;
    const spaceLeft = targetRect.left - VIEWPORT_PADDING;
    const spaceRight = viewportWidth - targetRect.right - VIEWPORT_PADDING;

    // Required space for tooltip + gap
    const requiredVertical = tooltipHeight + GAP;
    const requiredHorizontal = tooltipWidth + GAP;

    // Determine best placement using flip logic
    let placement = preferredPlacement;
    
    // Check if preferred placement fits
    const canFit = {
      top: spaceAbove >= requiredVertical,
      bottom: spaceBelow >= requiredVertical,
      left: spaceLeft >= requiredHorizontal,
      right: spaceRight >= requiredHorizontal,
    };

    // If preferred doesn't fit, flip to opposite or find best alternative
    if (!canFit[placement]) {
      const opposites: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
      };
      
      if (canFit[opposites[placement]]) {
        placement = opposites[placement];
      } else {
        // Find placement with most space
        const spaces = { top: spaceAbove, bottom: spaceBelow, left: spaceLeft, right: spaceRight };
        placement = (Object.entries(spaces).sort((a, b) => b[1] - a[1])[0][0]) as typeof placement;
      }
    }

    // Calculate position based on final placement (viewport-relative for position:fixed)
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (placement) {
      case 'top':
        tooltipTop = targetRect.top - tooltipHeight - GAP;
        tooltipLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        tooltipTop = targetRect.bottom + GAP;
        tooltipLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        tooltipTop = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        tooltipLeft = targetRect.left - tooltipWidth - GAP;
        break;
      case 'right':
        tooltipTop = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        tooltipLeft = targetRect.right + GAP;
        break;
    }

    // Clamp to viewport bounds
    tooltipLeft = Math.max(VIEWPORT_PADDING, Math.min(tooltipLeft, viewportWidth - tooltipWidth - VIEWPORT_PADDING));
    tooltipTop = Math.max(VIEWPORT_PADDING, Math.min(tooltipTop, viewportHeight - tooltipHeight - VIEWPORT_PADDING));

    return { top: tooltipTop, left: tooltipLeft, placement };
  }, []);

  // Find and position the spotlight on the target element
  useEffect(() => {
    if (!isOnboardingActive || !currentStepData) {
      setIsVisible(false);
      return;
    }

    const findAndPositionTarget = () => {
      const targetElement = document.querySelector(currentStepData.targetSelector);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const padding = isMobile ? 4 : (currentStepData.spotlightPadding || 8);
        const viewportHeight = window.innerHeight;
        
        // Check if we need to scroll to make room for tooltip
        const tooltipHeight = TOOLTIP_HEIGHT;
        const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING;
        const spaceAbove = rect.top - VIEWPORT_PADDING;
        const needsSpace = tooltipHeight + GAP;
        
        // If neither direction has enough space, scroll to center
        if (spaceBelow < needsSpace && spaceAbove < needsSpace) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const newRect = targetElement.getBoundingClientRect();
            updatePositions(newRect, padding);
          }, 350);
          return;
        }
        
        updatePositions(rect, padding);
      } else {
        setTimeout(findAndPositionTarget, 100);
      }
    };

    const updatePositions = (rect: DOMRect, padding: number) => {
      // Spotlight uses absolute positioning (document coordinates)
      setSpotlightPosition({
        top: rect.top + window.scrollY - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Tooltip uses fixed positioning (viewport coordinates)
      const position = calculateTooltipPosition(rect, currentStepData!.placement);
      setTooltipPosition(position);
      setIsVisible(true);
    };

    const timer = setTimeout(findAndPositionTarget, 100);
    
    const handleReposition = () => {
      requestAnimationFrame(findAndPositionTarget);
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition);
    };
  }, [isOnboardingActive, currentStepData, currentStep, isMobile, calculateTooltipPosition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOnboardingActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipOnboarding();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === totalSteps - 1) {
          completeOnboarding();
        } else {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingActive, nextStep, prevStep, skipOnboarding, completeOnboarding, currentStep, totalSteps]);

  if (!isOnboardingActive || !currentStepData || !isVisible) {
    return null;
  }

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);

  return createPortal(
    <>
      {/* Overlay layer - absolute positioning for full document coverage */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer"
          style={{ minHeight: document.documentElement.scrollHeight }}
          onClick={skipOnboarding}
          role="button"
          aria-label="Click to dismiss tour"
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightPosition && (
                <rect
                  x={spotlightPosition.left}
                  y={spotlightPosition.top}
                  width={spotlightPosition.width}
                  height={spotlightPosition.height}
                  rx={isMobile ? 8 : 12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            className="transition-all duration-200"
          />
        </svg>

        {/* Spotlight border */}
        {spotlightPosition && (
          <div
            className={cn(
              "absolute pointer-events-none transition-all duration-200",
              isMobile ? "rounded-lg ring-1 ring-primary/40" : "rounded-xl ring-2 ring-primary/30"
            )}
            style={{
              top: spotlightPosition.top,
              left: spotlightPosition.left,
              width: spotlightPosition.width,
              height: spotlightPosition.height,
              boxShadow: '0 0 0 2px rgba(var(--primary), 0.1)',
            }}
          />
        )}
      </div>

      {/* Tooltip - FIXED positioning for viewport-relative placement */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999] pointer-events-auto",
          "bg-popover/95 backdrop-blur-sm border border-border/60 shadow-xl",
          isMobile ? "rounded-xl" : "rounded-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: tooltipWidth,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "px-3 pt-3 pb-1" : "px-4 pt-3 pb-1"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0",
              isMobile ? "h-6 w-6" : "h-7 w-7"
            )}>
              <Sparkles className={cn(
                "text-primary",
                isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
              )} />
            </div>
            <span className={cn(
              "font-medium text-muted-foreground",
              isMobile ? "text-[10px]" : "text-xs"
            )}>
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground flex-shrink-0",
              isMobile ? "h-6 w-6" : "h-7 w-7"
            )}
            onClick={skipOnboarding}
            aria-label="Close tour"
          >
            <X className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </Button>
        </div>

        {/* Content */}
        <div className={cn(
          isMobile ? "px-3 py-2" : "px-4 py-2"
        )}>
          <h3 
            id="onboarding-title"
            className={cn(
              "font-semibold text-foreground leading-tight",
              isMobile ? "text-sm mb-1" : "text-base mb-1.5"
            )}
          >
            {currentStepData.title}
          </h3>
          <p 
            id="onboarding-description"
            className={cn(
              "text-muted-foreground leading-snug",
              isMobile ? "text-xs" : "text-sm"
            )}
          >
            {currentStepData.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className={cn(
          "flex items-center justify-center gap-1",
          isMobile ? "py-1.5" : "py-2"
        )}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-200",
                isMobile ? "h-1 w-1" : "h-1.5 w-1.5",
                i === currentStep 
                  ? "bg-primary w-4" 
                  : i < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center justify-between border-t border-border/40",
          isMobile ? "px-3 py-2" : "px-4 py-2.5"
        )}>
          <button
            onClick={skipOnboarding}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors",
              isMobile ? "text-xs" : "text-sm"
            )}
          >
            Skip
          </button>
          <div className="flex items-center gap-1.5">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isMobile ? "h-7 px-2 text-xs" : "h-8 px-2.5"
                )}
              >
                <ChevronLeft className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                {!isMobile && "Back"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLastStep ? completeOnboarding : nextStep}
              className={cn(
                "font-medium",
                isMobile ? "h-7 px-3 text-xs" : "h-8 px-3"
              )}
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className={cn(
                    isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"
                  )} />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className={cn(
                    isMobile ? "h-3 w-3 ml-0.5" : "h-4 w-4 ml-0.5"
                  )} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
