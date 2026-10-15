/**
 * Minimal hex helpers (no `Buffer` — browser-safe without polyfills).
 */

/**
 * Encode bytes as lowercase hex.
 *
 * @param bytes - The bytes to encode.
 * @returns Hex string.
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
