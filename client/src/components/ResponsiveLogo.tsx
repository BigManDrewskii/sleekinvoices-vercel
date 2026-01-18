import { cn } from "@/lib/utils";
import {
  LOGO_ASSETS,
  getLogoSrcset,
  getLogoDimensions,
} from "@/const/logoAssets";
import { useState, useEffect } from "react";

interface ResponsiveLogoProps {
  variant?: "wide" | "compact" | "monogram";
  showBrand?: boolean;
  className?: string;
  responsive?: boolean;
  alt?: string;
}

/**
 * Responsive Logo component with support for:
 * - Multiple logo variants (wide, compact, monogram)
 * - High-DPI display support (@2x, @3x)
 * - SVG with PNG fallback
 * - Responsive variant switching based on screen width
 * - Lazy loading for performance
 *
 * Automatically switches between:
 * - Monogram for mobile/tablet (< 900px)
 * - Wide logo for desktop (>= 900px)
 */
export function ResponsiveLogo({
  variant = "wide",
  showBrand = false,
  className,
  responsive = true,
  alt = "SleekInvoices Logo",
}: ResponsiveLogoProps) {
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (!responsive) return;

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [responsive]);

  // Determine which variant to use based on screen width
  // Two-tier system: monogram for mobile/tablet (< 900px), wide for desktop (>= 900px)
  const getVariantForScreenWidth = (width: number): typeof variant => {
    if (width < 900) return "monogram"; // Mobile & Tablet
    return "wide"; // Desktop
  };

  const activeVariant = responsive
    ? getVariantForScreenWidth(screenWidth)
    : variant;
  const logo = LOGO_ASSETS[activeVariant];
  const dimensions = getLogoDimensions(activeVariant);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <picture>
        {/* SVG source - preferred format */}
        <source srcSet={logo.svg} type="image/svg+xml" />

        {/* PNG sources with srcset for high-DPI displays */}
        <source srcSet={getLogoSrcset(activeVariant)} type="image/png" />

        {/* Fallback image */}
        <img
          src={logo.png["1x"]}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{
            maxHeight: "60px",
            width: "auto",
            aspectRatio: `${dimensions.aspectRatio} / 1`,
          }}
        />
      </picture>

      {/* Brand Name - Desktop only (md and up) */}
      {showBrand && activeVariant === "wide" && (
        <span className="hidden md:inline text-sm font-semibold text-foreground whitespace-nowrap">
          SleekInvoices
        </span>
      )}

      {/* Fallback when no logo */}
      {!logo && (
        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">SI</span>
        </div>
      )}
    </div>
  );
}
