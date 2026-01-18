import { cn } from "@/lib/utils";

/**
 * Enhanced Skeleton component with shimmer animation
 * Used for loading placeholders across the application
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton text line - for simulating text content
 */
function SkeletonText({
  className,
  lines = 1,
  ...props
}: React.ComponentProps<"div"> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton circle - for avatars, icons
 */
function SkeletonCircle({
  className,
  size = "md",
  ...props
}: React.ComponentProps<"div"> & { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  );
}

/**
 * Skeleton button - for action buttons
 */
function SkeletonButton({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-11 w-32",
  };

  return (
    <Skeleton
      className={cn("rounded-lg", sizeClasses[size], className)}
      {...props}
    />
  );
}

/**
 * Skeleton badge - for status badges
 */
function SkeletonBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton className={cn("h-5 w-16 rounded-full", className)} {...props} />
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
  SkeletonBadge,
};
