import { createHash } from "node:crypto";

/**
 * Compute the SHA-256 hash of a buffer or string.
 *
 * @returns The hash as a lowercase hex string (64 characters).
 *
 * @example
 * ```ts
 * sha256("hello world"); // "b94d27b9..."
 * sha256(Buffer.from([0x01, 0x02])); // "..."
 * ```
 */
export function sha256(data: Buffer | string): string {
	return createHash("sha256").update(data).digest("hex");
}
