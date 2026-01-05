/**
 * Logo Asset System
 * Centralized management of all SleekInvoices logo variations
 * Supports multiple formats (SVG, PNG) and pixel densities (@1x, @2x, @3x)
 */

export const LOGO_ASSETS = {
  // Wide Logo - Full horizontal logo with text
  wide: {
    svg: "/logos/wide/SleekInvoices-Logo-Wide.svg",
    png: {
      "1x": "/logos/wide/SleekInvoices-Logo-Wide.png",
      "2x": "/logos/wide/SleekInvoices-Logo-Wide@2x.png",
      "3x": "/logos/wide/SleekInvoices-Logo-Wide@3x.png",
    },
    srcset: `
      /logos/wide/SleekInvoices-Logo-Wide.png 1x,
      /logos/wide/SleekInvoices-Logo-Wide@2x.png 2x,
      /logos/wide/SleekInvoices-Logo-Wide@3x.png 3x
    `.trim(),
    width: 240,
    height: 60,
    aspectRatio: 4,
    description: "Full logo with text - use on desktop navigation",
  },

  // Compact Logo - Medium size logo
  compact: {
    svg: "/logos/compact/SleekInvoices-Logo-Compact.svg",
    png: {
      "1x": "/logos/compact/SleekInvoices-Logo-Compact.png",
      "2x": "/logos/compact/SleekInvoices-Logo-Compact@2x.png",
      "3x": "/logos/compact/SleekInvoices-Logo-Compact@3x.png",
    },
    srcset: `
      /logos/compact/SleekInvoices-Logo-Compact.png 1x,
      /logos/compact/SleekInvoices-Logo-Compact@2x.png 2x,
      /logos/compact/SleekInvoices-Logo-Compact@3x.png 3x
    `.trim(),
    width: 120,
    height: 60,
    aspectRatio: 2,
    description: "Compact logo - use on tablet and smaller screens",
  },

  // Monogram - Square icon only
  monogram: {
    svg: "/logos/monogram/SleekInvoices-Monogram-White.svg",
    png: {
      "1x": "/logos/monogram/SleekInvoices-Monogram-White.png",
      "2x": "/logos/monogram/SleekInvoices-Monogram-White@2x.png",
      "3x": "/logos/monogram/SleekInvoices-Monogram-White@3x.png",
    },
    srcset: `
      /logos/monogram/SleekInvoices-Monogram-White.png 1x,
      /logos/monogram/SleekInvoices-Monogram-White@2x.png 2x,
      /logos/monogram/SleekInvoices-Monogram-White@3x.png 3x
    `.trim(),
    width: 40,
    height: 40,
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
  svg: "/logos/monogram/SleekInvoices-Monogram-White.svg",
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
  // Mobile: < 640px (below sm)
  mobile: {
    variant: "monogram",
    width: 40,
    height: 40,
  },
  // Tablet: 640px - 1024px (sm to lg)
  tablet: {
    variant: "compact",
    width: 100,
    height: 50,
  },
  // Desktop: > 1024px (lg and up)
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
 */
export function getResponsiveLogoVariant(screenWidth: number) {
  if (screenWidth < 640) {
    return "monogram";
  } else if (screenWidth < 1024) {
    return "compact";
  } else {
    return "wide";
  }
}

export type LogoVariant = keyof typeof LOGO_ASSETS;
