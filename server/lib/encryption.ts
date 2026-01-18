/**
 * Encryption utility for secure storage of sensitive data
 * Uses AES-256-GCM algorithm for authenticated encryption
 *
 * Usage:
 * - encrypt(plaintext) - Returns base64 encoded ciphertext with IV and auth tag
 * - decrypt(ciphertext) - Returns original plaintext
 *
 * Environment:
 * - ENCRYPTION_KEY: 32-byte hex string (64 characters)
 */

import crypto from "crypto";

// AES-256-GCM configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 * Falls back to a default key for development (NOT for production)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // Generate a deterministic key for development
    // In production, ENCRYPTION_KEY must be set
    console.warn("[Encryption] ENCRYPTION_KEY not set, using development key");
    return crypto.scryptSync("development-key-not-for-production", "salt", 32);
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Base64 encoded string containing IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();

  // Generate random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt the plaintext
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted + authTag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param ciphertext - Base64 encoded string from encrypt()
 * @returns Original plaintext
 * @throws Error if decryption fails (tampered data or wrong key)
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();

  // Decode from base64
  const combined = Buffer.from(ciphertext, "base64");

  // Extract IV, encrypted data, and auth tag
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH
  );

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set auth tag for verification
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Generate a new random encryption key
 * @returns 64-character hex string suitable for ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Encrypt a JSON object
 * @param data - Object to encrypt
 * @returns Base64 encoded encrypted string
 */
export function encryptJSON<T>(data: T): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt to a JSON object
 * @param ciphertext - Base64 encoded encrypted string
 * @returns Decrypted object
 */
export function decryptJSON<T>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext));
}
