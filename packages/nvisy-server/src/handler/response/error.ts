import { z } from "zod";

/**
 * Unified JSON error envelope returned by all error responses.
 *
 * Every error — 4xx, 5xx, `onError`, `notFound` — uses this shape.
 */
export const ErrorResponse = z.object({
	/** HTTP status code. */
	status: z.number(),
	/** Human-readable error message. */
	error: z.string(),
	/** Per-request correlation ID (from the `X-Request-Id` header). */
	requestId: z.string().optional(),
	/** Stack trace (development mode only). */
	stack: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
