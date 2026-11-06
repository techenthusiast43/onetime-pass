/**
 * Cryptographic security utilities for OneTimePass.
 * Uses window.crypto (Web Cryptography API) to ensure cryptographically secure entropy.
 */

/**
 * Generates a cryptographically secure 256-bit (bytes32) pass ID.
 * Never uses sequential or predictable timestamps.
 */
export function generateSecurePassId(): string {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.getRandomValues) {
    throw new Error("Cryptographically secure PRNG is not supported in this environment.");
  }
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}

/**
 * Validates whether an input string is a valid non-zero bytes32 hex string.
 */
export function isValidBytes32(input: string): boolean {
  if (!input) return false;
  const clean = input.trim().toLowerCase();
  const hexRegex = /^0x[0-9a-f]{64}$/;
  if (!hexRegex.test(clean)) return false;
  // Ensure not zero hash
  const zeroHash = "0x" + "0".repeat(64);
  return clean !== zeroHash;
}

/**
 * Shortens a 66-character bytes32 string for dashboard display.
 */
export function shortenHash(hash: string, lead = 8, trail = 6): string {
  if (!hash) return "";
  if (hash.length <= lead + trail + 2) return hash;
  return `${hash.slice(0, lead + 2)}...${hash.slice(-trail)}`;
}

/**
 * Formats a Unix timestamp (seconds) into a readable localized date and time.
 */
export function formatTimestamp(timestamp: number): string {
  if (!timestamp || timestamp === 0) return "Never (No Expiry)";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

