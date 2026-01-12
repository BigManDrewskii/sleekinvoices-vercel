"use client";

import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "thinking" | "talking";

interface OrbProps {
  state?: OrbState;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

/**
 * Orb component - AI Assistant floating button using Sleeky Avatar 02
 * Uses the winking otter avatar specifically for the AI Assistant
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
        className="absolute inset-[-8px] rounded-full opacity-50 blur-xl animate-pulse pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)`,
        }}
      />

      {/* Sleeky AI Avatar 02 - winking otter with gold chain */}
      <button
        onClick={onClick}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full overflow-hidden",
          "transition-all duration-300",
          sizeClasses[size],
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
          src="/sleeky/ai-avatars/sleekyAI-Avatar-02.png"
          alt="Sleeky AI Assistant"
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Glow overlay for active states */}
        {state !== "idle" && (
          <div
            className={cn(
              "absolute inset-0 rounded-full pointer-events-none",
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
