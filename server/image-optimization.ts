import sharp from "sharp";

/**
 * Image optimization configuration
 */
export const IMAGE_OPTIMIZATION_CONFIG = {
  // Maximum file size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  // Logo dimensions
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,

  // Quality settings for different formats
  WEBP_QUALITY: 80,
  JPEG_QUALITY: 85,
  PNG_COMPRESSION: 9,

  // Supported formats
  SUPPORTED_FORMATS: ["png", "jpg", "jpeg", "webp", "svg"],
};

/**
 * Detects image format from buffer
 */
export function detectImageFormat(buffer: Buffer): string | null {
  // Check for PNG signature
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  // Check for JPEG signature
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "jpeg";
  }

  // Check for WebP signature
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  // Check for SVG signature (text-based)
  if (buffer.toString("utf-8", 0, 100).includes("<svg")) {
    return "svg";
  }

  return null;
}

/**
 * Validates image file
 */
export function validateImageFile(
  buffer: Buffer,
  filename: string
): { valid: boolean; error?: string } {
  // Check file size
  if (buffer.length > IMAGE_OPTIMIZATION_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${IMAGE_OPTIMIZATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Detect format
  const format = detectImageFormat(buffer);
  if (!format) {
    return {
      valid: false,
      error: "Unsupported image format. Please use PNG, JPG, WebP, or SVG.",
    };
  }

  // Check file extension matches detected format
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && !IMAGE_OPTIMIZATION_CONFIG.SUPPORTED_FORMATS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension. Please use PNG, JPG, WebP, or SVG.`,
    };
  }

  return { valid: true };
}

/**
 * Optimizes PNG image
 */
export async function optimizePNG(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .png({
        compressionLevel: IMAGE_OPTIMIZATION_CONFIG.PNG_COMPRESSION,
      })
      .toBuffer();
  } catch (error) {
    console.error("[Image Optimization] PNG optimization failed:", error);
    // Return original buffer if optimization fails
    return buffer;
  }
}

/**
 * Optimizes JPEG image
 */
export async function optimizeJPEG(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .jpeg({
        quality: IMAGE_OPTIMIZATION_CONFIG.JPEG_QUALITY,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();
  } catch (error) {
    console.error("[Image Optimization] JPEG optimization failed:", error);
    // Return original buffer if optimization fails
    return buffer;
  }
}

/**
 * Converts image to WebP format with fallback
 */
export async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .webp({ quality: IMAGE_OPTIMIZATION_CONFIG.WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    console.error("[Image Optimization] WebP conversion failed:", error);
    // Return original buffer if conversion fails
    return buffer;
  }
}

/**
 * Optimizes SVG (pass-through, no compression)
 */
export async function optimizeSVG(buffer: Buffer): Promise<Buffer> {
  // SVG is already text-based and compressed, just return as-is
  return buffer;
}

/**
 * Main image optimization function
 * Optimizes image based on format and returns optimized buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  filename: string
): Promise<{
  buffer: Buffer;
  format: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}> {
  // Validate file
  const validation = validateImageFile(buffer, filename);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid image file");
  }

  const format = detectImageFormat(buffer);
  if (!format) {
    throw new Error("Could not detect image format");
  }

  const originalSize = buffer.length;
  let optimizedBuffer: Buffer;

  // Optimize based on format
  switch (format.toLowerCase()) {
    case "png":
      optimizedBuffer = await optimizePNG(buffer);
      break;
    case "jpeg":
    case "jpg":
      optimizedBuffer = await optimizeJPEG(buffer);
      break;
    case "webp":
      // WebP is already optimized, return as-is
      optimizedBuffer = buffer;
      break;
    case "svg":
      optimizedBuffer = await optimizeSVG(buffer);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const optimizedSize = optimizedBuffer.length;
  const compressionRatio = (1 - optimizedSize / originalSize) * 100;

  return {
    buffer: optimizedBuffer,
    format,
    originalSize,
    optimizedSize,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
  };
}

/**
 * Generates optimized versions of an image (WebP primary, original as fallback)
 */
export async function generateOptimizedVersions(
  buffer: Buffer,
  filename: string
): Promise<{
  primary: {
    buffer: Buffer;
    format: "webp";
    size: number;
  };
  fallback: {
    buffer: Buffer;
    format: string;
    size: number;
  };
  originalSize: number;
  totalSavings: number;
}> {
  // Validate and optimize original
  const optimized = await optimizeImage(buffer, filename);

  // Generate WebP version
  let webpBuffer: Buffer;
  try {
    webpBuffer = await convertToWebP(optimized.buffer);
  } catch (error) {
    console.error(
      "[Image Optimization] Failed to generate WebP version:",
      error
    );
    webpBuffer = optimized.buffer;
  }

  const originalSize = buffer.length;
  const webpSize = webpBuffer.length;
  const fallbackSize = optimized.buffer.length;
  const totalSavings = originalSize - Math.min(webpSize, fallbackSize);

  return {
    primary: {
      buffer: webpBuffer,
      format: "webp",
      size: webpSize,
    },
    fallback: {
      buffer: optimized.buffer,
      format: optimized.format,
      size: fallbackSize,
    },
    originalSize,
    totalSavings,
  };
}

/**
 * Gets file extension for format
 */
export function getFileExtension(format: string): string {
  switch (format.toLowerCase()) {
    case "jpeg":
    case "jpg":
      return "jpg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "svg":
      return "svg";
    default:
      return "png";
  }
}
