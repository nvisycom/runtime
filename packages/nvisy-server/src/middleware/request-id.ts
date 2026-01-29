import type { MiddlewareHandler } from "hono";

/** Adds a unique request ID to each request. */
export const requestId: MiddlewareHandler = async (c, next) => {
	const id = c.req.header("x-request-id") ?? crypto.randomUUID();
	c.set("requestId", id);
	c.header("x-request-id", id);
	await next();
};
