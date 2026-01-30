import type { MiddlewareHandler } from "hono";

/**
 * Logs every request as a structured JSON line.
 *
 * Emits method, path, status, and duration on completion.
 */
export function requestLogger(): MiddlewareHandler {
	return async (c, next) => {
		const start = performance.now();
		await next();
		const ms = (performance.now() - start).toFixed(1);

		console.log(
			JSON.stringify({
				level: "info",
				msg: "request",
				method: c.req.method,
				path: c.req.path,
				status: c.res.status,
				ms,
				requestId: c.get("requestId"),
			}),
		);
	};
}
