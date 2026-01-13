import { cn } from "@/lib/utils";

interface SleekyAIAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function SleekyAIAvatar({
  size = "md",
  className,
  animated = false,
}: SleekyAIAvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <img
        src="/sleeky/sleekyAI-Avatar.png"
        alt="Sleeky AI Assistant"
        className={cn(
          sizeClasses[size],
          "rounded-full object-cover",
          animated && "animate-pulse-slow"
        )}
      />
      {animated && (
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
