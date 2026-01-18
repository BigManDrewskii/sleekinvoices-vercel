import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastRatio,
  getOptimalTextColor,
  adjustColorForContrast,
  createPDFColorPalette,
  withAlpha,
} from "./color-contrast";

describe("Color Contrast Utilities", () => {
  describe("hexToRgb", () => {
    it("should convert 6-digit hex to RGB", () => {
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#18181b")).toEqual({ r: 24, g: 24, b: 27 });
    });

    it("should handle 3-digit hex by returning null (not supported)", () => {
      // Implementation only supports 6-digit hex
      expect(hexToRgb("#fff")).toBeNull();
      expect(hexToRgb("#000")).toBeNull();
    });

    it("should handle hex without hash", () => {
      expect(hexToRgb("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("000000")).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("rgbToHex", () => {
    it("should convert RGB to hex", () => {
      expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
      expect(rgbToHex(0, 0, 0)).toBe("#000000");
      expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
      expect(rgbToHex(24, 24, 27)).toBe("#18181b");
    });
  });

  describe("getLuminance", () => {
    it("should calculate luminance correctly", () => {
      expect(getLuminance("#ffffff")).toBeCloseTo(1, 2);
      expect(getLuminance("#000000")).toBeCloseTo(0, 2);
      // Gray should be around 0.5 relative luminance
      expect(getLuminance("#808080")).toBeGreaterThan(0.2);
      expect(getLuminance("#808080")).toBeLessThan(0.3);
    });
  });

  describe("getContrastRatio", () => {
    it("should calculate contrast ratio between colors", () => {
      // Black and white should have maximum contrast (21:1)
      expect(getContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
      // Same colors should have minimum contrast (1:1)
      expect(getContrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 0);
      expect(getContrastRatio("#000000", "#000000")).toBeCloseTo(1, 0);
    });

    it("should return same ratio regardless of order", () => {
      const ratio1 = getContrastRatio("#ffffff", "#18181b");
      const ratio2 = getContrastRatio("#18181b", "#ffffff");
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });
  });

  describe("getOptimalTextColor", () => {
    it("should return white text for dark backgrounds", () => {
      expect(getOptimalTextColor("#000000")).toBe("#ffffff");
      expect(getOptimalTextColor("#18181b")).toBe("#ffffff");
      expect(getOptimalTextColor("#1a1a2e")).toBe("#ffffff");
    });

    it("should return black text for light backgrounds", () => {
      expect(getOptimalTextColor("#ffffff")).toBe("#18181b");
      expect(getOptimalTextColor("#f5f5f5")).toBe("#18181b");
      expect(getOptimalTextColor("#e0e0e0")).toBe("#18181b");
    });

    it("should handle mid-tone colors", () => {
      // For mid-tone colors, should still return a valid text color
      const textColor = getOptimalTextColor("#808080");
      expect(textColor).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("adjustColorForContrast", () => {
    it("should return original color if contrast is sufficient", () => {
      // White text on dark background should pass
      const result = adjustColorForContrast("#ffffff", "#18181b", 4.5);
      expect(result).toBe("#ffffff");
    });

    it("should adjust color if contrast is insufficient", () => {
      // Light gray on white needs adjustment
      const result = adjustColorForContrast("#e0e0e0", "#ffffff", 4.5);
      // Result should have better contrast than original
      const originalContrast = getContrastRatio("#e0e0e0", "#ffffff");
      const newContrast = getContrastRatio(result, "#ffffff");
      expect(newContrast).toBeGreaterThanOrEqual(originalContrast);
    });
  });

  describe("createPDFColorPalette", () => {
    it("should create a complete color palette", () => {
      const palette = createPDFColorPalette("#18181b", "#10b981");

      expect(palette).toHaveProperty("primary");
      expect(palette).toHaveProperty("primaryText");
      expect(palette).toHaveProperty("accent");
      expect(palette).toHaveProperty("accentText");
      expect(palette).toHaveProperty("muted");
      expect(palette).toHaveProperty("divider");
    });

    it("should ensure text colors have good contrast", () => {
      const palette = createPDFColorPalette("#18181b", "#10b981");

      // Primary text should contrast well with primary
      const primaryContrast = getContrastRatio(
        palette.primaryText,
        palette.primary
      );
      expect(primaryContrast).toBeGreaterThanOrEqual(4.5);

      // Accent text should contrast well with accent
      const accentContrast = getContrastRatio(
        palette.accentText,
        palette.accent
      );
      expect(accentContrast).toBeGreaterThanOrEqual(4.5);
    });

    it("should handle light primary colors by adjusting for contrast", () => {
      const palette = createPDFColorPalette("#f5f5f5", "#3b82f6");

      // Light primary gets adjusted for better contrast on white background
      expect(palette.primary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(palette.primaryText).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("should handle dark accent colors", () => {
      const palette = createPDFColorPalette("#18181b", "#1a1a2e");

      expect(palette.accent).toBe("#1a1a2e");
      expect(palette.accentText).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("withAlpha", () => {
    it("should convert hex to rgba", () => {
      expect(withAlpha("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
      expect(withAlpha("#ffffff", 0.25)).toBe("rgba(255, 255, 255, 0.25)");
      expect(withAlpha("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
    });

    it("should return original hex if conversion fails", () => {
      // 3-digit hex not supported, returns original
      expect(withAlpha("#fff", 0.5)).toBe("#fff");
      expect(withAlpha("#000", 0.5)).toBe("#000");
    });
  });
});
