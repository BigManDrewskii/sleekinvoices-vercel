"use client";

import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "thinking" | "talking";

interface OrbProps {
  state?: OrbState;
  size?: "sm" | "md" | "lg";
  colors?: [string, string];
  className?: string;
  onClick?: () => void;
}

/**
 * Sleeky AI Avatar button - replaces the animated orb with our mascot
 */
export function Orb({
  state = "idle",
  size = "md",
  className,
  onClick,
}: OrbProps) {
  const sizeMap = {
    sm: 40,
    md: 56,
    lg: 80,
  };

  const orbSize = sizeMap[size];

  return (
    <button
      onClick={onClick}
      className={cn(
        "orb-button relative rounded-full cursor-pointer transition-all duration-300",
        "hover:scale-110 active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "overflow-hidden",
        className
      )}
      style={{
        width: orbSize,
        height: orbSize,
      }}
      aria-label="AI Assistant"
    >
      {/* Glow effect */}
      <div
        className="absolute inset-[-8px] rounded-full opacity-50 blur-xl animate-pulse"
        style={{
          background: `radial-gradient(circle, #818cf8 0%, transparent 70%)`,
        }}
      />

      {/* Sleeky Avatar */}
      <img
        src="/sleeky/ai-avatars/avatar.png"
        alt="Sleeky AI"
        className={cn(
          "absolute inset-0 w-full h-full object-cover rounded-full",
          "ring-2 ring-primary/30 hover:ring-primary/50 transition-all",
          state === "thinking" && "animate-pulse",
          state === "talking" && "animate-bounce"
        )}
      />

      {/* Active state indicator */}
      {state !== "idle" && (
        <div
          className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
          style={{
            background: `radial-gradient(circle, rgba(129, 140, 248, 0.3) 0%, transparent 70%)`,
            animationDuration: state === "talking" ? "0.3s" : state === "thinking" ? "0.8s" : "1.5s",
          }}
        />
      )}
    </button>
  );
}

export default Orb;
