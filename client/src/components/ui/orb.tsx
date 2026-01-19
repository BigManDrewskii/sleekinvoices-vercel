"use client";

import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "thinking" | "talking";

interface OrbProps {
  state?: OrbState;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

// Enlarged sizes for better visibility
const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-10 h-10", // was w-8 h-8
  md: "w-14 h-14", // was w-12 h-12
  lg: "w-20 h-20", // was w-16 h-16
};

// Border radius matching bordered icons (rounded-xl)
const borderRadiusClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-xl",
};

/**
 * Orb component - AI Assistant floating button using Sleeky Avatar
 * Uses the unified otter avatar (red cap + gold chain) for the AI Assistant
 */
export function Orb({
  state = "idle",
  size = "md",
  className,
  onClick,
}: OrbProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-[-8px] opacity-50 blur-xl animate-pulse pointer-events-none",
          borderRadiusClasses[size]
        )}
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)`,
        }}
      />

      {/* Sleeky AI Avatar - unified otter with red cap and gold chain */}
      <button
        onClick={onClick}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden",
          "transition-all duration-300",
          sizeClasses[size],
          borderRadiusClasses[size], // Use matching border radius instead of rounded-full
          "ring-2 ring-border/40 hover:ring-border/60",
          "hover:shadow-lg hover:shadow-primary/20",
          "cursor-pointer hover:scale-105 active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          state === "thinking" && "animate-pulse",
          state === "talking" && "animate-bounce"
        )}
        aria-label="Sleeky AI Assistant"
        type="button"
      >
        <img
          src="/sleeky/ai-avatars/avatar.png"
          alt="Sleeky AI Assistant"
          className={cn(
            "w-full h-full object-cover",
            borderRadiusClasses[size]
          )}
          draggable={false}
        />

        {/* Glow overlay for active states */}
        {state !== "idle" && (
          <div
            className={cn(
              "absolute inset-0 pointer-events-none",
              borderRadiusClasses[size],
              state === "thinking" && "bg-primary/10 animate-pulse",
              state === "talking" && "bg-primary/20"
            )}
          />
        )}
      </button>
    </div>
  );
}

export default Orb;
