import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a fade-in animation for smooth transitions
 * between routes. Content fades in after mounting.
 */
export function PageTransitionWrapper({ 
  children, 
  className 
}: PageTransitionWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth animation
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Wrapper for content that loads asynchronously.
 * Shows skeleton while loading, then fades in the actual content.
 */
interface AsyncContentWrapperProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AsyncContentWrapper({
  isLoading,
  skeleton,
  children,
  className,
}: AsyncContentWrapperProps) {
  const [showContent, setShowContent] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasLoaded) {
      // Content just finished loading, trigger fade-in
      setHasLoaded(true);
      requestAnimationFrame(() => {
        setShowContent(true);
      });
    }
  }, [isLoading, hasLoaded]);

  if (isLoading) {
    return <div className={className}>{skeleton}</div>;
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Staggered animation wrapper for lists of items
 */
interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className,
  itemClassName,
  staggerDelay = 50,
}: StaggeredListProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    children.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });
      }, index * staggerDelay);
    });
  }, [children.length, staggerDelay]);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-300 ease-out",
            visibleItems.has(index)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2",
            itemClassName
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
