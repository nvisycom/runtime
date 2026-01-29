import type { MiddlewareHandler } from "hono";

/** Logs request method, path, status, and duration. */
export const logger: MiddlewareHandler = async (c, next) => {
	const start = performance.now();
	await next();
	const duration = (performance.now() - start).toFixed(1);
	const status = c.res.status;
	console.log(`${c.req.method} ${c.req.path} ${status} ${duration}ms`);
};
