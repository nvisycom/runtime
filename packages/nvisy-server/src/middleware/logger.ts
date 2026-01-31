/**
 * Structured request logger using the Effect logger.
 *
 * Accepts an Effect `Runtime` so log output inherits the configured
 * logger layer (pretty in dev, structured in prod).
 */

import type { MiddlewareHandler } from "hono";
import { Effect, Runtime } from "effect";

export function requestLogger(
	runtime: Runtime.Runtime<never>,
): MiddlewareHandler {
	return async (c, next) => {
		const start = performance.now();
		await next();
		const ms = (performance.now() - start).toFixed(1);

		Runtime.runSync(runtime)(
			Effect.logInfo("Request").pipe(
				Effect.annotateLogs({
					method: c.req.method,
					path: c.req.path,
					status: c.res.status,
					ms,
					requestId: c.get("requestId"),
				}),
			),
		);
	};
}
