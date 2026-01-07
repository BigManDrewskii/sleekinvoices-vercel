import { cn } from "@/lib/utils";

interface GearLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Elegant gear-based loader animation
 * Inspired by UIverse design, adapted for SleekInvoices
 */
export function GearLoader({ className, size = "md" }: GearLoaderProps) {
  const sizeClasses = {
    sm: "h-[75px] w-[100px]",
    md: "h-[120px] w-[160px]",
    lg: "h-[150px] w-[200px]",
  };

  return (
    <div
      className={cn(
        "gear-loader relative overflow-hidden rounded-lg",
        "bg-card/80 backdrop-blur-sm border border-border/30",
        "shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      {/* Overlay with inner shadow */}
      <div className="absolute inset-0 rounded-lg z-10 shadow-[inset_0px_0px_20px_rgba(0,0,0,0.5)]" />
      
      {/* Gear One - Top Left */}
      <div className="gear gear-one absolute top-[8%] left-[5%]">
        <div className="gear-inner animate-gear-ccw">
          <div className="bar" />
          <div className="bar rotate-60" />
          <div className="bar rotate-120" />
        </div>
      </div>

      {/* Gear Two - Middle */}
      <div className="gear gear-two absolute top-[40%] left-[30%]">
        <div className="gear-inner animate-gear-cw">
          <div className="bar" />
          <div className="bar rotate-60" />
          <div className="bar rotate-120" />
        </div>
      </div>

      {/* Gear Three - Bottom Left */}
      <div className="gear gear-three absolute top-[73%] left-[5%]">
        <div className="gear-inner animate-gear-ccw">
          <div className="bar" />
          <div className="bar rotate-60" />
          <div className="bar rotate-120" />
        </div>
      </div>

      {/* Gear Four - Large Right */}
      <div className="gear gear-four large absolute top-[8%] left-[64%]">
        <div className="gear-inner animate-gear-ccw-slow">
          <div className="bar" />
          <div className="bar rotate-30" />
          <div className="bar rotate-60" />
          <div className="bar rotate-90" />
          <div className="bar rotate-120" />
          <div className="bar rotate-150" />
        </div>
      </div>
    </div>
  );
}

export default GearLoader;
