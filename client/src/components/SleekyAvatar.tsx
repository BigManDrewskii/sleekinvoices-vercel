import { cn } from "@/lib/utils";

/**
 * SleekyAvatar - Unified avatar component for Sleeky the otter mascot
 * 
 * This component provides consistent styling across all AI features with:
 * - Card-matching border colors (border-border)
 * - Consistent rounded-xl styling (matching bordered icons)
 * - Multiple size variants (enlarged for better visibility)
 * - Optional animation states
 * - No internal borders on the PNG image
 */

export type SleekyAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type SleekyAvatarState = "idle" | "thinking" | "talking" | "success";

interface SleekyAvatarProps {
  /** Size variant */
  size?: SleekyAvatarSize;
  /** Animation state */
  state?: SleekyAvatarState;
  /** Show border matching card style */
  bordered?: boolean;
  /** Show glow effect on hover */
  glow?: boolean;
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Alt text override */
  alt?: string;
}

// Enlarged sizes for better visibility
const sizeClasses: Record<SleekyAvatarSize, string> = {
  xs: "w-8 h-8",      // was w-6 h-6
  sm: "w-10 h-10",    // was w-8 h-8
  md: "w-14 h-14",    // was w-12 h-12
  lg: "w-20 h-20",    // was w-16 h-16
  xl: "w-28 h-28",    // was w-24 h-24
  "2xl": "w-36 h-36", // was w-32 h-32
};

const borderSizeClasses: Record<SleekyAvatarSize, string> = {
  xs: "ring-1",
  sm: "ring-1",
  md: "ring-2",
  lg: "ring-2",
  xl: "ring-2",
  "2xl": "ring-[3px]",
};

// Border radius matching bordered icons (rounded-xl)
const borderRadiusClasses: Record<SleekyAvatarSize, string> = {
  xs: "rounded-lg",
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-2xl",
};

export function SleekyAvatar({
  size = "md",
  state = "idle",
  bordered = true,
  glow = false,
  className,
  onClick,
  alt = "Sleeky AI Assistant",
}: SleekyAvatarProps) {
  const isInteractive = !!onClick;
  const Component = isInteractive ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden",
        "transition-all duration-300",
        sizeClasses[size],
        borderRadiusClasses[size], // Use matching border radius instead of rounded-full
        // Border styling matching card borders
        bordered && [
          borderSizeClasses[size],
          "ring-border/40",
          "hover:ring-border/60",
        ],
        // Glow effect
        glow && "hover:shadow-lg hover:shadow-primary/20",
        // Interactive states
        isInteractive && [
          "cursor-pointer",
          "hover:scale-105",
          "active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        ],
        // Animation states
        state === "thinking" && "animate-pulse",
        state === "talking" && "animate-bounce",
        state === "success" && "ring-emerald-500/50",
        className
      )}
      aria-label={isInteractive ? alt : undefined}
      type={isInteractive ? "button" : undefined}
    >
      {/* Sleeky image - no borders on the PNG itself */}
      <img
        src="/sleeky/sleekyAI-Avatar.png"
        alt={alt}
        className={cn("w-full h-full object-cover", borderRadiusClasses[size])}
        draggable={false}
      />

      {/* Glow overlay for active states */}
      {state !== "idle" && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            borderRadiusClasses[size],
            state === "thinking" && "bg-primary/10 animate-pulse",
            state === "talking" && "bg-primary/20",
            state === "success" && "bg-emerald-500/20"
          )}
        />
      )}
    </Component>
  );
}

export default SleekyAvatar;
