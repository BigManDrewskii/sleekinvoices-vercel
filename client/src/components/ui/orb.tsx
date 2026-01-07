"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "orb-container relative rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95",
        sizeClasses[size],
        className
      )}
      style={{
        "--orb-color-1": colors[0],
        "--orb-color-2": colors[1],
      } as React.CSSProperties}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-60 blur-lg"
        style={{
          background: `radial-gradient(circle, ${colors[0]}80 0%, transparent 70%)`,
        }}
      />

      {/* Main orb body */}
      <div
        className={cn(
          "orb-body absolute inset-1 rounded-full overflow-hidden",
          "shadow-[inset_0_2px_20px_rgba(255,255,255,0.3),inset_0_-2px_20px_rgba(0,0,0,0.2)]",
          mounted && "animate-orb-rotate"
        )}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2) 0%, transparent 40%),
            linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[0]} 100%)
          `,
          backgroundSize: "100% 100%, 100% 100%, 200% 200%",
        }}
      >
        {/* Inner shimmer */}
        <div
          className={cn("absolute inset-0 rounded-full", mounted && "animate-orb-shimmer")}
          style={{
            background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
          }}
        />
      </div>

      {/* Highlight */}
      <div
        className="absolute top-1.5 left-1.5 w-1/3 h-1/4 rounded-full opacity-60"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 100%)",
        }}
      />
    </button>
  );
}

export default Orb;
