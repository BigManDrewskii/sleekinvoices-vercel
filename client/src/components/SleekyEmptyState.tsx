import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface SleekyEmptyStateProps {
  image: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
    icon?: ReactNode;
  };
  size?: "small" | "medium" | "large";
}

export function SleekyEmptyState({
  image,
  title,
  description,
  action,
  size = "medium",
}: SleekyEmptyStateProps) {
  const imageSizeClasses = {
    small: "w-32 h-32 sm:w-40 sm:h-40",
    medium: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
    large: "w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500">
      {/* Sleeky Image */}
      <div className="mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        <img
          src={image}
          alt="Sleeky the otter mascot"
          className={`${imageSizeClasses[size]} object-contain animate-bounce-subtle`}
          loading="lazy"
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-200">
        {title}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-6 leading-relaxed animate-in slide-in-from-bottom-2 duration-500 delay-300">
        {description}
      </p>

      {/* Optional Action Button */}
      {action && (
        <div className="animate-in slide-in-from-bottom-2 duration-500 delay-400">
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            size="lg"
            className="touch-target"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        </div>
      )}

      {/* Custom CSS for subtle bounce animation */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }

        .animate-bounce-subtle:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
