import { createHash } from "node:crypto";

/** Compute SHA-256 hash of a buffer or string. Returns hex string. */
export function sha256(data: Buffer | string): string {
	return createHash("sha256").update(data).digest("hex");
}
