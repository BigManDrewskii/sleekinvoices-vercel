import { cn } from "@/lib/utils";

interface GearLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Gear-based loader - exact recreation of UIverse design (fresh-panther-41)
 */
export function GearLoader({ className, size = "md" }: GearLoaderProps) {
  const sizeConfig = {
    sm: { container: "h-[75px] w-[100px]", scale: 0.5 },
    md: { container: "h-[120px] w-[160px]", scale: 0.8 },
    lg: { container: "h-[150px] w-[200px]", scale: 1 },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn("gearbox relative overflow-hidden rounded-md", config.container, className)}
      style={{ background: "#111", boxShadow: "0px 0px 0px 1px rgba(255, 255, 255, 0.1)" }}
    >
      <div className="overlay absolute inset-0 rounded-md z-10 pointer-events-none" style={{ boxShadow: "inset 0px 0px 20px black" }} />
      
      {/* Gear One - Top Left */}
      <Gear scale={config.scale} top={12} left={10} bars={3} direction="ccw" />
      
      {/* Gear Two - Middle */}
      <Gear scale={config.scale} top={61 * config.scale} left={60 * config.scale} bars={3} direction="cw" />
      
      {/* Gear Three - Bottom Left */}
      <Gear scale={config.scale} top={110 * config.scale} left={10} bars={3} direction="ccw" />
      
      {/* Gear Four - Large Right */}
      <Gear scale={config.scale} top={13 * config.scale} left={128 * config.scale} bars={6} direction="ccw-slow" large />
    </div>
  );
}

function Gear({ scale, top, left, bars, direction, large = false }: { 
  scale: number; top: number; left: number; bars: number; direction: string; large?: boolean 
}) {
  const size = large ? 120 * scale : 60 * scale;
  const barWidth = large ? 136 * scale : 76 * scale;
  const centerSize = large ? 96 * scale : 36 * scale;
  const barAngles = large ? [0, 30, 60, 90, 120, 150] : [0, 60, 120];

  return (
    <div
      className="gear absolute"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        height: `${size}px`,
        width: `${size}px`,
        boxShadow: "0px -1px 0px 0px #888888, 0px 1px 0px 0px black",
        borderRadius: `${size / 2}px`,
      }}
    >
      <div
        className={cn(
          "gear-inner relative h-full w-full rounded-full",
          direction === "cw" && "animate-gear-cw",
          direction === "ccw" && "animate-gear-ccw",
          direction === "ccw-slow" && "animate-gear-ccw-slow"
        )}
        style={{ background: "#555", border: "1px solid rgba(255, 255, 255, 0.1)" }}
      >
        {barAngles.slice(0, bars).map((angle) => (
          <div
            key={angle}
            style={{
              background: "#555",
              height: `${16 * scale}px`,
              width: `${barWidth}px`,
              position: "absolute",
              left: "50%",
              marginLeft: `-${barWidth / 2}px`,
              top: "50%",
              marginTop: `-${8 * scale}px`,
              borderRadius: "2px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
              transform: `rotate(${angle}deg)`,
            }}
          />
        ))}
      </div>
      {/* Center hole */}
      <div
        style={{
          position: "absolute",
          height: `${centerSize}px`,
          width: `${centerSize}px`,
          borderRadius: "50%",
          background: "#111",
          top: "50%",
          left: "50%",
          marginLeft: `-${centerSize / 2}px`,
          marginTop: `-${centerSize / 2}px`,
          zIndex: 3,
          boxShadow: "0px 0px 10px rgba(255, 255, 255, 0.1), inset 0px 0px 10px rgba(0, 0, 0, 0.1), inset 0px 2px 0px 0px #090909, inset 0px -1px 0px 0px #888888",
        }}
      />
    </div>
  );
}

export default GearLoader;
