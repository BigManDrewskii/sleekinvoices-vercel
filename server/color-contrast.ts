/**
 * Server-side Color Contrast Utilities
 *
 * WCAG 2.1 compliant contrast ratio calculations for PDF generation
 */

/**
 * Parse a hex color to RGB values
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.179;
}

/**
 * Get optimal text color (black or white) for a given background
 */
export function getOptimalTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? "#18181b" : "#ffffff";
}

/**
 * Adjust a color to meet contrast requirements against a background
 */
export function adjustColorForContrast(
  color: string,
  backgroundColor: string,
  targetRatio: number = 4.5
): string {
  const currentRatio = getContrastRatio(color, backgroundColor);
  if (currentRatio >= targetRatio) return color;

  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const bgIsLight = isLightColor(backgroundColor);
  const step = bgIsLight ? -10 : 10;

  let { r, g, b } = rgb;
  let iterations = 0;
  const maxIterations = 50;

  while (
    getContrastRatio(rgbToHex(r, g, b), backgroundColor) < targetRatio &&
    iterations < maxIterations
  ) {
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));
    iterations++;
  }

  return rgbToHex(r, g, b);
}

/**
 * Lighten a color by a percentage
 */
export function lighten(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = Math.round(255 * (percent / 100));
  return rgbToHex(
    Math.min(255, rgb.r + amount),
    Math.min(255, rgb.g + amount),
    Math.min(255, rgb.b + amount)
  );
}

/**
 * Darken a color by a percentage
 */
export function darken(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = Math.round(255 * (percent / 100));
  return rgbToHex(
    Math.max(0, rgb.r - amount),
    Math.max(0, rgb.g - amount),
    Math.max(0, rgb.b - amount)
  );
}

/**
 * Add alpha to a hex color (returns rgba string)
 */
export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Create a contrast-safe color palette for PDF generation
 */
export interface PDFColorPalette {
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  muted: string;
  divider: string;
}

export function createPDFColorPalette(
  primaryColor: string = "#18181b",
  accentColor: string = "#5f6fff"
): PDFColorPalette {
  const backgroundColor = "#ffffff";

  const safePrimary = adjustColorForContrast(
    primaryColor,
    backgroundColor,
    4.5
  );
  const safeAccent = adjustColorForContrast(accentColor, backgroundColor, 4.5);

  const primaryText = getOptimalTextColor(safePrimary);
  const accentText = getOptimalTextColor(safeAccent);

  const muted = isLightColor(safePrimary)
    ? darken(safePrimary, 30)
    : lighten(safePrimary, 40);

  const divider = withAlpha(safePrimary, 0.15);

  return {
    primary: safePrimary,
    primaryText,
    accent: safeAccent,
    accentText,
    muted,
    divider,
  };
}
