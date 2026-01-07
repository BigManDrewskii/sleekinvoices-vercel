/**
 * Logo Asset System
 * Centralized management of all SleekInvoices logo variations
 * Supports multiple formats (SVG, PNG) and pixel densities (@1x, @2x, @3x)
 */

export const LOGO_ASSETS = {
  // Wide Logo - Full horizontal logo with text (new compact version)
  wide: {
    svg: "/logo-full.svg",
    png: {
      "1x": "/logo-full.svg",
      "2x": "/logo-full.svg",
      "3x": "/logo-full.svg",
    },
    srcset: `/logo-full.svg 1x`.trim(),
    width: 180,
    height: 28,
    aspectRatio: 6.4,
    description: "Full logo with text - use on desktop navigation",
  },

  // Compact Logo - Same as wide for now
  compact: {
    svg: "/logo-full.svg",
    png: {
      "1x": "/logo-full.svg",
      "2x": "/logo-full.svg",
      "3x": "/logo-full.svg",
    },
    srcset: `/logo-full.svg 1x`.trim(),
    width: 180,
    height: 28,
    aspectRatio: 6.4,
    description: "Compact logo - use on tablet and smaller screens",
  },

  // Monogram - Square icon only (new $ monogram)
  monogram: {
    svg: "/logo-icon.svg",
    png: {
      "1x": "/logo-icon.svg",
      "2x": "/logo-icon.svg",
      "3x": "/logo-icon.svg",
    },
    srcset: `/logo-icon.svg 1x`.trim(),
    width: 32,
    height: 32,
    aspectRatio: 1,
    description: "Square monogram - use on mobile and as favicon",
  },
} as const;

/**
 * Favicon Configuration
 * Multi-format favicon support for all browsers and devices
 */
export const FAVICON_CONFIG = {
  ico: "/favicon.ico",
  svg: "/logo-icon.svg",
  png16: "/favicon-16x16.png",
  png32: "/favicon-32x32.png",
  appleTouchIcon: "/apple-touch-icon.png",
  androidChrome192: "/android-chrome-192x192.png",
  androidChrome512: "/android-chrome-512x512.png",
  manifest: "/site.webmanifest",
} as const;

/**
 * Responsive Logo Breakpoints
 * Define which logo variant to use at different screen sizes
 */
export const LOGO_BREAKPOINTS = {
  // Mobile & Tablet: < 900px (below lg)
  mobile: {
    variant: "monogram",
    width: 40,
    height: 40,
  },
  // Desktop: >= 900px (lg and up)
  desktop: {
    variant: "wide",
    width: 180,
    height: 45,
  },
} as const;

/**
 * Get logo source for a specific variant
 * Prefers SVG with PNG fallback
 */
export function getLogoSource(
  variant: keyof typeof LOGO_ASSETS,
  format: "svg" | "png" = "svg"
) {
  const logo = LOGO_ASSETS[variant];
  if (format === "svg") {
    return logo.svg;
  }
  return logo.png["1x"];
}

/**
 * Get responsive logo srcset for high-DPI displays
 */
export function getLogoSrcset(variant: keyof typeof LOGO_ASSETS) {
  return LOGO_ASSETS[variant].srcset;
}

/**
 * Get logo dimensions for a specific variant
 */
export function getLogoDimensions(variant: keyof typeof LOGO_ASSETS) {
  const logo = LOGO_ASSETS[variant];
  return {
    width: logo.width,
    height: logo.height,
    aspectRatio: logo.aspectRatio,
  };
}

/**
 * Get appropriate logo variant for screen width
 * Two-tier system: monogram for mobile/tablet (< 900px), wide for desktop (>= 900px)
 */
export function getResponsiveLogoVariant(screenWidth: number) {
  if (screenWidth < 900) {
    return "monogram";
  } else {
    return "wide";
  }
}

export type LogoVariant = keyof typeof LOGO_ASSETS;
