import { cn } from "@/lib/utils";
import { ReactNode, useRef, useEffect, useState } from "react";

/**
 * A4 Paper Dimensions (at 96 DPI):
 * - Width: 210mm = 794px
 * - Height: 297mm = 1123px
 * - Aspect Ratio: 1:1.414 (√2)
 */

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
export const A4_ASPECT_RATIO = A4_HEIGHT_PX / A4_WIDTH_PX;

export type PreviewFormat = 'a4' | 'web' | 'email';
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface A4PreviewContainerProps {
  children: ReactNode;
  format?: PreviewFormat;
  device?: PreviewDevice;
  className?: string;
  showPageBorder?: boolean;
  showShadow?: boolean;
  maxHeight?: string;
}

/**
 * A4PreviewContainer - Standardized container for invoice previews
 * Renders content at proper A4 proportions with responsive scaling
 */
export function A4PreviewContainer({
  children,
  format = 'a4',
  device = 'desktop',
  className,
  showPageBorder = true,
  showShadow = true,
  maxHeight = '80vh',
}: A4PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const deviceWidths: Record<PreviewDevice, number> = {
    desktop: A4_WIDTH_PX,
    tablet: 600,
    mobile: 375,
  };

  const formatStyles: Record<PreviewFormat, { width: number; aspectRatio?: number }> = {
    a4: { width: A4_WIDTH_PX, aspectRatio: A4_ASPECT_RATIO },
    web: { width: deviceWidths[device] },
    email: { width: 600 },
  };

  const currentFormat = formatStyles[format];
  const targetWidth = Math.min(currentFormat.width, deviceWidths[device]);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth - 48;
      const containerHeight = containerRef.current.clientHeight - 48;

      let newScale = containerWidth / targetWidth;

      if (format === 'a4' && currentFormat.aspectRatio) {
        const contentHeight = targetWidth * currentFormat.aspectRatio;
        const heightScale = containerHeight / contentHeight;
        newScale = Math.min(newScale, heightScale);
      }

      newScale = Math.max(0.3, Math.min(1.2, newScale));
      setScale(newScale);
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [targetWidth, format, currentFormat.aspectRatio]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-start justify-center overflow-auto",
        "bg-zinc-100 dark:bg-zinc-900 rounded-xl p-6",
        className
      )}
      style={{ maxHeight }}
    >
      <div
        className="origin-top transition-transform duration-200"
        style={{
          transform: `scale(${scale})`,
          width: targetWidth,
          minHeight: format === 'a4' && currentFormat.aspectRatio 
            ? targetWidth * currentFormat.aspectRatio 
            : 'auto',
        }}
      >
        <div
          className={cn(
            "bg-white",
            showPageBorder && "border border-zinc-200",
            showShadow && "shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.1)]",
            "rounded-sm overflow-hidden"
          )}
          style={{
            width: targetWidth,
            minHeight: format === 'a4' && currentFormat.aspectRatio 
              ? targetWidth * currentFormat.aspectRatio 
              : 'auto',
          }}
        >
          {children}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-400 bg-white/80 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

export default A4PreviewContainer;
