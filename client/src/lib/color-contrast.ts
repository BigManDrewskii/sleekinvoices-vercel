/**
 * Color Contrast Utilities
 *
 * WCAG 2.1 compliant contrast ratio calculations and automatic
 * color adjustment for accessibility.
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
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
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
 * Calculate contrast ratio between two colors (WCAG formula)
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * Returns a value between 1 and 21
 * - 4.5:1 minimum for normal text (AA)
 * - 3:1 minimum for large text (AA)
 * - 7:1 minimum for normal text (AAA)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 */
export function meetsContrastAAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
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
 * Lightens or darkens the color until it meets the target ratio
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
  const step = bgIsLight ? -10 : 10; // Darken for light bg, lighten for dark bg

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
 * Generate a complementary accent color that contrasts well with both
 * the primary color and a white/dark background
 */
export function generateContrastingAccent(
  primaryColor: string,
  backgroundColor: string = "#ffffff"
): string {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return "#5f6fff";

  // Rotate hue by ~180 degrees for complementary color
  // Simple approximation: swap dominant channel
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);

  let accent: { r: number; g: number; b: number };

  if (rgb.r === max) {
    accent = { r: min, g: rgb.b, b: rgb.g };
  } else if (rgb.g === max) {
    accent = { r: rgb.b, g: min, b: rgb.r };
  } else {
    accent = { r: rgb.g, g: rgb.r, b: min };
  }

  // Ensure the accent meets contrast requirements
  let accentHex = rgbToHex(accent.r, accent.g, accent.b);
  return adjustColorForContrast(accentHex, backgroundColor, 4.5);
}

/**
 * Create a color palette with guaranteed contrast ratios
 */
export interface ContrastSafePalette {
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  background: string;
  text: string;
  muted: string;
  mutedText: string;
}

export function createContrastSafePalette(
  primaryColor: string,
  accentColor: string,
  backgroundColor: string = "#ffffff"
): ContrastSafePalette {
  const bgIsLight = isLightColor(backgroundColor);

  // Adjust primary and accent to meet contrast against background
  const safePrimary = adjustColorForContrast(
    primaryColor,
    backgroundColor,
    4.5
  );
  const safeAccent = adjustColorForContrast(accentColor, backgroundColor, 4.5);

  // Text colors for primary and accent backgrounds
  const primaryText = getOptimalTextColor(safePrimary);
  const accentText = getOptimalTextColor(safeAccent);

  // Main text color
  const text = bgIsLight ? "#18181b" : "#fafafa";

  // Muted colors
  const muted = bgIsLight ? "#f4f4f5" : "#27272a";
  const mutedText = bgIsLight ? "#71717a" : "#a1a1aa";

  return {
    primary: safePrimary,
    primaryText,
    accent: safeAccent,
    accentText,
    background: backgroundColor,
    text,
    muted,
    mutedText,
  };
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
 * Convert hex color to HSL
 */
export function hexToHsl(
  hex: string
): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  );
}

/**
 * Generate harmonious accent color from primary using color theory
 * Uses complementary color (180° hue rotation) with saturation/lightness adjustments
 */
export function generateAccentColor(primaryColor: string): string {
  const hsl = hexToHsl(primaryColor);
  if (!hsl) return "#10b981"; // Default green accent

  // Rotate hue by 180° for complementary color
  let accentHue = (hsl.h + 180) % 360;

  // Adjust saturation and lightness for visual harmony
  // If primary is very saturated, reduce accent saturation slightly
  // If primary is dark, make accent lighter (and vice versa)
  const accentSaturation = hsl.s > 70 ? Math.max(50, hsl.s - 20) : hsl.s;
  const accentLightness =
    hsl.l < 40 ? Math.min(65, hsl.l + 25) : Math.max(35, hsl.l - 10);

  const accentHex = hslToHex(accentHue, accentSaturation, accentLightness);

  // Ensure the accent meets WCAG AA contrast against white background
  return adjustColorForContrast(accentHex, "#ffffff", 4.5);
}
