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
 * Elegant animated orb component inspired by ElevenLabs UI
 */
export function Orb({
  state = "idle",
  size = "md",
  colors = ["#818cf8", "#6366f1"],
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
          background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
        }}
      />

      {/* Main orb */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
          boxShadow: `
            inset 0 -4px 12px rgba(0,0,0,0.3),
            inset 0 4px 12px rgba(255,255,255,0.2),
            0 4px 20px ${colors[0]}60
          `,
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 rounded-full animate-orb-spin"
          style={{
            background: `
              conic-gradient(
                from 0deg,
                transparent 0deg,
                ${colors[0]}40 90deg,
                transparent 180deg,
                ${colors[1]}40 270deg,
                transparent 360deg
              )
            `,
          }}
        />

        {/* Glass reflection */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(
                ellipse 60% 40% at 30% 20%,
                rgba(255,255,255,0.4) 0%,
                transparent 100%
              )
            `,
          }}
        />

        {/* Inner glow for active states */}
        {state !== "idle" && (
          <div
            className="absolute inset-2 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${colors[0]}60 0%, transparent 70%)`,
              animationDuration: state === "talking" ? "0.3s" : state === "thinking" ? "0.8s" : "1.5s",
            }}
          />
        )}
      </div>

      {/* Sparkle icon in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-1/2 h-1/2 text-white/90 drop-shadow-sm"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
    </button>
  );
}

export default Orb;
