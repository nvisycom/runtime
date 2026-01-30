import type { MiddlewareHandler } from "hono";

/**
 * Assigns a unique request ID to every inbound request.
 *
 * Sets the `X-Request-Id` response header and stores the ID
 * in the Hono context for downstream handlers.
 */
export function requestId(): MiddlewareHandler {
	return async (c, next) => {
		const id = crypto.randomUUID();
		c.set("requestId", id);
		c.header("X-Request-Id", id);
		await next();
	};
}
