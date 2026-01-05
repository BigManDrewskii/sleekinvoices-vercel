/**
 * HSL Color Utilities
 * Functions for converting between hex and HSL, and applying HSL adjustments
 */

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSLAdjustments {
  hueShift: number;       // -180 to 180 degrees
  saturationMult: number; // 0 to 2 (multiplier)
  lightnessMult: number;  // 0 to 2 (multiplier)
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSLColor {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex to RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
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
export function hslToHex(hsl: HSLColor): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Apply HSL adjustments to a hex color
 */
export function applyHSLAdjustments(hex: string, adjustments: HSLAdjustments): string {
  const hsl = hexToHSL(hex);
  
  // Apply hue shift (wrap around 0-360)
  let newH = (hsl.h + adjustments.hueShift) % 360;
  if (newH < 0) newH += 360;
  
  // Apply saturation multiplier (clamp 0-100)
  const newS = Math.min(100, Math.max(0, hsl.s * adjustments.saturationMult));
  
  // Apply lightness multiplier (clamp 0-100)
  const newL = Math.min(100, Math.max(0, hsl.l * adjustments.lightnessMult));
  
  return hslToHex({ h: newH, s: newS, l: newL });
}

/**
 * Apply HSL adjustments to multiple colors
 */
export function applyHSLToColors(
  colors: { primary: string; secondary: string; accent: string; background: string },
  adjustments: HSLAdjustments
): { primary: string; secondary: string; accent: string; background: string } {
  return {
    primary: applyHSLAdjustments(colors.primary, adjustments),
    secondary: applyHSLAdjustments(colors.secondary, adjustments),
    accent: applyHSLAdjustments(colors.accent, adjustments),
    background: applyHSLAdjustments(colors.background, adjustments),
  };
}

/**
 * Get a readable description of the HSL values
 */
export function getHSLDescription(hex: string): string {
  const hsl = hexToHSL(hex);
  return `H: ${hsl.h}° S: ${hsl.s}% L: ${hsl.l}%`;
}
